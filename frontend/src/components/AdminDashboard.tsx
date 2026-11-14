import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  UserCog, 
  Building2, 
  Bot, 
  FileText, 
  MessageSquare, 
  Send, 
  ChevronRight, 
  BarChart3, 
  PieChart as PieIcon, 
  RotateCcw,
  X,
  ExternalLink
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Ticket, AnalyticsData, CategoryType, TicketStatusType, PriorityType } from '../types';
import { updateTicketStatus, updateTicketDepartment, addStaffNote } from '../api';

interface AdminDashboardProps {
  tickets: Ticket[];
  analytics: AnalyticsData | null;
  onTicketUpdated: (updatedTicket: Ticket) => void;
  onResetDemo: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  tickets,
  analytics,
  onTicketUpdated,
  onResetDemo
}) => {
  const [selectedStaff, setSelectedStaff] = useState({
    id: 'stf-jenkins',
    name: 'Dr. Sarah Jenkins',
    role: 'Dean of Academic Affairs'
  });

  const staffOptions = [
    { id: 'stf-jenkins', name: 'Dr. Sarah Jenkins', role: 'Dean of Academic Affairs' },
    { id: 'stf-registrar', name: 'Prof. Ramesh Kumar', role: 'Academic Registrar' },
    { id: 'stf-accounts', name: 'Mr. Vikram Rao', role: 'Accounts Officer' }
  ];

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType>('all');
  const [statusFilter, setStatusFilter] = useState<TicketStatusType>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityType>('all');

  // Active Managing Ticket
  const [managingTicket, setManagingTicket] = useState<Ticket | null>(null);
  const [newStaffNote, setNewStaffNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Departments list for reassigning
  const departmentOptions = [
    "Attendance & Academic Records Department",
    "Accounts & Finance Department",
    "Student Affairs & Registrar Office",
    "Office of Controller of Examinations & Academic Dean"
  ];

  const filteredTickets = tickets.filter(t => {
    const matchCat = categoryFilter === 'all' || t.category === categoryFilter;
    const matchStat = statusFilter === 'all' || t.status === statusFilter;
    const matchPrio = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchSearch = !searchQuery.trim() ||
      t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchStat && matchPrio && matchSearch;
  });

  const handleStatusChange = async (newStatus: string) => {
    if (!managingTicket) return;
    setIsUpdating(true);
    try {
      await updateTicketStatus(managingTicket.id, {
        status: newStatus,
        staff_id: selectedStaff.id,
        staff_name: selectedStaff.name,
        note: newStaffNote.trim() || `Status updated to ${newStatus} by ${selectedStaff.name}`
      });

      const updated: Ticket = {
        ...managingTicket,
        status: newStatus as any,
        staff_notes: [
          ...(managingTicket.staff_notes || []),
          {
            id: `note-${Date.now()}`,
            ticket_id: managingTicket.id,
            staff_id: selectedStaff.id,
            staff_name: selectedStaff.name,
            note: newStaffNote.trim() || `Status updated to ${newStatus} by ${selectedStaff.name}`,
            created_at: new Date().toISOString()
          }
        ]
      };
      setManagingTicket(updated);
      onTicketUpdated(updated);
      setNewStaffNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDepartmentReassign = async (newDept: string) => {
    if (!managingTicket) return;
    setIsUpdating(true);
    try {
      await updateTicketDepartment(managingTicket.id, {
        department: newDept,
        staff_id: selectedStaff.id,
        staff_name: selectedStaff.name,
        note: `Reassigned to ${newDept} by ${selectedStaff.name}`
      });

      const updated: Ticket = {
        ...managingTicket,
        department: newDept,
        staff_notes: [
          ...(managingTicket.staff_notes || []),
          {
            id: `note-${Date.now()}`,
            ticket_id: managingTicket.id,
            staff_id: selectedStaff.id,
            staff_name: selectedStaff.name,
            note: `Reassigned to ${newDept} by ${selectedStaff.name}`,
            created_at: new Date().toISOString()
          }
        ]
      };
      setManagingTicket(updated);
      onTicketUpdated(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!managingTicket || !newStaffNote.trim()) return;
    setIsUpdating(true);
    try {
      await addStaffNote(managingTicket.id, {
        staff_id: selectedStaff.id,
        staff_name: selectedStaff.name,
        note: newStaffNote.trim()
      });

      const updated: Ticket = {
        ...managingTicket,
        staff_notes: [
          ...(managingTicket.staff_notes || []),
          {
            id: `note-${Date.now()}`,
            ticket_id: managingTicket.id,
            staff_id: selectedStaff.id,
            staff_name: selectedStaff.name,
            note: newStaffNote.trim(),
            created_at: new Date().toISOString()
          }
        ]
      };
      setManagingTicket(updated);
      onTicketUpdated(updated);
      setNewStaffNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const COLORS = ['#6366F1', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Header with Active Staff Role */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-violet-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Campus Operations Portal
            </span>
            <span className="text-xs text-slate-400">Institutional Governance</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            Staff & Administrative Control Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review AI classifications, approve action plans, reassign departments, and close tickets.
          </p>
        </div>

        {/* Staff Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
            <UserCog className="w-4 h-4 text-violet-400 ml-1" />
            <select
              value={selectedStaff.id}
              onChange={(e) => {
                const opt = staffOptions.find(o => o.id === e.target.value);
                if (opt) setSelectedStaff(opt);
              }}
              className="bg-transparent text-xs text-slate-200 font-bold focus:outline-none cursor-pointer pr-2"
            >
              {staffOptions.map(st => (
                <option key={st.id} value={st.id} className="bg-slate-900 text-white">
                  {st.name} — {st.role}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onResetDemo}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all"
            title="Reset demo data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-slate-400 text-xs font-semibold block mb-1">Total Submissions</span>
          <div className="text-2xl font-black text-white">{analytics?.total_tickets || tickets.length}</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-amber-400 text-xs font-semibold block mb-1">Pending Approval</span>
          <div className="text-2xl font-black text-amber-400">
            {tickets.filter(t => t.status === 'Pending').length}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-blue-400 text-xs font-semibold block mb-1">In Progress</span>
          <div className="text-2xl font-black text-blue-400">
            {tickets.filter(t => t.status === 'In Progress').length}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-emerald-400 text-xs font-semibold block mb-1">Resolved</span>
          <div className="text-2xl font-black text-emerald-400">
            {tickets.filter(t => t.status === 'Resolved').length}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md col-span-2 sm:col-span-1">
          <span className="text-rose-400 text-xs font-semibold block mb-1">High Priority</span>
          <div className="text-2xl font-black text-rose-400">
            {tickets.filter(t => t.priority === 'high').length}
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Department Distribution Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Department-Wise Ticket Load</h3>
            </div>
            <span className="text-xs text-slate-400">Active Routing</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.department_distribution || []}>
                <XAxis 
                  dataKey="name" 
                  stroke="#64748B" 
                  fontSize={10} 
                  tickFormatter={(val) => val.split(' ')[0]} 
                />
                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                />
                <Bar dataKey="value" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-bold text-white">Problem Category Distribution</h3>
            </div>
            <span className="text-xs text-slate-400">AI Classification</span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.category_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(analytics?.category_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Ticket Operations Table */}
      <div className="space-y-4">
        
        {/* Table Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket ID, student name, department..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TicketStatusType)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium py-2 px-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CategoryType)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium py-2 px-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="attendance">Attendance</option>
              <option value="finance">Finance</option>
              <option value="document">Document</option>
              <option value="academic">Academic</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as PriorityType)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium py-2 px-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

          </div>
        </div>

        {/* Operations Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Problem Summary</th>
                  <th className="py-3.5 px-4">Assigned Agent</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400 whitespace-nowrap">
                      {t.ticket_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                      {t.student_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                      {t.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-medium">
                        {t.assigned_agent}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-[180px] truncate">
                      {t.department}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        t.priority === 'high' ? 'bg-rose-500/20 text-rose-400' :
                        t.priority === 'low' ? 'bg-slate-800 text-slate-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        t.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                        t.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setManagingTicket(t)}
                        className="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white font-bold text-[11px] border border-violet-500/30 transition-all cursor-pointer"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Staff Action Drawer / Modal */}
      {managingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Drawer Header */}
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {managingTicket.ticket_number}
                  </span>
                  <span className="text-xs text-slate-400">Student: <strong>{managingTicket.student_name}</strong></span>
                </div>
                <h3 className="text-base font-bold text-white">{managingTicket.title}</h3>
              </div>
              <button
                onClick={() => setManagingTicket(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Problem Description */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-400 block font-bold uppercase mb-1">Problem Description:</span>
                <p className="text-slate-200 leading-relaxed whitespace-pre-line">{managingTicket.description}</p>
              </div>

              {/* Action Plan generated by AI */}
              {managingTicket.action_plan && managingTicket.action_plan.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    AI Recommended Action Steps:
                  </h4>
                  <div className="space-y-1.5">
                    {managingTicket.action_plan.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Staff Operations: Department Assignment & Status Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                
                {/* Department Reassignment */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Assign Responsible Department:
                  </label>
                  <select
                    value={managingTicket.department}
                    onChange={(e) => handleDepartmentReassign(e.target.value)}
                    disabled={isUpdating}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
                  >
                    {departmentOptions.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Status Update */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Current Ticket Status:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusChange('Pending')}
                      disabled={isUpdating}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                        managingTicket.status === 'Pending'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => handleStatusChange('In Progress')}
                      disabled={isUpdating}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                        managingTicket.status === 'In Progress'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => handleStatusChange('Resolved')}
                      disabled={isUpdating}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                        managingTicket.status === 'Resolved'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      Resolved
                    </button>
                  </div>
                </div>

              </div>

              {/* Staff Notes Log */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Official Audit Notes ({managingTicket.staff_notes?.length || 0})
                </h4>
                {managingTicket.staff_notes && managingTicket.staff_notes.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {managingTicket.staff_notes.map((note) => (
                      <div key={note.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-violet-300">{note.staff_name}</span>
                          <span className="text-[10px] text-slate-400">{new Date(note.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-200 italic">"{note.note}"</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic mb-3">No staff notes added yet.</p>
                )}

                {/* Add Note Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStaffNote}
                    onChange={(e) => setNewStaffNote(e.target.value)}
                    placeholder={`Add official staff note as ${selectedStaff.name}...`}
                    className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newStaffNote.trim() || isUpdating}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Note</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Acting as: <strong className="text-white">{selectedStaff.name}</strong>
              </span>

              <div className="flex items-center gap-2">
                {managingTicket.status !== 'Resolved' && (
                  <button
                    onClick={() => handleStatusChange('Resolved')}
                    disabled={isUpdating}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Mark Resolved</span>
                  </button>
                )}
                <button
                  onClick={() => setManagingTicket(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
