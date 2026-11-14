import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Clock, 
  User, 
  ShieldCheck, 
  FileText, 
  HelpCircle,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { Student, OrchestratorResult, Ticket } from '../types';
import { processQueryWithOrchestrator, createTicket } from '../api';

interface ChatMessage {
  id: string;
  sender: 'student' | 'orchestrator' | 'specialist';
  agentName?: string;
  text: string;
  timestamp: string;
  orchestratorResult?: OrchestratorResult;
  ticketCreated?: {
    ticket_id: string;
    ticket_number: string;
    status: string;
    is_duplicate?: boolean;
    message?: string;
  };
  confirmed?: boolean;
}

interface AIAssistantProps {
  currentStudent: Student;
  onTicketCreated: (ticket: Ticket) => void;
  onNavigateToRequests: () => void;
  onNavigateToWorkflow: () => void;
  initialQuery?: string;
  onStageUpdate: (stageIndex: number, result?: OrchestratorResult, ticket?: any) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  currentStudent,
  onTicketCreated,
  onNavigateToRequests,
  onNavigateToWorkflow,
  initialQuery,
  onStageUpdate
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-01',
      sender: 'orchestrator',
      agentName: 'Campus Orchestrator',
      text: `Hello ${currentStudent.name}! I am your Campus Orchestrator. What issue can I help you resolve today? You can describe attendance shortages, missing fee receipts, bonafide requests, or timetable queries in your own words.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "My attendance is showing 16%, but I attended most of my classes.",
    "I paid my college fees but did not receive a receipt.",
    "I need a bonafide certificate for my scholarship portal.",
    "I want to know my examination timetable and check for date clashes."
  ];

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  // Handle initial query if passed from landing page
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery.trim());
    }
  }, [initialQuery]);

  const handleSend = async (queryText: string) => {
    if (!queryText.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'student',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setIsProcessing(true);

    // Update workflow stage to Intent Recognition & Orchestrator
    onStageUpdate(2);

    try {
      const result: OrchestratorResult = await processQueryWithOrchestrator(
        currentStudent.id,
        queryText
      );

      // Workflow updates to Specialist Agent Selection & Action Planning
      onStageUpdate(5, result);

      const specialistResponse: ChatMessage = {
        id: `msg-resp-${Date.now()}`,
        sender: 'specialist',
        agentName: result.agent_name,
        text: `I have reviewed your request regarding ${result.category}. Here is the verified institutional action plan and missing information needed to initiate formal ticket routing.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        orchestratorResult: result,
        confirmed: false
      };

      setMessages(prev => [...prev, specialistResponse]);
    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'orchestrator',
        agentName: 'Campus Orchestrator',
        text: "I encountered an error connecting with the backend agent service. Please verify your connection or try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmTicket = async (msgId: string, result: OrchestratorResult) => {
    setIsSubmittingTicket(true);
    onStageUpdate(6, result);

    try {
      const res = await createTicket({
        student_id: currentStudent.id,
        student_name: currentStudent.name,
        title: `${result.agent_name}: ${result.summary}`,
        description: `Student Query: "${result.query}"\n\nOrchestrator Perception:\n${result.orchestrator_reasoning}`,
        category: result.category,
        assigned_agent: result.agent_name,
        department: result.department,
        priority: result.priority,
        action_plan: result.action_plan,
        missing_info: result.missing_information,
        requires_human_approval: result.requires_human_approval,
        source_query: result.query
      });

      // Update message state
      setMessages(prev =>
        prev.map(m => {
          if (m.id === msgId) {
            return {
              ...m,
              confirmed: true,
              ticketCreated: res
            };
          }
          return m;
        })
      );

      // Notify parent & advance workflow stage
      onStageUpdate(7, result, res);
      onTicketCreated({
        id: res.ticket_id,
        ticket_number: res.ticket_number,
        student_id: currentStudent.id,
        student_name: currentStudent.name,
        title: `${result.agent_name}: ${result.summary}`,
        description: result.query,
        category: result.category,
        assigned_agent: result.agent_name,
        department: result.department,
        priority: result.priority,
        status: res.status as any,
        action_plan: result.action_plan,
        missing_info: result.missing_information,
        requires_human_approval: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    } catch (err) {
      console.error("Failed to create ticket:", err);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      
      {/* Assistant Header */}
      <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-white text-sm">CampusPilot AI Assistant</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Agent Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Perception, specialist agent routing, and action plan generation
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToWorkflow}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Live Agent Workflow</span>
        </button>
      </div>

      {/* Chat Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'student' ? 'items-end' : 'items-start'}`}
          >
            {/* Sender identity */}
            <div className="flex items-center gap-2 mb-1 px-1">
              {msg.sender === 'student' ? (
                <>
                  <span className="text-[11px] font-semibold text-slate-400">{currentStudent.name}</span>
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-[10px] text-white flex items-center justify-center font-bold">
                    {currentStudent.name.charAt(0)}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-5 h-5 rounded-full bg-violet-600 text-[10px] text-white flex items-center justify-center font-bold">
                    <Bot className="w-3 h-3" />
                  </div>
                  <span className="text-[11px] font-bold text-indigo-300">
                    {msg.agentName || 'Campus Orchestrator'}
                  </span>
                </>
              )}
              <span className="text-[10px] text-slate-300">{msg.timestamp}</span>
            </div>

            {/* Chat Bubble */}
            <div
              className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                msg.sender === 'student'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none'
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>
            </div>

            {/* Specialist Agent Reasoning & Action Plan Card */}
            {msg.orchestratorResult && (
              <div className="w-full max-w-2xl mt-3 p-5 rounded-2xl bg-slate-950/90 border border-indigo-500/30 shadow-xl text-left animate-in fade-in duration-200">
                
                {/* Agent Selection Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                      Assigned Agent:
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      {msg.orchestratorResult.agent_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Priority:</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      msg.orchestratorResult.priority === 'high' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      msg.orchestratorResult.priority === 'low' ? 'bg-slate-700 text-slate-300' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {msg.orchestratorResult.priority}
                    </span>
                  </div>
                </div>

                {/* Target Department */}
                <div className="py-2.5 text-xs text-slate-300 flex items-center gap-2">
                  <span className="text-slate-400">Target Department:</span>
                  <strong className="text-white font-semibold">{msg.orchestratorResult.department}</strong>
                </div>

                {/* Orchestrator Perception Explanation */}
                <div className="mb-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-indigo-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Why This Specialist Was Selected:</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {msg.orchestratorResult.orchestrator_reasoning}
                  </p>
                </div>

                {/* Structured Action Plan Checklist */}
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-white">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Generated Resolution Action Plan:</span>
                  </div>
                  <div className="space-y-1.5">
                    {msg.orchestratorResult.action_plan.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                        <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing Information Checklist */}
                {msg.orchestratorResult.missing_information && msg.orchestratorResult.missing_information.length > 0 && (
                  <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-amber-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Required Information / Supporting Evidence:</span>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                      {msg.orchestratorResult.missing_information.map((item, idx) => (
                        <li key={idx} className="leading-snug">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* AI Institutional Disclaimer */}
                <div className="text-[11px] text-slate-300 italic mb-4 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span>{msg.orchestratorResult.ai_disclaimer}</span>
                </div>

                {/* Ticket Confirmation & Creation Tool Call */}
                {!msg.confirmed && !msg.ticketCreated ? (
                  <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs text-slate-300">
                      Confirm request details to authorize official ticket creation:
                    </span>
                    <button
                      onClick={() => handleConfirmTicket(msg.id, msg.orchestratorResult!)}
                      disabled={isSubmittingTicket}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSubmittingTicket ? 'Creating Ticket...' : 'Confirm & Submit Ticket'}</span>
                    </button>
                  </div>
                ) : (
                  /* Confirmed Ticket Status Box */
                  <div className="mt-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white">
                          {msg.ticketCreated?.is_duplicate ? 'Existing Ticket Found' : 'Support Ticket Successfully Created!'}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-extrabold text-indigo-300 px-2 py-0.5 rounded bg-slate-900 border border-indigo-500/30">
                        {msg.ticketCreated?.ticket_number}
                      </span>
                    </div>

                    {msg.ticketCreated?.is_duplicate && (
                      <p className="text-xs text-amber-300 mb-2">
                        {msg.ticketCreated.message}
                      </p>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={onNavigateToRequests}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <span>Track in My Requests</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-slate-600">•</span>
                      <button
                        onClick={onNavigateToWorkflow}
                        className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                      >
                        <span>View Live Pipeline</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        ))}

        {/* Live Typing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-3 text-slate-400 text-xs py-2 px-3 rounded-xl bg-slate-950/60 border border-slate-800 w-fit animate-pulse">
            <Bot className="w-4 h-4 text-indigo-400 animate-spin" />
            <span>Campus Orchestrator perceiving request & formulating action plan...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 overflow-x-auto flex items-center gap-2 text-xs">
        <span className="text-[11px] uppercase font-bold text-slate-300 flex-shrink-0">
          Try:
        </span>
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={isProcessing}
            className="flex-shrink-0 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors text-[11px] disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputQuery);
        }}
        className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={`Describe your problem, ${currentStudent.name} (e.g. attendance discrepancy, fee receipt, certificate)...`}
          disabled={isProcessing}
          className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isProcessing}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          <span>Send</span>
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
