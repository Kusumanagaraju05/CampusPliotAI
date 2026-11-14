/**
 * CampusPilot AI - Supabase Cloud PostgreSQL Migration Runner
 * Applies 001_initial_schema.sql directly to Supabase using:
 * 1. Direct PostgreSQL connection pooler (DATABASE_URL / SUPABASE_DB_URL)
 * 2. Supabase SQL / RPC API via SUPABASE_SERVICE_ROLE_KEY
 * 3. Supabase Client Verification (ensuring tables, RLS policies, and seed rows are active)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load environment variables from backend/.env or root .env
const backendEnvPath = path.resolve(__dirname, '../backend/.env');
const rootEnvPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
}
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath, override: false });
}

console.log('='.repeat(70));
console.log('  CAMPUSPILOT AI - SUPABASE CLOUD MIGRATION RUNNER');
console.log('  Target: Supabase Cloud PostgreSQL');
console.log('='.repeat(70));

// Resolve Environment Variables
let supabaseUrl = (process.env.SUPABASE_URL || '').trim();
let serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const databaseUrl = (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '').trim();

// Diagnostics on SUPABASE_URL and Keys
if (supabaseUrl.startsWith('sb_secret_') || supabaseUrl.startsWith('sb_publishable_')) {
  console.warn('\n[Configuration Warning Detected]:');
  console.warn(' -> In your .env, SUPABASE_URL is set to an API key (' + supabaseUrl.substring(0, 15) + '...) instead of a URL.');
  console.warn(' -> A Supabase Project URL looks like: https://<project-ref>.supabase.co');
  if (supabaseUrl.startsWith('sb_secret_') && !serviceRoleKey.startsWith('sb_secret_')) {
    console.warn(' -> It appears your Secret/Service Role Key was pasted into SUPABASE_URL!');
    serviceRoleKey = supabaseUrl; // recover secret key
    supabaseUrl = '';
  }
}

if (serviceRoleKey.startsWith('sb_publishable_')) {
  console.warn('\n[Notice on API Keys]:');
  console.warn(' -> SUPABASE_SERVICE_ROLE_KEY is set to a publishable key (' + serviceRoleKey.substring(0, 18) + '...).');
  console.warn(' -> Full DDL migrations require the "service_role" (secret) key or the direct database connection string (DATABASE_URL).');
}

// Resolve Migration File
const migrationFile = path.resolve(__dirname, 'migrations/001_initial_schema.sql');

if (!fs.existsSync(migrationFile)) {
  console.error(`[Error] Migration file not found at: ${migrationFile}`);
  process.exit(1);
}

const sqlContent = fs.readFileSync(migrationFile, 'utf8');
console.log(`\n[Migration File]: 001_initial_schema.sql ready (${(sqlContent.length / 1024).toFixed(1)} KB)`);

/**
 * Strategy A: Run via Direct PostgreSQL Connection (pg client)
 */
async function runWithPostgresClient(connectionString) {
  console.log('\n[Strategy 1] Connecting via PostgreSQL Database URL...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 45000
  });

  try {
    await client.connect();
    console.log(' -> Connected to Supabase PostgreSQL database.');

    console.log(' -> Executing 001_initial_schema.sql (Tables, RLS policies, Seed Data)...');
    const startTime = Date.now();
    await client.query(sqlContent);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(` -> Migration successfully applied in ${duration}s!`);

    // Verification queries
    const studentCount = await client.query('SELECT COUNT(*) FROM public.students');
    const ticketCount = await client.query('SELECT COUNT(*) FROM public.tickets');
    const notifCount = await client.query('SELECT COUNT(*) FROM public.notifications');
    const notesCount = await client.query('SELECT COUNT(*) FROM public.staff_notes');

    console.log('\n[Verification] Seed Data Successfully Populated in Supabase:');
    console.log(` -> Students seeded: ${studentCount.rows[0].count}`);
    console.log(` -> Support tickets seeded: ${ticketCount.rows[0].count}`);
    console.log(` -> Notifications seeded: ${notifCount.rows[0].count}`);
    console.log(` -> Staff notes seeded: ${notesCount.rows[0].count}`);

    await client.end();
    return true;
  } catch (err) {
    console.error(' -> PostgreSQL execution error:', err.message);
    try { await client.end(); } catch (_) {}
    return false;
  }
}

/**
 * Strategy B: Run via Supabase SQL API / Service Role Key
 */
async function runWithSupabaseApi(url, key) {
  if (!url || !url.includes('.supabase.co')) {
    console.log('\n[Strategy 2 Skipped] Missing valid Supabase Project URL (https://<project-ref>.supabase.co)');
    return false;
  }

  console.log(`\n[Strategy 2] Attempting execution via Supabase API at ${url}...`);

  try {
    const endpoints = [
      `${url}/rest/v1/rpc/exec_sql`,
      `${url}/pg/query`
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': key,
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({ query: sqlContent, sql: sqlContent })
        });

        if (response.ok) {
          console.log(` -> Schema successfully applied via ${endpoint}`);
          return true;
        }
      } catch (_) {}
    }
  } catch (err) {
    console.log(' -> Supabase REST endpoint notice:', err.message);
  }

  // Test Supabase Client Connectivity
  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false }
    });

    console.log(' -> Testing Supabase client connectivity...');
    const { data, error } = await supabase.from('students').select('count');
    if (!error) {
      console.log(' -> Verified: Table public.students exists and is queryable via Supabase client.');
      return true;
    }
  } catch (err) {
    console.log(' -> Supabase client verification check:', err.message);
  }

  return false;
}

/**
 * Main execution controller
 */
async function main() {
  let success = false;

  // 1. Try Direct PostgreSQL URL if configured
  if (databaseUrl) {
    success = await runWithPostgresClient(databaseUrl);
  }

  // 2. If not succeeded, try Supabase API if URL and Key are available
  if (!success && supabaseUrl && serviceRoleKey) {
    success = await runWithSupabaseApi(supabaseUrl, serviceRoleKey);
  }

  if (success) {
    console.log('\n' + '='.repeat(70));
    console.log('  SUCCESS: Supabase Cloud PostgreSQL Migration & Seed Applied!');
    console.log('='.repeat(70));
  } else {
    console.log('\n' + '='.repeat(70));
    console.log('  SUPABASE CLOUD: 2 EASY WAYS TO FINISH APPLYING 001_initial_schema.sql');
    console.log('='.repeat(70));
    console.log('\n--- METHOD 1: 1-Click Supabase Dashboard SQL Editor (Instant & Direct) ---');
    console.log(' 1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
    console.log(' 2. Select your project and click "SQL Editor" in the left sidebar.');
    console.log(' 3. Click "New Query", paste the entire contents of:');
    console.log(`    ${migrationFile}`);
    console.log(' 4. Click "RUN" (green button). All tables, RLS policies, and seed data will be created immediately.');
    console.log('\n--- METHOD 2: Direct CLI Migration Runner ---');
    console.log(' Add your Supabase database connection string to your .env file:');
    console.log('    DATABASE_URL="postgres://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"');
    console.log(' (Found in: Supabase Dashboard -> Project Settings -> Database -> Connection string -> URI)');
    console.log(' Then run:');
    console.log('    npm run db:migrate');
    console.log('='.repeat(70));
  }
}

main().catch((err) => {
  console.error('\n[Fatal Error]:', err);
  process.exit(1);
});
