import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from .tools import classify_request, select_agent, generate_action_plan

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()

def process_student_query(query: str, student_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Campus Orchestrator:
    1. Perception: Understand student requests.
    2. Reasoning: Classify the issue and determine appropriate specialist agent.
    3. Planning: Generate an actionable resolution plan.
    4. Guardrails: Validate outputs and distinguish AI recommendations from institutional records.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "").strip() or GEMINI_API_KEY

    # If Gemini API Key is provided, attempt live LLM generation
    if api_key:
        try:
            live_result = _call_gemini_api(query, api_key, student_profile)
            if live_result:
                return live_result
        except Exception as e:
            # Fallback seamlessly to deterministic engine if live API call fails
            print(f"[Orchestrator] Gemini live call failed ({e}), switching to fallback deterministic engine.")

    # Fallback Intelligence: Deterministic rule-based engine
    return _deterministic_orchestration(query, student_profile)

def _deterministic_orchestration(query: str, student_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    High-precision deterministic rule-based agent orchestrator.
    Clearly marks fallback status and never pretends to be Gemini.
    """
    # 1. Perception & Intent classification
    classification = classify_request(query)
    category = classification["category"]
    priority = classification["priority"]
    confidence = classification["confidence"]

    # 2. Specialist Agent Selection
    agent_info = select_agent(category)
    agent_name = agent_info["agent_name"]
    department = agent_info["department"]

    # 3. Action Planning & Missing Information extraction
    plan_info = generate_action_plan(category, query)

    # 4. Orchestrator reasoning
    reasoning_templates = {
        "attendance": (
            f"The Orchestrator detected attendance-related keywords ({', '.join(classification['matched_keywords']) or 'attendance dispute'}). "
            f"Mapped request to '{agent_name}' specializing in institutional attendance reconciliations and class log audits. "
            f"Target department: {department}. Priority set to '{priority}' based on academic risk evaluation."
        ),
        "finance": (
            f"The Orchestrator recognized financial transaction / payment inquiry triggers ({', '.join(classification['matched_keywords']) or 'fee inquiry'}). "
            f"Routed to '{agent_name}' to facilitate bank gateway tracing and treasury voucher generation. "
            f"Target department: {department}. Priority set to '{priority}' to avert accounting holds or penalties."
        ),
        "document": (
            f"The Orchestrator identified official documentation request triggers ({', '.join(classification['matched_keywords']) or 'certificate request'}). "
            f"Assigned to '{agent_name}' for eligibility verification, attachment validation, and registrar routing. "
            f"Target department: {department}. Priority set to '{priority}'."
        ),
        "academic": (
            f"The Orchestrator classified query as academic administration or timetable inquiry ({', '.join(classification['matched_keywords']) or 'academic enquiry'}). "
            f"Assigned to '{agent_name}' to coordinate with Controller of Examinations and Dean of Academics. "
            f"Target department: {department}. Priority set to '{priority}'."
        )
    }

    reasoning = reasoning_templates.get(category, reasoning_templates["academic"])

    return {
        "query": query,
        "category": category,
        "agent_name": agent_name,
        "department": department,
        "priority": priority,
        "confidence_score": confidence,
        "summary": plan_info["summary"],
        "orchestrator_reasoning": reasoning,
        "missing_information": plan_info["missing_information"],
        "action_plan": plan_info["action_plan"],
        "requires_human_approval": True,
        "ai_disclaimer": "Deterministic AI Agent Recommendation: Official institutional changes require authorized college staff approval.",
        "engine_mode": "deterministic_rule_engine"
    }

def _call_gemini_api(query: str, api_key: str, student_profile: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """
    Calls Google Gemini API with strict structured JSON output.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    
    system_instruction = (
        "You are the Campus Orchestrator for CampusPilot AI, an intelligent college support system. "
        "Analyze the student's problem and output valid JSON matching this schema:\n"
        "{\n"
        '  "category": "attendance" | "finance" | "document" | "academic",\n'
        '  "agent_name": "Attendance Agent" | "Finance Agent" | "Document Agent" | "Academic Agent",\n'
        '  "department": "Exact college department name",\n'
        '  "priority": "low" | "medium" | "high",\n'
        '  "confidence_score": float between 0.0 and 1.0,\n'
        '  "summary": "1 sentence problem summary",\n'
        '  "orchestrator_reasoning": "Why this agent was chosen and the perception rationale",\n'
        '  "missing_information": ["list of items or documents needed from student"],\n'
        '  "action_plan": ["step 1", "step 2", "step 3", "step 4"],\n'
        '  "requires_human_approval": true\n'
        "}\n"
        "Rules: Never invent official institutional facts. Always require human staff sign-off."
    )

    prompt_body = {
        "contents": [
            {
                "parts": [
                    {"text": f"Student Query: {query}\nStudent Profile: {json.dumps(student_profile or {})}"}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        },
        "systemInstruction": {
            "parts": [{"text": system_instruction}]
        }
    }

    req_data = json.dumps(prompt_body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=10) as response:
        result_json = json.loads(response.read().decode("utf-8"))
        candidate = result_json.get("candidates", [])[0]
        text_content = candidate.get("content", {}).get("parts", [])[0].get("text", "")
        parsed = json.loads(text_content)
        parsed["query"] = query
        parsed["engine_mode"] = "gemini_live"
        parsed["ai_disclaimer"] = "Gemini AI Agent Recommendation: Institutional record changes require authorized staff approval."
        return parsed
