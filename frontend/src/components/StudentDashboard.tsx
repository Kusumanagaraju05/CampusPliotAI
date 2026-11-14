import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  FileText, 
  Bell, 
  User, 
  Workflow, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  CreditCard, 
  GraduationCap, 
  FileCheck2, 
  CalendarClock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Student, Ticket, NotificationItem, OrchestratorResult, CategoryType, TicketStatusType } from '../types';
import { AIAssistant } from './AIAssistant';
import { TicketList } from './TicketList';
import { WorkflowVisualizer } from './WorkflowVisualizer';

interface StudentDashboardProps {
  currentStudent: Student;
  tickets: Ticket[];
  notifications: NotificationItem[];
  onSelectTicket: (t: Ticket) => void;
  onTicketCreated: (t: Ticket) => void;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  workflowStage: number;
  orchestratorResult: OrchestratorResult | null;
  activeTicket: Ticket | null;
  onStageUpdate: (stageIndex: number, result?: OrchestratorResult, ticket?: any) => void;
  initialAssistantQuery?: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentStudent,
  tickets,
  notifications,
  onSelectTicket,
  onTicketCreated,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  workflowStage,
  orchestratorResult,
  activeTicket,
  onStageUpdate,
  initialAssistantQuery
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'assistant' | 'requests' | 'workflow' | 'notifications' | 'profile'>('overview');
  const [assistantSeedQuery, setAssistantSeedQuery] = useState<string | undefined>(initialAssistantQuery);

  // Ticket metrics for this student
  const studentTickets = tickets.filter(t => t.student_id === currentStudent.id);
  const totalCount = studentTickets.length;
  const pendingCount = studentTickets.filter(t => t.status === 'Pending').length;
  const inProgressCount = studentTickets.filter(t => t.status === 'In Progress').length;
  const resolvedCount = studentTickets.filter(t => t.status === 'Resolved').length;

  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [selectedStatus, setSelectedStatus] = useState<TicketStatusType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTickets = studentTickets.filter(t => {
    const matchCat = selectedCategory === 'all' || t.category === selectedCategory;
    const matchStatus = selectedStatus === 'all' || t.status === selectedStatus;
    const matchSearch = !searchQuery.trim() || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchStatus && matchSearch;
  });

