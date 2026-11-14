from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

class StudentBase(BaseModel):
    id: str
    name: str
    email: str
    role: str = "student"
    student_id_code: str
    department: str
    year: str
    avatar_url: Optional[str] = None
    created_at: str

class ProcessQueryRequest(BaseModel):
    student_id: str
    query: str
    context: Optional[Dict[str, Any]] = None

class ActionPlanItem(BaseModel):
    step_number: int
    title: str
    description: str
    responsible_party: str  # e.g., "AI Agent", "Student", "Department Staff", "Registrar"
    status: str = "pending" # "completed", "in_progress", "pending"

class OrchestratorResult(BaseModel):
    query: str
    category: str           # "attendance", "finance", "document", "academic", "general"
    agent_name: str         # "Attendance Agent", "Finance Agent", "Document Agent", "Academic Agent"
    department: str         # Destination department
    priority: str           # "low", "medium", "high"
    confidence_score: float # 0.0 to 1.0
    summary: str            # Concise issue summary
    orchestrator_reasoning: str # Why this agent was chosen and the perception rationale
    missing_information: List[str] # Questions / supporting data required from student
    action_plan: List[str]  # Ordered action items
    requires_human_approval: bool = True
    ai_disclaimer: str = "AI-generated recommendation. Institutional records require authorized staff verification."
    engine_mode: str        # "gemini_live" or "deterministic_rule_engine"

class TicketCreateRequest(BaseModel):
    student_id: str
    student_name: str
    title: str
    description: str
    category: str
    assigned_agent: str
    department: str
    priority: str = "medium"
    action_plan: List[str]
    missing_info: Optional[List[str]] = []
    requires_human_approval: bool = True
    source_query: Optional[str] = None

class TicketStatusUpdateRequest(BaseModel):
    status: str             # "Pending", "In Progress", "Resolved"
    staff_id: str
    staff_name: str
    note: Optional[str] = None

class TicketDepartmentUpdateRequest(BaseModel):
    department: str
    staff_id: str
    staff_name: str
    note: Optional[str] = None

class StaffNoteCreateRequest(BaseModel):
    staff_id: str
    staff_name: str
    note: str

class StaffNoteResponse(BaseModel):
    id: str
    ticket_id: str
    staff_id: str
    staff_name: str
    note: str
    created_at: str

class TicketResponse(BaseModel):
    id: str
    ticket_number: str
    student_id: str
    student_name: str
    title: str
    description: str
    category: str
    assigned_agent: str
    department: str
    priority: str
    status: str
    action_plan: List[str]
    missing_info: List[str]
    requires_human_approval: bool
    source_query: Optional[str]
    created_at: str
    updated_at: str
    staff_notes: Optional[List[StaffNoteResponse]] = []

class NotificationResponse(BaseModel):
    id: str
    student_id: str
    ticket_id: Optional[str]
    ticket_number: Optional[str]
    title: str
    message: str
    type: str
    is_read: bool
    created_at: str

class AnalyticsResponse(BaseModel):
    total_tickets: int
    pending_tickets: int
    in_progress_tickets: int
    resolved_tickets: int
    high_priority_tickets: int
    department_distribution: List[Dict[str, Any]]
    category_distribution: List[Dict[str, Any]]
    priority_distribution: List[Dict[str, Any]]
    resolution_rate_percent: float
    avg_response_hours: float
