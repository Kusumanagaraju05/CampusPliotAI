import React from 'react';
import { 
  Bot, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  FileCheck2, 
  CreditCard, 
  GraduationCap, 
  CalendarClock, 
  CheckCircle2, 
  Workflow, 
  Users2, 
  Cpu, 
  Layers,
  ChevronRight,
  HelpCircle,
  FileText
} from 'lucide-react';
import { SystemStatus } from '../types';

interface LandingPageProps {
  onStartStudent: (initialQuery?: string) => void;
  onOpenAdmin: () => void;
  systemStatus: SystemStatus | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartStudent,
  onOpenAdmin,
  systemStatus
}) => {
  const samplePrompts = [
    {
      title: "Attendance Discrepancy",
      query: "My attendance is showing 16%, but I attended most of my classes.",
      badge: "Attendance Agent",
      color: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-300"
    },
    {
      title: "Fee Receipt Missing",
      query: "I paid my college fees but did not receive a receipt.",
      badge: "Finance Agent",
      color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300"
    },
    {
      title: "Bonafide Certificate",
      query: "I need a bonafide certificate for my education loan application.",
      badge: "Document Agent",
      color: "from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-300"
    },
    {
      title: "Exam Timetable Clash",
      query: "I want to know my examination timetable, and check if EC302 clashes with MA301.",
      badge: "Academic Agent",
      color: "from-purple-500/20 to-violet-500/10 border-purple-500/30 text-purple-300"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8">
        {/* Glow gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-violet-600/15 to-transparent blur-3xl pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-cyan-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs text-slate-300 mb-8 shadow-inner shadow-indigo-500/10">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-white">Next-Gen Autonomous Campus Operations</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-indigo-300">Hackathon Edition</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
            Your Campus. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
              Your AI. Your Problems Solved.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 mb-10 leading-relaxed font-normal">
            Explain campus administrative or academic problems in natural language. CampusPilot AI percieves intent, selects specialized agents, drafts authorized action plans, and routes tickets to college departments with human-in-the-loop sign-off.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => onStartStudent()}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5"
            >
              <Bot className="w-5 h-5" />
              <span>Launch Student Assistant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenAdmin}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-sm border border-slate-700/80 shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-violet-400" />
              <span>Open Staff Operations Portal</span>
            </button>
          </div>

          {/* Interactive Live Query Trigger Chips */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-left shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-300">
                  Try Live Problem Scenarios (Click to test agent):
                </span>
              </div>
              <span className="text-xs text-indigo-400 font-medium">Instant Agent Orchestration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => onStartStudent(p.query)}
                  className={`p-3.5 rounded-xl border text-left bg-gradient-to-br ${p.color} hover:scale-[1.01] transition-all flex flex-col justify-between group`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white group-hover:text-indigo-200 transition-colors">
                      {p.title}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950/60 border border-white/10">
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 italic mb-2 line-clamp-2">
                    "{p.query}"
                  </p>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-300">
                    <span>Route & resolve</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 4 Specialized AI Agents Architecture */}
      <section className="py-16 bg-[#0E1526] border-y border-slate-800/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 mb-2">
              Multi-Agent Architecture
            </h2>
            <h3 className="text-3xl font-extrabold text-white mb-4">
              One Central Orchestrator. Four Domain Specialists.
            </h3>
            <p className="text-sm text-slate-400">
              Unlike generic chatbots that guess answers, CampusPilot AI routes queries to verified department protocols with human-in-the-loop authorization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Agent 1: Attendance */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-6 transition-all hover:-translate-y-1 shadow-lg group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:bg-amber-500/20 transition-colors">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white text-base">Attendance Agent</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Records Cell
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Audits biometric/QR mismatches, lecture hour logs, condonation petitions, and medical leave proofs without unauthorized modification.
              </p>
              <ul className="text-[11px] text-slate-300 space-y-1.5 border-t border-slate-800 pt-3">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Scanner hardware anomaly audit</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Manual register reconciliation</span>
                </li>
              </ul>
            </div>

            {/* Agent 2: Finance */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-6 transition-all hover:-translate-y-1 shadow-lg group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-emerald-500/20 transition-colors">
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white text-base">Finance Agent</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Accounts Desk
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Traces gateway UTR transaction codes, reconciles treasury deposits, verifies scholarship adjustments, and issues digitally sealed fee receipts.
              </p>
              <ul className="text-[11px] text-slate-300 space-y-1.5 border-t border-slate-800 pt-3">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Bank gateway UTR reconciliation</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Scholarship ledger adjustment</span>
                </li>
              </ul>
            </div>

            {/* Agent 3: Document */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-6 transition-all hover:-translate-y-1 shadow-lg group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500/20 transition-colors">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white text-base">Document Agent</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Registrar
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Verifies enrollment eligibility, generates mandatory attachment checklists, and processes Bonafide certificates and ID card replacements.
              </p>
              <ul className="text-[11px] text-slate-300 space-y-1.5 border-t border-slate-800 pt-3">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span>Bonafide & Study certificates</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span>Lost RFID badge reissuance</span>
                </li>
              </ul>
            </div>

            {/* Agent 4: Academic */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-6 transition-all hover:-translate-y-1 shadow-lg group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:bg-purple-500/20 transition-colors">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white text-base">Academic Agent</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Exam Cell
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Resolves dual-exam slot clashes, verifies classroom allocations, coordinates lab access passes, and handles internal mark petitions.
              </p>
              <ul className="text-[11px] text-slate-300 space-y-1.5 border-t border-slate-800 pt-3">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  <span>Timetable conflict detection</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  <span>Lab & exam seating coordination</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 9-Stage Agentic Workflow Diagram */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold mb-3">
            <Workflow className="w-3.5 h-3.5" />
            <span>Verifiable Agentic Execution</span>
          </div>
          <h3 className="text-3xl font-extrabold text-white mb-4">
            How The Agentic AI Workflow Operates
          </h3>
          <p className="text-sm text-slate-300">
            Every student issue flows through a transparent 9-stage perception, planning, and authorized tool execution pipeline.
          </p>
        </div>

        {/* Step Flow Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center text-sm mb-4 border border-indigo-500/30">
              01
            </div>
            <h4 className="font-bold text-white text-base mb-2">1. Perception & Intent</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Student describes the issue in unstructured plain English. Campus Orchestrator extracts entities, assesses academic urgency, and identifies the problem domain.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 font-bold flex items-center justify-center text-sm mb-4 border border-violet-500/30">
              02
            </div>
            <h4 className="font-bold text-white text-base mb-2">2. Reasoning & Planning</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              The assigned specialist agent formulates a step-by-step resolution plan, identifies missing data (dates, UTR receipts), and asks for student confirmation.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center text-sm mb-4 border border-emerald-500/30">
              03
            </div>
            <h4 className="font-bold text-white text-base mb-2">3. Tool Call & Staff Sign-off</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Authorized backend tool creates ticket (CP-2026-XXXX), notifies department desk, and updates student dashboard when staff inspect and resolve the request.
            </p>
          </div>

        </div>

        {/* Bottom Banner */}
        <div className="rounded-2xl p-8 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-violet-950/60 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-xl font-bold text-white mb-2">
              Ready to experience intelligent campus administration?
            </h4>
            <p className="text-xs text-slate-300">
              Choose either the Student Assistant mode or the Staff Operations view to test the full lifecycle.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => onStartStudent()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <span>Student Chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenAdmin}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-2"
            >
              <span>Staff Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-white">CampusPilot AI</span>
            <span>— College Student Support & Operations Platform</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Powered by FastAPI + SQLite</span>
            <span>•</span>
            <span>React + TypeScript + Tailwind</span>
            <span>•</span>
            <span>{systemStatus?.engine_display_name || 'AI Engine Ready'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
