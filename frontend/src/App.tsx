import React, { useState, useEffect } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { TicketDetailModal } from './components/TicketDetailModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { 
  Student, 
  Ticket, 
  NotificationItem, 
  SystemStatus, 
  AnalyticsData, 
  OrchestratorResult 
} from './types';
import { 
  fetchStudents, 
  fetchSystemStatus, 
  fetchTickets, 
  fetchNotifications, 
  fetchAnalytics, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  resetDemoData 
} from './api';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'student' | 'admin'>('landing');
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Modal & Drawers
  const [selectedTicketForModal, setSelectedTicketForModal] = useState<Ticket | null>(null);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Workflow visualizer synchronized state
  const [workflowStage, setWorkflowStage] = useState<number>(1);
  const [orchestratorResult, setOrchestratorResult] = useState<OrchestratorResult | null>(null);
  const [activeWorkflowTicket, setActiveWorkflowTicket] = useState<Ticket | null>(null);

  // Pre-seed query for assistant
  const [assistantSeedQuery, setAssistantSeedQuery] = useState<string | undefined>();

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Initial Data Loading
  const loadData = async () => {
    try {
      const [stList, statusRes, ticketList, notifList, analyticsRes] = await Promise.all([
        fetchStudents(),
        fetchSystemStatus(),
        fetchTickets(),
        fetchNotifications(),
        fetchAnalytics()
      ]);

      setStudents(stList);
      if (stList.length > 0 && !currentStudent) {
        setCurrentStudent(stList[0]);
      }
      setSystemStatus(statusRes);
      setTickets(ticketList);
      setNotifications(notifList);
      setAnalytics(analyticsRes);

      // Set active ticket for workflow tracker if exists
      if (ticketList.length > 0 && !activeWorkflowTicket) {
        setActiveWorkflowTicket(ticketList[0]);
        setWorkflowStage(ticketList[0].status === 'Resolved' ? 9 : 7);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Refresh notifications when student changes
  useEffect(() => {
    if (currentStudent) {
      fetchNotifications(currentStudent.id)
        .then(setNotifications)
        .catch(console.error);
    }
  }, [currentStudent]);

  const handleStartStudent = (initialQuery?: string) => {
    setAssistantSeedQuery(initialQuery);
    setCurrentView('student');
  };

  const handleOpenAdmin = () => {
    setCurrentView('admin');
  };

  const handleTicketCreated = (newTicket: Ticket) => {
    setTickets(prev => [newTicket, ...prev]);
    setActiveWorkflowTicket(newTicket);
    setWorkflowStage(7);
    showToast(`Ticket ${newTicket.ticket_number} created and routed successfully!`);

    // Reload analytics & notifications
    fetchAnalytics().then(setAnalytics).catch(console.error);
    if (currentStudent) {
      fetchNotifications(currentStudent.id).then(setNotifications).catch(console.error);
    }
  };

  const handleTicketUpdated = (updated: Ticket) => {
    setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    if (activeWorkflowTicket?.id === updated.id) {
      setActiveWorkflowTicket(updated);
      setWorkflowStage(updated.status === 'Resolved' ? 9 : 8);
    }
    showToast(`Ticket ${updated.ticket_number} updated to status "${updated.status}"`);
    fetchAnalytics().then(setAnalytics).catch(console.error);
    if (currentStudent) {
      fetchNotifications(currentStudent.id).then(setNotifications).catch(console.error);
    }
  };

  const handleResetDemo = async () => {
    try {
      await resetDemoData();
      await loadData();
      showToast('Demo data reset to initial showcase state.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllNotificationsRead = async () => {
    if (currentStudent) {
      await markAllNotificationsAsRead(currentStudent.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const handleStageUpdate = (stageIndex: number, result?: OrchestratorResult, ticket?: any) => {
    setWorkflowStage(stageIndex);
    if (result) setOrchestratorResult(result);
    if (ticket) setActiveWorkflowTicket(ticket);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col font-sans">
      
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        students={students}
        currentStudent={currentStudent}
        setCurrentStudent={setCurrentStudent}
        systemStatus={systemStatus}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        onResetDemo={handleResetDemo}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onStartStudent={handleStartStudent}
            onOpenAdmin={handleOpenAdmin}
            systemStatus={systemStatus}
          />
        )}

        {currentView === 'student' && currentStudent && (
          <StudentDashboard
            currentStudent={currentStudent}
            tickets={tickets}
            notifications={notifications}
            onSelectTicket={(t) => setSelectedTicketForModal(t)}
            onTicketCreated={handleTicketCreated}
            onMarkNotificationRead={handleMarkNotificationRead}
            onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
            workflowStage={workflowStage}
            orchestratorResult={orchestratorResult}
            activeTicket={activeWorkflowTicket}
            onStageUpdate={handleStageUpdate}
            initialAssistantQuery={assistantSeedQuery}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            tickets={tickets}
            analytics={analytics}
            onTicketUpdated={handleTicketUpdated}
            onResetDemo={handleResetDemo}
          />
        )}
      </main>

      {/* Ticket Detail Modal */}
      <TicketDetailModal
        ticket={selectedTicketForModal}
        onClose={() => setSelectedTicketForModal(null)}
        onOpenWorkflow={() => {
          if (selectedTicketForModal) {
            setActiveWorkflowTicket(selectedTicketForModal);
            setWorkflowStage(selectedTicketForModal.status === 'Resolved' ? 9 : 7);
          }
          setCurrentView('student');
        }}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onSelectTicketNumber={(ticketNum) => {
          const t = tickets.find(item => item.ticket_number === ticketNum);
          if (t) setSelectedTicketForModal(t);
        }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Vercel Speed Insights */}
      <SpeedInsights />

    </div>
  );
}

export default App;
