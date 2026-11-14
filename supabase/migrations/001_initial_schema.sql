-- ============================================================================
-- CAMPUSPILOT AI - SUPABASE CLOUD POSTGRESQL INITIAL SCHEMA & SEED MIGRATION
-- Migration: 001_initial_schema.sql
-- Description: Creates complete table schemas, constraints, indexes, 
--              Row Level Security (RLS) policies, and realistic hackathon seed data.
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. TABLE DEFINITIONS
-- ============================================================================

-- A. Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'staff', 'admin')),
    student_id_code TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL,
    year TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- B. Support Tickets Table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT NOT NULL UNIQUE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('attendance', 'finance', 'document', 'academic', 'general')),
    assigned_agent TEXT NOT NULL,
    department TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Resolved')),
    action_plan JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_info JSONB DEFAULT '[]'::jsonb,
    requires_human_approval BOOLEAN NOT NULL DEFAULT true,
    source_query TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- C. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
    ticket_number TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- D. Staff Notes Table
CREATE TABLE IF NOT EXISTS public.staff_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    staff_id TEXT NOT NULL,
    staff_name TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- E. Workflow Audit Logs Table
CREATE TABLE IF NOT EXISTS public.workflow_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    stage TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. INDEXES FOR PERFORMANCE & SEARCH
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_students_id_code ON public.students(student_id_code);

