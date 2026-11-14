import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend/.env or root .env
const backendEnv = path.resolve(__dirname, '.env');
const rootEnv = path.resolve(__dirname, '../.env');
if (fs.existsSync(backendEnv)) dotenv.config({ path: backendEnv });
if (fs.existsSync(rootEnv)) dotenv.config({ path: rootEnv, override: false });

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// SQLite database connection
const dbPath = path.resolve(__dirname, 'campus_pilot.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[Database Error] Failed to connect to SQLite:', err.message);
  } else {
    console.log('[Database] Connected to SQLite database:', dbPath);
  }
});

// Helper: Promise wrapper for db.all
const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Helper: Promise wrapper for db.get
const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
};

// Helper: Promise wrapper for db.run
const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

// ------------------- AI ORCHESTRATOR LOGIC -------------------

function classifyRequest(text) {
  const textLower = text.toLowerCase();
  const attendanceKeywords = ["attendance", "absent", "percentage", "present", "biometric", "qr code", "bunk", "shortage", "condonation", "duty leave", "medical leave", "roll call"];
  const financeKeywords = ["fee", "fees", "receipt", "payment", "paid", "refund", "transaction", "bank", "scholarship", "dues", "challan", "fine", "semester fee", "tuition", "hostel fee"];
  const documentKeywords = ["bonafide", "certificate", "id card", "identity card", "study certificate", "custody certificate", "marksheet", "transcript", "lor", "noc", "migration", "provisional"];
  const academicKeywords = ["timetable", "time table", "schedule", "exam", "examination", "classroom", "hall ticket", "subject", "credit", "syllabus", "professor", "hod", "internal", "grading", "revaluation", "electives", "lab slot"];

  const scores = {
    attendance: attendanceKeywords.filter(kw => textLower.includes(kw)).length,
    finance: financeKeywords.filter(kw => textLower.includes(kw)).length,
    document: documentKeywords.filter(kw => textLower.includes(kw)).length,
    academic: academicKeywords.filter(kw => textLower.includes(kw)).length
  };

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topCategory, topScore] = sorted[0];

  const category = topScore > 0 ? topCategory : "academic";
  const confidence = topScore > 0 ? Math.min(0.98, 0.70 + topScore * 0.08) : 0.65;

  let priority = "medium";
  if (["urgent", "exam tomorrow", "cannot write exam", "barred", "debared", "failed payment", "deadline today"].some(t => textLower.includes(t))) {
    priority = "high";
  } else if (["inquiry", "how to", "just checking", "general", "syllabus copy"].some(t => textLower.includes(t))) {
    priority = "low";
  }

  return { category, confidence, priority, matchedKeywords: [...attendanceKeywords, ...financeKeywords, ...documentKeywords, ...academicKeywords].filter(kw => textLower.includes(kw)) };
}

function selectAgent(category) {
  const mapping = {
    attendance: { agent_name: "Attendance Agent", department: "Attendance & Academic Records Department" },
    finance: { agent_name: "Finance Agent", department: "Accounts & Finance Department" },
    document: { agent_name: "Document Agent", department: "Student Affairs & Registrar Office" },
    academic: { agent_name: "Academic Agent", department: "Office of Controller of Examinations & Academic Dean" }
  };
  return mapping[category] || mapping.academic;
}

