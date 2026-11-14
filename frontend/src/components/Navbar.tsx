import React from 'react';
import { 
  Bot, 
  ShieldCheck, 
  Bell, 
  RotateCcw, 
  User, 
  UserCog, 
  Sparkles,
  ChevronDown,
  Layers
} from 'lucide-react';
import { Student, SystemStatus, NotificationItem } from '../types';

interface NavbarProps {
  currentView: 'landing' | 'student' | 'admin';
  setCurrentView: (view: 'landing' | 'student' | 'admin') => void;
  students: Student[];
  currentStudent: Student | null;
  setCurrentStudent: (s: Student) => void;
  systemStatus: SystemStatus | null;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  onResetDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  students,
  currentStudent,
  setCurrentStudent,
  systemStatus,
  notifications,
  onOpenNotifications,
  onResetDemo
}) => {
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="sticky top-0 z-40 bg-[#0B1120]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Logo & Branding */}
        <div 
          onClick={() => setCurrentView('landing')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0B1120] rounded-[10px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                CampusPilot
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 tracking-wider">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block font-medium">
              Your Campus. Your AI. Your Problems Solved.
            </p>
          </div>
        </div>

        {/* Center: System AI Engine Status Badge */}
        <div className="hidden md:flex items-center">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                systemStatus?.gemini_api_configured ? 'bg-emerald-400' : 'bg-indigo-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                systemStatus?.gemini_api_configured ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}></span>
            </span>
            <span className="text-slate-300 font-medium">
              Engine: <strong className="text-white">{systemStatus?.engine_display_name || 'Loading Engine...'}</strong>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {systemStatus?.gemini_api_configured ? 'Live API' : 'Fallback Engine'}
            </span>
          </div>
        </div>

        {/* Right Action Controls: Role Navigation, Student Selector, Notifications, Demo Reset */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setCurrentView('landing')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                currentView === 'landing' 
                  ? 'bg-slate-800 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setCurrentView('student')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentView === 'student' 
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>
            <button
              onClick={() => setCurrentView('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentView === 'admin' 
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCog className="w-3.5 h-3.5" />
              <span>Staff / Admin</span>
            </button>
          </div>

          {/* Student Persona Dropdown (Visible in student mode) */}
          {currentView === 'student' && currentStudent && (
            <div className="relative group">
              <select
                value={currentStudent.id}
                onChange={(e) => {
                  const s = students.find(item => item.id === e.target.value);
                  if (s) setCurrentStudent(s);
                }}
                className="appearance-none bg-slate-900 hover:bg-slate-800 text-xs text-slate-200 font-medium py-1.5 pl-3 pr-8 rounded-lg border border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.student_id_code})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* In-app Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Demo Reset Button */}
          <button
            onClick={onResetDemo}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs border border-slate-800 transition-colors"
            title="Reset demo data to initial state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Demo</span>
          </button>
        </div>

      </div>
    </header>
  );
};