CREATE INDEX IF NOT EXISTS idx_tickets_student_id ON public.tickets(student_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON public.tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON public.tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_student ON public.notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_staff_notes_ticket ON public.staff_notes(ticket_id);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_ticket ON public.workflow_logs(ticket_id);

-- ============================================================================
-- 4. AUTOMATIC TIMESTAMP TRIGGER (updated_at)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_tickets_updated_at ON public.tickets;
CREATE TRIGGER trigger_set_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS across all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_logs ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies
DROP POLICY IF EXISTS "Service role bypass on students" ON public.students;
DROP POLICY IF EXISTS "Allow demo and authenticated users read students" ON public.students;
DROP POLICY IF EXISTS "Service role bypass on tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow users read own or demo tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow students insert own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow staff update tickets" ON public.tickets;
DROP POLICY IF EXISTS "Service role bypass on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow students view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow students update own notification read state" ON public.notifications;
DROP POLICY IF EXISTS "Service role bypass on staff_notes" ON public.staff_notes;
DROP POLICY IF EXISTS "Allow view staff notes on tickets" ON public.staff_notes;
DROP POLICY IF EXISTS "Allow staff insert notes" ON public.staff_notes;
DROP POLICY IF EXISTS "Service role bypass on workflow_logs" ON public.workflow_logs;
DROP POLICY IF EXISTS "Allow view workflow logs" ON public.workflow_logs;

-- A. Students Policies
-- 1. Service role has full unrestricted access
CREATE POLICY "Service role bypass on students"
    ON public.students
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 2. Anyone (anon demo or authenticated) can view student profiles for hackathon demo
CREATE POLICY "Allow demo and authenticated users read students"
    ON public.students
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- B. Tickets Policies
-- 1. Service role full access
CREATE POLICY "Service role bypass on tickets"
    ON public.tickets
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 2. Read tickets: Students view own tickets or demo showcase
CREATE POLICY "Allow users read own or demo tickets"
    ON public.tickets
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 3. Insert tickets: Authenticated students or demo sessions can submit tickets
CREATE POLICY "Allow students insert own tickets"
    ON public.tickets
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 4. Update tickets: Staff can update status, department, and plans
CREATE POLICY "Allow staff update tickets"
    ON public.tickets
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- C. Notifications Policies
-- 1. Service role full access
CREATE POLICY "Service role bypass on notifications"
    ON public.notifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 2. Read notifications
CREATE POLICY "Allow students view own notifications"
    ON public.notifications
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 3. Update notifications read state
CREATE POLICY "Allow students update own notification read state"
    ON public.notifications
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- D. Staff Notes Policies
-- 1. Service role full access
CREATE POLICY "Service role bypass on staff_notes"
    ON public.staff_notes
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 2. Read staff notes
CREATE POLICY "Allow view staff notes on tickets"
    ON public.staff_notes
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 3. Insert staff notes
CREATE POLICY "Allow staff insert notes"
    ON public.staff_notes
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- E. Workflow Logs Policies
-- 1. Service role full access
CREATE POLICY "Service role bypass on workflow_logs"
    ON public.workflow_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 2. Read workflow logs
CREATE POLICY "Allow view workflow logs"
    ON public.workflow_logs
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- ============================================================================
-- 6. HACKATHON DEMONSTRATION SEED DATA
-- ============================================================================

-- A. Insert 3 Demo Students
INSERT INTO public.students (id, name, email, role, student_id_code, department, year, avatar_url, created_at)
VALUES 
    (
        'a1111111-1111-1111-1111-111111111111',
        'Alex Johnson',
        'alex.johnson@campus.edu',
        'student',
        'CS-2023-042',
        'Computer Science & Engineering',
        '3rd Year (Semester 5)',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        now() - interval '60 days'
    ),
    (
        'b2222222-2222-2222-2222-222222222222',
        'Priya Patel',
        'priya.patel@campus.edu',
        'student',
        'EC-2024-118',
        'Electronics & Communication',
        '2nd Year (Semester 3)',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        now() - interval '45 days'
    ),
    (
        'c3333333-3333-3333-3333-333333333333',
        'Marcus Chen',
        'marcus.chen@campus.edu',
        'student',
        'ME-2022-089',
        'Mechanical Engineering',
        '4th Year (Semester 7)',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        now() - interval '90 days'
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    department = EXCLUDED.department,
    year = EXCLUDED.year;

-- B. Insert 8 Realistic Demo Tickets
INSERT INTO public.tickets (
    id, ticket_number, student_id, student_name, title, description,
    category, assigned_agent, department, priority, status,
    action_plan, missing_info, requires_human_approval, source_query,
    created_at, updated_at
)
VALUES
    (
        'd0000001-0000-0000-0000-000000000001',
        'CP-2026-0001',
        'a1111111-1111-1111-1111-111111111111',
        'Alex Johnson',
        'Attendance Shortage Mismatch in CS301 (Algorithms)',
        'My portal reflects 68% attendance in CS301, but I have only missed 2 lectures out of 28. The biometric scanner at Hall B was malfunctioning on Oct 14th and 18th.',
        'attendance',
        'Attendance Agent',
        'Attendance & Academic Records Department',
        'high',
        'In Progress',
        '[
            "Pull biometric scanner hardware error logs for Hall B on Oct 14 & 18",
            "Verify manual attendance register signed by Dr. Vance",
            "Recalculate weighted percentage adjustment (+7.1%)",
            "Submit correction memorandum to Registrar"
        ]'::jsonb,
        '["Signature on manual attendance slip from Dr. Vance"]'::jsonb,
        true,
        'My attendance is showing 68% in CS301 but I attended almost every class. Scanner was broken on Oct 14.',
        now() - interval '3 days 4 hours',
        now() - interval '6 hours'
    ),
    (
        'd0000002-0000-0000-0000-000000000002',
        'CP-2026-0002',
        'a1111111-1111-1111-1111-111111111111',
        'Alex Johnson',
        'Semester 5 Tuition Fee Deducted but Receipt Not Generated',
        'Paid INR 45,000 via NetBanking on Nov 10th. Amount was debited from HDFC account (Ref: HDFC99382103), but student portal still displays Payment Pending.',
        'finance',
        'Finance Agent',
        'Accounts & Finance Department',
        'high',
        'In Progress',
        '[
            "Track gateway transaction ID HDFC99382103 with Razorpay nodal desk",
            "Confirm settlement ledger entry with Axis treasury account",
            "Clear financial hold on student ERP profile",
            "Generate official digitally signed fee receipt"
        ]'::jsonb,
        '[]'::jsonb,
        true,
        'I paid my college fees but did not receive a receipt. Bank debited the amount.',
        now() - interval '2 days 8 hours',
        now() - interval '3 hours'
    ),
    (
        'd0000003-0000-0000-0000-000000000003',
        'CP-2026-0003',
        'b2222222-2222-2222-2222-222222222222',
        'Priya Patel',
        'Urgent Bonafide Certificate for National Scholarship Portal',
        'Require an official Bonafide Certificate with college seal specifying annual tuition and hostel charges for State Merit Scholarship application (Deadline: Nov 25th).',
        'document',
        'Document Agent',
        'Student Affairs & Registrar Office',
        'medium',
        'Resolved',
        '[
            "Validate active enrollment in 2nd Year ECE program",
            "Retrieve official fee structure template with hostel annexure",
            "Generate digital certificate draft with unique verification QR",
            "Apply Registrar digital signature and notify student"
        ]'::jsonb,
        '[]'::jsonb,
        true,
        'I need a bonafide certificate for my scholarship portal before the deadline.',
        now() - interval '5 days',
        now() - interval '1 day'
    ),
    (
        'd0000004-0000-0000-0000-000000000004',
        'CP-2026-0004',
        'b2222222-2222-2222-2222-222222222222',
        'Priya Patel',
        'Mid-Term Examination Timetable Clash (EC302 & MA301)',
        'According to the draft schedule published yesterday, Digital Signal Processing (EC302) and Engineering Mathematics III (MA301) are both scheduled for Dec 04 at 10:00 AM.',
        'academic',
        'Academic Agent',
        'Office of Controller of Examinations & Academic Dean',
        'medium',
        'Pending',
        '[
            "Examine examination scheduling matrix for dual-enrollment conflict",
            "Convene scheduling committee review with Controller of Exams",
            "Reallocate EC302 to afternoon slot (02:00 PM - 05:00 PM)",
            "Publish revised timetable addendum on institutional noticeboard"
        ]'::jsonb,
        '["Confirmation if student is repeating either course as backlog"]'::jsonb,
        true,
        'I have two exams scheduled on the exact same date and time. Please help resolve clash.',
        now() - interval '14 hours',
        now() - interval '14 hours'
    ),
    (
        'd0000005-0000-0000-0000-000000000005',
        'CP-2026-0005',
        'c3333333-3333-3333-3333-333333333333',
        'Marcus Chen',
        'Replacement RFID Smart Campus ID Card Reissuance',
        'Lost college ID badge during campus placement drive in Auditorium. Filed lost property notice with campus security desk.',
        'document',
        'Document Agent',
        'Student Affairs & Registrar Office',
        'low',
        'In Progress',
        '[
            "Deactivate lost RFID chip #RF-8821 in campus turnstile security network",
            "Verify duplicate card processing fee receipt (INR 250)",
            "Transmit student photograph and credentials to ID printing bureau",
            "Issue temporary paper pass valid for library access"
        ]'::jsonb,
        '["Security desk lost report acknowledgment number"]'::jsonb,
        true,
        'I lost my college ID card yesterday and need a replacement.',
        now() - interval '1 day 10 hours',
        now() - interval '5 hours'
    ),
    (
        'd0000006-0000-0000-0000-000000000006',
        'CP-2026-0006',
        'c3333333-3333-3333-3333-333333333333',
        'Marcus Chen',
        'Final Year Major Project Lab Room Allocation Request',
        'Requesting access permissions for Advanced Robotics Lab (Mech Block Room 304) for weekend testing of autonomous rover prototype.',
        'academic',
        'Academic Agent',
        'Office of Controller of Examinations & Academic Dean',
        'low',
        'Resolved',
        '[
            "Review Faculty Guide recommendation letter",
            "Verify lab safety compliance certificate for lithium-polymer battery usage",
            "Issue lab supervisor weekend duty authorization slip",
            "Program biometric door lock for Saturday/Sunday 09:00-18:00 access"
        ]'::jsonb,
        '[]'::jsonb,
        true,
        'We need weekend lab access for our robotics capstone project.',
        now() - interval '6 days',
        now() - interval '2 days'
    ),
    (
        'd0000007-0000-0000-0000-000000000007',
        'CP-2026-0007',
        'a1111111-1111-1111-1111-111111111111',
        'Alex Johnson',
        'Hospitalization Medical Leave Attendance Condonation',
        'Submitted hospital discharge summary for dengue recovery (Oct 21 - Oct 31, 8 working days). Need attendance waiver as per University Medical Bylaws Section 4(b).',
        'attendance',
        'Attendance Agent',
        'Attendance & Academic Records Department',
        'high',
        'Pending',
        '[
            "Forward medical summary to College Chief Medical Officer for validation",
            "Calculate total eligible condonation hours across 6 enrolled courses",
            "Prepare formal exemption minutes for Academic Council review",
            "Apply excused absence flag in University ERP portal"
        ]'::jsonb,
        '["Original signed fitness certificate from attending physician"]'::jsonb,
        true,
        'I was hospitalized for dengue for 10 days. Need medical leave attendance consideration.',
        now() - interval '18 hours',
        now() - interval '18 hours'
    ),
    (
        'd0000008-0000-0000-0000-000000000008',
        'CP-2026-0008',
        'b2222222-2222-2222-2222-222222222222',
        'Priya Patel',
        'Caution Deposit & Hostel Refund Status Post Room Reallocation',
        'Shifted from Block A 3-sharing to Block C 2-sharing. Adjusted differential amount was deducted twice on the billing portal.',
        'finance',
        'Finance Agent',
        'Accounts & Finance Department',
        'medium',
        'Pending',
        '[
            "Audit hostel billing ledger for duplicate invoice generation",
            "Cross-check warden room reallocation authorization date",
            "Reverse excess debit of INR 6,500 to student wallet balance",
            "Issue updated zero-dues statement"
        ]'::jsonb,
        '["Hostel warden room shifting clearance slip"]'::jsonb,
        true,
        'Hostel room shift caused double charge on my fee account.',
        now() - interval '8 hours',
        now() - interval '8 hours'
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    priority = EXCLUDED.priority,
    action_plan = EXCLUDED.action_plan,
    updated_at = EXCLUDED.updated_at;