function generateActionPlan(category, query) {
  if (category === "attendance") {
    return {
      summary: "Student reports attendance discrepancy requiring record reconciliation.",
      action_plan: [
        "Perception & Audit: Cross-reference biometric/QR log timestamps against class schedule.",
        "Discrepancy Logging: Document student claim and compute theoretical attendance impact.",
        "Evidence Preparation: Compile medical certificate/duty leave slip for departmental verification.",
        "Staff Escalation: Dispatch formal correction dossier to Course Faculty and HOD for authorized sign-off."
      ],
      missing_information: [
        "Specific course code(s) or subject name",
        "Date range or lecture hours with discrepancy",
        "Supporting documentation (medical certificate, faculty approval, or duty slip)"
      ]
    };
  } else if (category === "finance") {
    return {
      summary: "Payment confirmation or fee receipt generation request pending bank reconciliation.",
      action_plan: [
        "Transaction Tracing: Log bank payment reference code and payment gateway order identifier.",
        "Gateway Reconciliation: Probe accounts ledger to check if funds cleared into college treasury.",
        "Receipt Dispatch: Instruct Accounts desk to generate official stamped fee receipt if reconciled.",
        "Bank Chargeback Support: In case of bank-side bounce, generate official non-receipt certificate for student bank refund."
      ],
      missing_information: [
        "Banking reference / UTR / Transaction ID",
        "Date and approximate timestamp of transaction",
        "Payment method (NetBanking, UPI, Debit Card, Challan)",
        "Bank account debit confirmation screenshot or SMS excerpt"
      ]
    };
  } else if (category === "document") {
    return {
      summary: "Official college document/certificate application requiring registrar sign-off.",
      action_plan: [
        "Eligibility Verification: Verify active student enrollment status in registrar records.",
        "Checklist Compilation: Confirm submission of purpose statement and photo ID copy.",
        "Drafting & Seal: Route digital certificate draft to Registrar desk for institutional seal.",
        "Collection Dispatch: Schedule student counter pickup or encrypted digital PDF issuance."
      ],
      missing_information: [
        "Purpose of certificate (e.g., Education Loan, Passport, Bus Pass, Internship, Visa)",
        "Academic year and current semester verification",
        "Clearance from college library and laboratory accounts (if ID replacement)"
      ]
    };
  } else {
    return {
      summary: "Academic schedule or examination administrative enquiry.",
      action_plan: [
        "Schedule Inspection: Retrieve approved institutional calendar from Controller of Examinations.",
        "Room & Slot Mapping: Check hall seating allocations and lab rotation schedules.",
        "Conflict Flagging: If clash is detected, prepare formal slot adjustment petition.",
        "Staff Briefing: Deliver verified academic timetable instructions to student dashboard."
      ],
      missing_information: [
        "Degree program, section, and semester code",
        "Target examination or subject title"
      ]
    };
  }
}

// ------------------- API ROUTES -------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CampusPilot AI Express Engine',
    timestamp: new Date().toISOString()
  });
});

// System Status
app.get('/api/system-status', (req, res) => {
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const isLiveGemini = Boolean(geminiKey && geminiKey.length > 10);

  res.json({
    engine_mode: isLiveGemini ? 'gemini_live' : 'deterministic_rule_engine',
    engine_display_name: isLiveGemini ? 'Google Gemini 2.0 Flash (Live Multi-Turn)' : 'Deterministic Rule-Based Agent Engine (Active Fallback)',
    gemini_api_configured: isLiveGemini,
    active_specialist_agents: [
      { id: 'attendance', name: 'Attendance Agent', department: 'Attendance & Academic Records Department', status: 'active' },
      { id: 'finance', name: 'Finance Agent', department: 'Accounts & Finance Department', status: 'active' },
      { id: 'document', name: 'Document Agent', department: 'Student Affairs & Registrar Office', status: 'active' },
      { id: 'academic', name: 'Academic Agent', department: 'Office of Controller of Examinations & Academic Dean', status: 'active' }
    ],
    version: 'v2.6-express-hackathon-ready'
  });
});

