import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowDown, 
  Workflow, 
  Bot, 
  FileText, 
  Send, 
  Cpu, 
  UserCheck, 
  CheckCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { OrchestratorResult, Ticket } from '../types';

export type StageStatus = 'waiting' | 'processing' | 'completed' | 'requires_approval';

interface WorkflowVisualizerProps {
  currentStageIndex: number;
  orchestratorResult: OrchestratorResult | null;
  activeTicket: Ticket | null;
  onSelectTicket?: (t: Ticket) => void;
}

export const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({
  currentStageIndex,
  orchestratorResult,
  activeTicket
}) => {
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  // The 9 canonical stages specified in requirements
  const stages = [
    {
      id: 1,
      title: "Student Request",
      shortDesc: "Natural language problem input",
      icon: Send,
      getDetails: () => ({
        query: orchestratorResult?.query || activeTicket?.source_query || activeTicket?.description || "Awaiting student problem submission.",
        student: activeTicket?.student_name || "Active Student Session"
      })
    },
    {
      id: 2,
      title: "Intent Recognition",
      shortDesc: "Perception & entity extraction",
      icon: Cpu,
      getDetails: () => ({
        category: orchestratorResult?.category || activeTicket?.category || "Pending perception",
        confidence: orchestratorResult?.confidence_score ? `${(orchestratorResult.confidence_score * 100).toFixed(0)}%` : "92%",
        priority: orchestratorResult?.priority || activeTicket?.priority || "medium"
      })
    },
    {
      id: 3,
      title: "AI Orchestrator",
      shortDesc: "Central triage & reasoning",
      icon: Bot,
      getDetails: () => ({
        engine: orchestratorResult?.engine_mode || "Active Orchestrator",
        reasoning: orchestratorResult?.orchestrator_reasoning || "Analyzing problem taxonomy, risk level, and required authorizations.",
        disclaimer: orchestratorResult?.ai_disclaimer || "Institutional modifications require authorized sign-off."
      })
    },
    {
      id: 4,
      title: "Specialist Agent Selection",
      shortDesc: "Domain expert assignment",
      icon: Bot,
      getDetails: () => ({
        assigned_agent: orchestratorResult?.agent_name || activeTicket?.assigned_agent || "Pending agent selection",
        department: orchestratorResult?.department || activeTicket?.department || "Department Triage"
      })
    },
    {
      id: 5,
      title: "Action Planning",
      shortDesc: "Drafting resolution protocol",
      icon: FileText,
      getDetails: () => ({
        action_plan: orchestratorResult?.action_plan || activeTicket?.action_plan || ["Awaiting plan formulation"],
        missing_information: orchestratorResult?.missing_information || activeTicket?.missing_info || []
      })
    },
    {
      id: 6,
      title: "Department Routing",
      shortDesc: "Institutional desk allocation",
      icon: Workflow,
      getDetails: () => ({
        routed_to: orchestratorResult?.department || activeTicket?.department || "Campus Operations",
        priority_tag: orchestratorResult?.priority || activeTicket?.priority || "medium"
      })
    },
    {
      id: 7,
      title: "Ticket Creation",
      shortDesc: "Immutable ticket generation",
      icon: CheckCircle2,
      getDetails: () => ({
        ticket_number: activeTicket?.ticket_number || "CP-2026-Pending",
        ticket_id: activeTicket?.id || "Generates upon confirmation",
        status: activeTicket?.status || "Pending Confirmation"
      })
    },
    {
      id: 8,
      title: "Human Review",
      shortDesc: "Authorized college staff review",
      icon: UserCheck,
      getDetails: () => ({
        requires_approval: true,
        staff_notes_count: activeTicket?.staff_notes?.length || 0,
        latest_note: activeTicket?.staff_notes?.[activeTicket.staff_notes.length - 1]?.note || "Awaiting staff examination."
      })
    },
    {
      id: 9,
      title: "Resolution Tracking",
      shortDesc: "Real-time audit & closure",
      icon: CheckCheck,
      getDetails: () => ({
        status: activeTicket?.status || (currentStageIndex >= 7 ? "In Progress" : "Awaiting creation"),
        updated_at: activeTicket?.updated_at || "Live synced"
      })
    }
  ];

  const getStatus = (idx: number): StageStatus => {
    // If ticket is Resolved and we are at stage 8 or 9
    if (activeTicket?.status === 'Resolved' && idx <= 8) return 'completed';

    // If ticket is In Progress
    if (activeTicket?.status === 'In Progress') {
      if (idx < 7) return 'completed';
      if (idx === 7) return 'processing';
      if (idx === 8) return 'processing';
    }

    // Default sequential progression
    if (idx < currentStageIndex) return 'completed';
    if (idx === currentStageIndex) {
      if (idx === 7) return 'requires_approval';
      return 'processing';
    }
    return 'waiting';
  };

  const getStatusBadge = (status: StageStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 animate-pulse">
            <Clock className="w-3 h-3" />
            <span>Processing</span>
          </span>
        );
      case 'requires_approval':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-3 h-3" />
            <span>Requires Approval</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            <span>Waiting</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Workflow className="w-5 h-5 text-indigo-400" />
            <h3 className="font-extrabold text-white text-lg tracking-tight">
              Agentic AI Workflow Visualizer
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            Live observation of perception, reasoning, domain agent allocation, tool execution, and staff approval.
          </p>
        </div>

        {activeTicket && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400">Inspecting Ticket:</span>
            <span className="font-mono font-bold text-indigo-400">{activeTicket.ticket_number}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
              activeTicket.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400' :
              activeTicket.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400' :
              'bg-amber-500/20 text-amber-400'
            }`}>
              {activeTicket.status}
            </span>
          </div>
        )}
      </div>

      {/* Main Workflow Grid / Stepper */}
      <div className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stages.map((stage, idx) => {
            const status = getStatus(idx);
            const isSelected = selectedStage === idx;
            const IconComponent = stage.icon;

            return (
              <div
                key={stage.id}
                onClick={() => setSelectedStage(isSelected ? null : idx)}
                className={`relative p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'bg-slate-800/90 border-indigo-500 ring-1 ring-indigo-500 shadow-lg' 
                    : status === 'completed'
                    ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    : status === 'processing'
                    ? 'bg-indigo-950/20 border-indigo-500/40 shadow-md shadow-indigo-500/10'
                    : status === 'requires_approval'
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-slate-950/30 border-slate-900 opacity-60 hover:opacity-80'
                }`}
              >
                {/* Stage number & status badge */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                      status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                      status === 'processing' ? 'bg-indigo-500/20 text-indigo-400' :
                      status === 'requires_approval' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {stage.id}
                    </div>
                    <span className="text-xs font-bold text-white">
                      {stage.title}
                    </span>
                  </div>
                  {getStatusBadge(status)}
                </div>

                <p className="text-[11px] text-slate-300 line-clamp-1 mb-2">
                  {stage.shortDesc}
                </p>

                <div className="flex items-center justify-between text-[10px] text-indigo-400 font-medium">
                  <span>{isSelected ? 'Close details' : 'Click to inspect payload'}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payload Inspector Modal / Expanded Box */}
      {selectedStage !== null && (
        <div className="mt-4 p-5 rounded-xl bg-slate-950 border border-indigo-500/30 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Stage {stages[selectedStage].id}: {stages[selectedStage].title} — Live State & Data Payload
              </h4>
            </div>
            <button
              onClick={() => setSelectedStage(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <pre className="text-xs font-mono bg-slate-900 p-4 rounded-lg text-slate-300 overflow-x-auto border border-slate-800">
            {JSON.stringify(stages[selectedStage].getDetails(), null, 2)}
          </pre>
        </div>
      )}

      {/* Legend & Human Collaboration Notice */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500" /> Waiting
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400" /> Processing
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Requires Approval
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Completed
          </span>
        </div>
        <div className="text-[11px] text-slate-300 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Strict boundary: Official student records require certified staff execution.</span>
        </div>
      </div>

    </div>
  );
};