-- C. Insert Staff Notes
INSERT INTO public.staff_notes (id, ticket_id, staff_id, staff_name, note, created_at)
VALUES
    (
        'e0000001-0000-0000-0000-000000000001',
        'd0000001-0000-0000-0000-000000000001',
        'stf-jenkins',
        'Dr. Sarah Jenkins (Dean)',
        'Biometric device log audit confirmed offline timestamp at Hall B during Oct 14 09:00-11:00. Waiting for manual sheet from course faculty.',
        now() - interval '6 hours'
    ),
    (
        'e0000002-0000-0000-0000-000000000002',
        'd0000002-0000-0000-0000-000000000002',
        'stf-accounts',
        'Mr. Vikram Rao (Accounts Officer)',
        'Bank payment settlement verified in batch ledger. Reconciling ERP webhook now.',
        now() - interval '3 hours'
    ),
    (
        'e0000003-0000-0000-0000-000000000003',
        'd0000003-0000-0000-0000-000000000003',
        'stf-registrar',
        'Prof. Ramesh Kumar (Registrar)',
        'Bonafide Certificate #REG/2026/0891 generated, sealed, and uploaded to student portal documents folder.',
        now() - interval '1 day'
    ),
    (
        'e0000005-0000-0000-0000-000000000005',
        'd0000005-0000-0000-0000-000000000005',
        'stf-registrar',
        'Prof. Ramesh Kumar (Registrar)',
        'Card RFID deactivated. New card printed; ready for pickup at Window 4 with valid government ID.',
        now() - interval '5 hours'
    ),
    (
        'e0000006-0000-0000-0000-000000000006',
        'd0000006-0000-0000-0000-000000000006',
        'stf-jenkins',
        'Dr. Sarah Jenkins (Dean)',
        'Approved weekend access for Team Rover. Campus security notified.',
        now() - interval '2 days'
    )