  const launchAssistantWithPrompt = (prompt: string) => {
    setAssistantSeedQuery(prompt);
    setActiveTab('assistant');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Student Welcome & Profile Banner */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={currentStudent.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
            alt={currentStudent.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/40 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-extrabold text-white">
                {currentStudent.name}
              </h2>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {currentStudent.student_id_code}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {currentStudent.department} • <strong className="text-slate-300">{currentStudent.year}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('assistant')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask CampusPilot AI</span>
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-2"
          >
            <Workflow className="w-4 h-4 text-indigo-400" />
            <span>Workflow Pipeline</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Sidebar & Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar */}
        <div className="lg:col-span-3">
          <nav className="space-y-1 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shadow-xl">
            
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('assistant')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'assistant'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bot className="w-4 h-4" />
                <span>AI Assistant</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-extrabold bg-violet-400/20 text-violet-300">
                Agentic
              </span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'requests'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <span>My Requests</span>
              </div>
              {studentTickets.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {studentTickets.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('workflow')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'workflow'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Workflow className="w-4 h-4" />
                <span>Workflow Tracker</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'notifications'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </div>
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4" />
                <span>Profile & Dues</span>
              </div>
            </button>

          </nav>
        </div>

        {/* Content Tabs */}
        <div className="lg:col-span-9">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              
              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
                  <span className="text-slate-400 text-xs font-semibold block mb-1">Total Requests</span>
                  <div className="text-2xl font-black text-white">{totalCount}</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
                  <span className="text-amber-400 text-xs font-semibold block mb-1">Pending Approval</span>
                  <div className="text-2xl font-black text-amber-400">{pendingCount}</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
                  <span className="text-blue-400 text-xs font-semibold block mb-1">In Progress</span>
                  <div className="text-2xl font-black text-blue-400">{inProgressCount}</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
                  <span className="text-emerald-400 text-xs font-semibold block mb-1">Resolved</span>
                  <div className="text-2xl font-black text-emerald-400">{resolvedCount}</div>
                </div>
              </div>

              {/* Quick Actions Triggers */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300">
                    Quick Administrative Problem Resolvers
                  </h3>
                  <span className="text-xs text-indigo-400">Direct AI Routing</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  
                  <button
                    onClick={() => launchAssistantWithPrompt("My attendance is showing incorrect percentage for recent lectures.")}
                    className="p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-left transition-all group"
                  >
                    <Clock className="w-5 h-5 text-amber-400 mb-2" />
                    <div className="text-xs font-bold text-white group-hover:text-amber-300">
                      Attendance Shortage
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Audit biometric & lecture hours</p>
                  </button>

                  <button
                    onClick={() => launchAssistantWithPrompt("I paid my college tuition fee but did not receive a payment receipt.")}
                    className="p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
                  >
                    <CreditCard className="w-5 h-5 text-emerald-400 mb-2" />
                    <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                      Fee Receipt Enquiry
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Bank gateway UTR reconciliation</p>
                  </button>

                  <button
                    onClick={() => launchAssistantWithPrompt("I need an official Bonafide Certificate with college seal.")}
                    className="p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 text-left transition-all group"
                  >
                    <FileCheck2 className="w-5 h-5 text-blue-400 mb-2" />
                    <div className="text-xs font-bold text-white group-hover:text-blue-300">
                      Bonafide Certificate
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Enrollment verification & QR seal</p>
                  </button>

                  <button
                    onClick={() => launchAssistantWithPrompt("I want to check my examination timetable and room allocation.")}
                    className="p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 text-left transition-all group"
                  >
                    <GraduationCap className="w-5 h-5 text-purple-400 mb-2" />
                    <div className="text-xs font-bold text-white group-hover:text-purple-300">
                      Exam Timetable
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Resolve scheduling conflicts</p>
                  </button>

                </div>
              </div>

              {/* Active Tickets List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300">
                    Active College Support Tickets
                  </h3>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                  >
                    <span>View All ({studentTickets.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <TicketList
                  tickets={studentTickets.slice(0, 3)}
                  onSelectTicket={onSelectTicket}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedStatus={selectedStatus}
                  setSelectedStatus={setSelectedStatus}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              </div>

            </div>
          )}

          {/* TAB 2: AI ASSISTANT */}
          {activeTab === 'assistant' && (
            <AIAssistant
              currentStudent={currentStudent}
              onTicketCreated={onTicketCreated}
              onNavigateToRequests={() => setActiveTab('requests')}
              onNavigateToWorkflow={() => setActiveTab('workflow')}
              initialQuery={assistantSeedQuery}
              onStageUpdate={onStageUpdate}
            />
          )}

          {/* TAB 3: MY REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">My Support Tickets</h3>
                  <p className="text-xs text-slate-400">
                    Track the progress, assigned agents, and official notes for your administrative submissions.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('assistant')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Bot className="w-4 h-4" />
                  <span>New Request</span>
                </button>
              </div>

              <TicketList
                tickets={filteredTickets}
                onSelectTicket={onSelectTicket}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </div>
          )}

          {/* TAB 4: WORKFLOW TRACKER */}
          {activeTab === 'workflow' && (
            <WorkflowVisualizer
              currentStageIndex={workflowStage}
              orchestratorResult={orchestratorResult}
              activeTicket={activeTicket}
              onSelectTicket={onSelectTicket}
            />
          )}

          {/* TAB 5: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div>
                  <h3 className="text-base font-bold text-white">In-App Notifications</h3>
                  <p className="text-xs text-slate-400">
                    Real-time status updates from College Staff and Specialist Agents.
                  </p>
                </div>
                <button
                  onClick={onMarkAllNotificationsRead}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
                >
                  Mark all as read
                </button>
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No notifications yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => onMarkNotificationRead(notif.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        notif.is_read
                          ? 'bg-slate-950/40 border-slate-800/60 opacity-75'
                          : 'bg-indigo-950/20 border-indigo-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                          )}
                          <span className="text-xs font-bold text-white">{notif.title}</span>
                          {notif.ticket_number && (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-800">
                              {notif.ticket_number}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(notif.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PROFILE & ACADEMIC DETAILS */}
          {activeTab === 'profile' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Student Institutional Profile</h3>
                <p className="text-xs text-slate-400">
                  Verified student credentials linked with CampusPilot AI permissions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block mb-1">Full Legal Name</span>
                  <span className="font-bold text-white text-sm">{currentStudent.name}</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block mb-1">Student Roll / Identity Code</span>
                  <span className="font-mono font-bold text-indigo-400 text-sm">{currentStudent.student_id_code}</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block mb-1">Academic Department</span>
                  <span className="font-bold text-white text-sm">{currentStudent.department}</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block mb-1">Enrollment Standing</span>
                  <span className="font-bold text-white text-sm">{currentStudent.year}</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 sm:col-span-2">
                  <span className="text-slate-500 block mb-1">Institutional Email</span>
                  <span className="font-bold text-white text-sm">{currentStudent.email}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-slate-300">
                <h4 className="font-bold text-indigo-300 mb-1">Security & Access Boundary:</h4>
                <p className="leading-relaxed text-[11px] text-slate-400">
                  CampusPilot AI maintains strict read-only access to official institutional databases. Changes to attendance tallies, grade registers, or payment reconciliations are executed exclusively through authorized human college staff sign-off.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