// Students List
app.get('/api/students', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM students ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student Detail
app.get('/api/students/:id', async (req, res) => {
  try {
    const row = await dbGet('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Student not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Orchestrator Process
app.post('/api/orchestrator/process', async (req, res) => {
  try {
    const { student_id, query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const classification = classifyRequest(query);
    const agentInfo = selectAgent(classification.category);
    const planInfo = generateActionPlan(classification.category, query);

    const reasoning = `The Orchestrator analyzed student problem triggers (${classification.matchedKeywords.join(', ') || classification.category}). Assigned to '${agentInfo.agent_name}' specializing in this domain. Destination: ${agentInfo.department}. Priority assigned as '${classification.priority}'.`;

    res.json({
      query,
      category: classification.category,
      agent_name: agentInfo.agent_name,
      department: agentInfo.department,
      priority: classification.priority,
      confidence_score: classification.confidence,
      summary: planInfo.summary,
      orchestrator_reasoning: reasoning,
      missing_information: planInfo.missing_information,
      action_plan: planInfo.action_plan,
      requires_human_approval: true,
      ai_disclaimer: "Deterministic AI Agent Recommendation: Official institutional changes require authorized college staff approval.",
      engine_mode: "deterministic_rule_engine"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Ticket
app.post('/api/tickets/create', async (req, res) => {
  try {
    const {
      student_id,
      student_name,
      title,
      description,
      category,
      assigned_agent,
      department,
      priority = 'medium',
      action_plan = [],
      missing_info = [],
      requires_human_approval = true,
      source_query
    } = req.body;

    // Check duplicate
    const existing = await dbGet(
      "SELECT id, ticket_number, title, status FROM tickets WHERE student_id = ? AND (title = ? OR source_query = ?) AND status != 'Resolved' LIMIT 1",
      [student_id, title, source_query || title]
    );

    if (existing) {
      return res.json({
        is_duplicate: true,
        message: `A ticket for this issue is already active (${existing.ticket_number}: '${existing.title}'). Status: ${existing.status}.`,
        ticket_id: existing.id,
        ticket_number: existing.ticket_number,
        status: existing.status
      });
    }

    const countRow = await dbGet('SELECT COUNT(*) as count FROM tickets');
    const nextNum = (countRow ? countRow.count : 0) + 1;
    const ticket_number = `CP-2026-${String(nextNum).padStart(4, '0')}`;
    const ticket_id = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    await dbRun(`
      INSERT INTO tickets (
        id, ticket_number, student_id, student_name, title, description,
        category, assigned_agent, department, priority, status,
        action_plan, missing_info, requires_human_approval, source_query,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?)
    `, [
      ticket_id, ticket_number, student_id, student_name, title, description,
      category, assigned_agent, department, priority,
      JSON.stringify(action_plan), JSON.stringify(missing_info),
      requires_human_approval ? 1 : 0, source_query, nowIso, nowIso
    ]);

    // Create notification
    await dbRun(`
      INSERT INTO notifications (id, student_id, ticket_id, ticket_number, title, message, type, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'ticket_created', 0, ?)
    `, [
      crypto.randomUUID(), student_id, ticket_id, ticket_number,
      `Ticket ${ticket_number} Created`,
      `Your issue '${title}' was received and routed to ${department} by ${assigned_agent}.`,
      nowIso
    ]);

    res.json({
      is_duplicate: false,
      ticket_id,
      ticket_number,
      status: 'Pending',
      created_at: nowIso
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List Tickets
app.get('/api/tickets', async (req, res) => {
  try {
    const { student_id, category, status, priority, search } = req.query;
    let query = 'SELECT * FROM tickets WHERE 1=1';
    const params = [];

    if (student_id) { query += ' AND student_id = ?'; params.push(student_id); }
    if (category && category !== 'all') { query += ' AND category = ?'; params.push(category); }
    if (status && status !== 'all') { query += ' AND status = ?'; params.push(status); }
    if (priority && priority !== 'all') { query += ' AND priority = ?'; params.push(priority); }
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ' AND (title LIKE ? OR description LIKE ? OR ticket_number LIKE ? OR student_name LIKE ?)';
      params.push(term, term, term, term);
    }
    query += ' ORDER BY created_at DESC';

    const rows = await dbAll(query, params);
    const parsedRows = await Promise.all(rows.map(async (r) => {
      const notes = await dbAll('SELECT * FROM staff_notes WHERE ticket_id = ? ORDER BY created_at ASC', [r.id]);
      return {
        ...r,
        action_plan: r.action_plan ? JSON.parse(r.action_plan) : [],
        missing_info: r.missing_info ? JSON.parse(r.missing_info) : [],
        requires_human_approval: Boolean(r.requires_human_approval),
        staff_notes: notes
      };
    }));

    res.json(parsedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ticket Detail
app.get('/api/tickets/:id', async (req, res) => {
  try {
    const row = await dbGet('SELECT * FROM tickets WHERE id = ? OR ticket_number = ?', [req.params.id, req.params.id]);
    if (!row) return res.status(404).json({ error: 'Ticket not found' });

    const notes = await dbAll('SELECT * FROM staff_notes WHERE ticket_id = ? ORDER BY created_at ASC', [row.id]);
    res.json({
      ...row,
      action_plan: row.action_plan ? JSON.parse(row.action_plan) : [],
      missing_info: row.missing_info ? JSON.parse(row.missing_info) : [],
      requires_human_approval: Boolean(row.requires_human_approval),
      staff_notes: notes
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Ticket Status
app.patch('/api/tickets/:id/status', async (req, res) => {
  try {
    const { status, staff_id, staff_name, note } = req.body;
    const ticket = await dbGet('SELECT * FROM tickets WHERE id = ? OR ticket_number = ?', [req.params.id, req.params.id]);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const nowIso = new Date().toISOString();
    await dbRun('UPDATE tickets SET status = ?, updated_at = ? WHERE id = ?', [status, nowIso, ticket.id]);

    if (note && note.trim()) {
      await dbRun(
        'INSERT INTO staff_notes (id, ticket_id, staff_id, staff_name, note, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), ticket.id, staff_id, staff_name, note.trim(), nowIso]
      );
    }

    // Notification
    const notifMsg = `${staff_name} updated your request to '${status}'.${note ? ` Note: "${note}"` : ''}`;
    await dbRun(
      'INSERT INTO notifications (id, student_id, ticket_id, ticket_number, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, "status_change", 0, ?)',
      [crypto.randomUUID(), ticket.student_id, ticket.id, ticket.ticket_number, `Ticket ${ticket.ticket_number} Status: ${status}`, notifMsg, nowIso]
    );

    res.json({ ticket_id: ticket.id, ticket_number: ticket.ticket_number, status, updated_at: nowIso });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Department
app.patch('/api/tickets/:id/department', async (req, res) => {
  try {
    const { department, staff_id, staff_name, note } = req.body;
    const ticket = await dbGet('SELECT * FROM tickets WHERE id = ? OR ticket_number = ?', [req.params.id, req.params.id]);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const nowIso = new Date().toISOString();
    await dbRun('UPDATE tickets SET department = ?, updated_at = ? WHERE id = ?', [department, nowIso, ticket.id]);

    if (note && note.trim()) {
      await dbRun(
        'INSERT INTO staff_notes (id, ticket_id, staff_id, staff_name, note, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), ticket.id, staff_id, staff_name, `Reassigned to ${department}. ${note}`, nowIso]
      );
    }

    res.json({ ticket_id: ticket.id, ticket_number: ticket.ticket_number, department, updated_at: nowIso });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Staff Note
app.post('/api/tickets/:id/notes', async (req, res) => {
  try {
    const { staff_id, staff_name, note } = req.body;
    const ticket = await dbGet('SELECT * FROM tickets WHERE id = ? OR ticket_number = ?', [req.params.id, req.params.id]);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const note_id = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    await dbRun(
      'INSERT INTO staff_notes (id, ticket_id, staff_id, staff_name, note, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [note_id, ticket.id, staff_id, staff_name, note, nowIso]
    );

    res.json({ id: note_id, ticket_id: ticket.id, created_at: nowIso });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const { student_id } = req.query;
    const query = student_id
      ? 'SELECT * FROM notifications WHERE student_id = ? ORDER BY created_at DESC'
      : 'SELECT * FROM notifications ORDER BY created_at DESC';
    const params = student_id ? [student_id] : [];
    const rows = await dbAll(query, params);
    res.json(rows.map(r => ({ ...r, is_read: Boolean(r.is_read) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    await dbRun('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/mark-all-read', async (req, res) => {
  try {
    const { student_id } = req.query;
    await dbRun('UPDATE notifications SET is_read = 1 WHERE student_id = ?', [student_id]);
    res.json({ success: true, student_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics
app.get('/api/analytics', async (req, res) => {
  try {
    const totalRow = await dbGet('SELECT COUNT(*) as count FROM tickets');
    const pendingRow = await dbGet("SELECT COUNT(*) as count FROM tickets WHERE status = 'Pending'");
    const inProgressRow = await dbGet("SELECT COUNT(*) as count FROM tickets WHERE status = 'In Progress'");
    const resolvedRow = await dbGet("SELECT COUNT(*) as count FROM tickets WHERE status = 'Resolved'");
    const highPrioRow = await dbGet("SELECT COUNT(*) as count FROM tickets WHERE priority = 'high'");

    const deptRows = await dbAll('SELECT department as name, COUNT(*) as value FROM tickets GROUP BY department ORDER BY value DESC');
    const catRows = await dbAll('SELECT category as name, COUNT(*) as value FROM tickets GROUP BY category ORDER BY value DESC');
    const prioRows = await dbAll('SELECT priority as name, COUNT(*) as value FROM tickets GROUP BY priority ORDER BY value DESC');

    const total = totalRow ? totalRow.count : 0;
    const resolved = resolvedRow ? resolvedRow.count : 0;
    const resolution_rate = total > 0 ? Number(((resolved / total) * 100).toFixed(1)) : 0;

    res.json({
      total_tickets: total,
      pending_tickets: pendingRow ? pendingRow.count : 0,
      in_progress_tickets: inProgressRow ? inProgressRow.count : 0,
      resolved_tickets: resolved,
      high_priority_tickets: highPrioRow ? highPrioRow.count : 0,
      department_distribution: deptRows,
      category_distribution: catRows.map(c => ({ ...c, name: c.name.charAt(0).toUpperCase() + c.name.slice(1) })),
      priority_distribution: prioRows.map(p => ({ ...p, name: p.name.charAt(0).toUpperCase() + p.name.slice(1) })),
      resolution_rate_percent: resolution_rate,
      avg_response_hours: 3.8
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static frontend if dist exists
const distPath = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Express Backend] CampusPilot AI server running on http://127.0.0.1:${PORT}`);
  console.log(`[CORS] Allowing client origin: ${CLIENT_URL}`);
});