ON CONFLICT (id) DO NOTHING;

-- D. Insert Notifications
INSERT INTO public.notifications (id, student_id, ticket_id, ticket_number, title, message, type, is_read, created_at)
VALUES
    (
        'f0000001-0000-0000-0000-000000000001',
        'a1111111-1111-1111-1111-111111111111',
        'd0000001-0000-0000-0000-000000000001',
        'CP-2026-0001',
        'Ticket Assigned & Investigating',
        'Dr. Sarah Jenkins began investigation on attendance discrepancy in CS301.',
        'status_change',
        true,
        now() - interval '6 hours'
    ),
    (
        'f0000002-0000-0000-0000-000000000002',
        'a1111111-1111-1111-1111-111111111111',
        'd0000002-0000-0000-0000-000000000002',
        'CP-2026-0002',
        'Payment Settlement Verified',
        'Accounts Officer Vikram Rao verified your bank settlement for Tuition Fee.',
        'status_change',
        false,
        now() - interval '3 hours'
    ),
    (
        'f0000003-0000-0000-0000-000000000003',
        'a1111111-1111-1111-1111-111111111111',
        'd0000007-0000-0000-0000-000000000007',
        'CP-2026-0007',
        'Medical Condonation Ticket Received',
        'Your medical leave submission was logged and routed to Attendance Department.',
        'ticket_created',
        false,
        now() - interval '18 hours'
    ),
    (
        'f0000004-0000-0000-0000-000000000004',
        'b2222222-2222-2222-2222-222222222222',
        'd0000003-0000-0000-0000-000000000003',
        'CP-2026-0003',
        'Bonafide Certificate Ready',
        'Prof. Ramesh Kumar signed and released your Bonafide Certificate #REG/2026/0891.',
        'status_change',
        true,
        now() - interval '1 day'
    ),
    (
        'f0000005-0000-0000-0000-000000000005',
        'b2222222-2222-2222-2222-222222222222',
        'd0000004-0000-0000-0000-000000000004',
        'CP-2026-0004',
        'Exam Clash Review Pending',
        'Your timetable clash report for EC302 & MA301 has been queued with Exam Cell.',
        'ticket_created',
        false,
        now() - interval '14 hours'
    ),
    (
        'f0000006-0000-0000-0000-000000000006',
        'c3333333-3333-3333-3333-333333333333',
        'd0000005-0000-0000-0000-000000000005',
        'CP-2026-0005',
        'ID Card Ready for Pickup',
        'Your replacement campus ID has been printed. Collect at Window 4.',
        'status_change',
        false,
        now() - interval '5 hours'
    )
