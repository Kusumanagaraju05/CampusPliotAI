export type CategoryType = 'attendance' | 'finance' | 'document' | 'academic' | 'all';
export type PriorityType = 'low' | 'medium' | 'high' | 'all';
export type TicketStatusType = 'Pending' | 'In Progress' | 'Resolved' | 'all';

export interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
  student_id_code: string;
  department: string;
  year: string;
  avatar_url?: string;
  created_at: string;
}

export interface StaffNote {
  id: string;
  ticket_id: string;
  staff_id: string;
  staff_name: string;
  note: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  student_id: string;
  student_name: string;
  title: string;
  description: string;
  category: string;
  assigned_agent: string;
  department: string;
  priority: 'low' | 'medium' | 'high';
  status: 'Pending' | 'In Progress' | 'Resolved';
  action_plan: string[];
  missing_info: string[];
  requires_human_approval: boolean;
  source_query?: string;
  created_at: string;
  updated_at: string;
  staff_notes?: StaffNote[];
}

export interface NotificationItem {
  id: string;
  student_id: string;
  ticket_id?: string;
  ticket_number?: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface OrchestratorResult {
  query: string;
  category: string;
  agent_name: string;
  department: string;
  priority: 'low' | 'medium' | 'high';
  confidence_score: number;
  summary: string;
  orchestrator_reasoning: string;
  missing_information: string[];
  action_plan: string[];
  requires_human_approval: boolean;
  ai_disclaimer: string;
  engine_mode: 'gemini_live' | 'deterministic_rule_engine';
}

export interface SystemStatus {
  engine_mode: string;
  engine_display_name: string;
  gemini_api_configured: boolean;
  active_specialist_agents: Array<{
    id: string;
    name: string;
    department: string;
    status: string;
  }>;
  version: string;
}

export interface AnalyticsData {
  total_tickets: number;
  pending_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  high_priority_tickets: number;
  department_distribution: Array<{ name: string; value: number }>;
  category_distribution: Array<{ name: string; value: number }>;
  priority_distribution: Array<{ name: string; value: number }>;
  resolution_rate_percent: number;
  avg_response_hours: number;
}
