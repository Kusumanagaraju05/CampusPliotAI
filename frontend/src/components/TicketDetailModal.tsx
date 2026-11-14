import React from 'react';
import { 
  X, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  User, 
  Building2, 
  ShieldCheck, 
  MessageSquare, 
  Workflow
} from 'lucide-react';
import { Ticket } from '../types';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  onOpenWorkflow?: () => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  onClose,
  onOpenWorkflow
}) => {
  if (!ticket) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Resolved</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>In Progress</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {ticket.ticket_number}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {new Date(ticket.created_at).toLocaleDateString()} at {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white leading-snug">
              {ticket.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Status</span>
              {getStatusBadge(ticket.status)}
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Assigned Agent</span>
              <span className="font-bold text-indigo-300">{ticket.assigned_agent}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Priority</span>
              <span className={`font-bold uppercase ${
                ticket.priority === 'high' ? 'text-rose-400' :
                ticket.priority === 'low' ? 'text-slate-300' : 'text-amber-400'
              }`}>
                {ticket.priority}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Student</span>
              <span className="font-bold text-white">{ticket.student_name}</span>
            </div>
          </div>

          {/* Department Card */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <Building2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <div>
              <span className="text-slate-400 block">Responsible Department:</span>
              <span className="font-bold text-white">{ticket.department}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-2">
              Problem Description
            </h4>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
              {ticket.description}
            </div>
          </div>

          {/* Action Plan */}
          {ticket.action_plan && ticket.action_plan.length > 0 && (
            <div>
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI-Generated Resolution Plan</span>
              </h4>
              <div className="space-y-1.5">
                {ticket.action_plan.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Staff Notes History */}
          <div>
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
              <span>Official College Staff Notes & Audit Trail</span>
            </h4>
            {ticket.staff_notes && ticket.staff_notes.length > 0 ? (
              <div className="space-y-2">
                {ticket.staff_notes.map((note) => (
                  <div key={note.id} className="p-3.5 rounded-xl bg-violet-950/20 border border-violet-500/20 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-violet-300">{note.staff_name}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(note.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-200 italic">"{note.note}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic p-3 rounded-lg bg-slate-950 border border-slate-800/60">
                No staff notes appended yet. Ticket is currently in institutional queue.
              </p>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          {onOpenWorkflow && (
            <button
              onClick={() => {
                onClose();
                onOpenWorkflow();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-indigo-300 flex items-center gap-1.5"
            >
              <Workflow className="w-4 h-4" />
              <span>View in Workflow Visualizer</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold ml-auto"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
};