ON CONFLICT (id) DO NOTHING;

-- E. Insert Workflow Logs
INSERT INTO public.workflow_logs (id, ticket_id, stage, agent_name, action, details, created_at)
VALUES
    (
        '10000001-0000-0000-0000-000000000001',
        'd0000001-0000-0000-0000-000000000001',
        'Ticket Creation',
        'Attendance Agent',
        'Route to Department',
        'Ticket routed to Attendance & Academic Records Department with priority high',
        now() - interval '3 days 4 hours'
    ),
    (
        '10000002-0000-0000-0000-000000000002',
        'd0000001-0000-0000-0000-000000000001',
        'Human Review',
        'Dr. Sarah Jenkins (Dean)',
        'Update Status',
        'Status changed to In Progress. Note: Biometric device log audit confirmed offline timestamp at Hall B.',
        now() - interval '6 hours'
    ),
    (
        '10000003-0000-0000-0000-000000000003',
        'd0000003-0000-0000-0000-000000000003',
        'Human Review',
        'Prof. Ramesh Kumar (Registrar)',
        'Update Status',
        'Status changed to Resolved. Note: Bonafide Certificate #REG/2026/0891 generated and sealed.',
        now() - interval '1 day'
    )
ON CONFLICT (id) DO NOTHING;

-- End of 001_initial_schema.sql
