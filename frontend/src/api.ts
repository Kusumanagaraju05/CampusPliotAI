import {
  Student,
  Ticket,
  NotificationItem,
  OrchestratorResult,
  SystemStatus,
  AnalyticsData,
  CategoryType,
  PriorityType,
  TicketStatusType
} from './types';

const API_BASE = '/api';

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const res = await fetch(`${API_BASE}/system-status`);
  if (!res.ok) throw new Error('Failed to fetch system status');
  return res.json();
}

export async function fetchStudents(): Promise<Student[]> {
  const res = await fetch(`${API_BASE}/students`);
  if (!res.ok) throw new Error('Failed to fetch students');
  return res.json();
}

export async function fetchStudent(id: string): Promise<Student> {
  const res = await fetch(`${API_BASE}/students/${id}`);
  if (!res.ok) throw new Error('Failed to fetch student profile');
  return res.json();
}

export async function processQueryWithOrchestrator(
  studentId: string,
  query: string
): Promise<OrchestratorResult> {
  const res = await fetch(`${API_BASE}/orchestrator/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: studentId, query })
  });
  if (!res.ok) throw new Error('Failed to process student query');
  return res.json();
}

export async function createTicket(data: {
  student_id: string;
  student_name: string;
  title: string;
  description: string;
  category: string;
  assigned_agent: string;
  department: string;
  priority: string;
  action_plan: string[];
  missing_info: string[];
  requires_human_approval: boolean;
  source_query?: string;
}): Promise<{ is_duplicate: boolean; message?: string; ticket_id: string; ticket_number: string; status: string }> {
  const res = await fetch(`${API_BASE}/tickets/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create ticket');
  return res.json();
}

export async function fetchTickets(params?: {
  student_id?: string;
  category?: CategoryType;
  status?: TicketStatusType;
  priority?: PriorityType;
  search?: string;
}): Promise<Ticket[]> {
  const url = new URL(`${window.location.origin}${API_BASE}/tickets`);
  if (params?.student_id) url.searchParams.append('student_id', params.student_id);
  if (params?.category && params.category !== 'all') url.searchParams.append('category', params.category);
  if (params?.status && params.status !== 'all') url.searchParams.append('status', params.status);
  if (params?.priority && params.priority !== 'all') url.searchParams.append('priority', params.priority);
  if (params?.search) url.searchParams.append('search', params.search);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch tickets');
  return res.json();
}

export async function fetchTicketDetail(ticketId: string): Promise<Ticket> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}`);
  if (!res.ok) throw new Error('Failed to fetch ticket details');
  return res.json();
}

export async function updateTicketStatus(
  ticketId: string,
  data: { status: string; staff_id: string; staff_name: string; note?: string }
): Promise<any> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update ticket status');
  return res.json();
}

export async function updateTicketDepartment(
  ticketId: string,
  data: { department: string; staff_id: string; staff_name: string; note?: string }
): Promise<any> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/department`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to reassign department');
  return res.json();
}

export async function addStaffNote(
  ticketId: string,
  data: { staff_id: string; staff_name: string; note: string }
): Promise<any> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to post staff note');
  return res.json();
}

export async function fetchNotifications(studentId?: string): Promise<NotificationItem[]> {
  const url = new URL(`${window.location.origin}${API_BASE}/notifications`);
  if (studentId) url.searchParams.append('student_id', studentId);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function markNotificationAsRead(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to mark notification read');
  return res.json();
}

export async function markAllNotificationsAsRead(studentId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/notifications/mark-all-read?student_id=${studentId}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to mark all read');
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await fetch(`${API_BASE}/analytics`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function resetDemoData(): Promise<any> {
  const res = await fetch(`${API_BASE}/reset-demo`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset demo data');
  return res.json();
}
