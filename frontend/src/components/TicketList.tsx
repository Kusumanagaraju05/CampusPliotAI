import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  FileText, 
  Bot,
  Building2,
  Calendar
} from 'lucide-react';
import { Ticket, CategoryType, TicketStatusType, PriorityType } from '../types';

interface TicketListProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  selectedCategory: CategoryType;
  setSelectedCategory: (c: CategoryType) => void;
  selectedStatus: TicketStatusType;
  setSelectedStatus: (s: TicketStatusType) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  onSelectTicket,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
  searchQuery,
  setSearchQuery
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Resolved</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>In Progress</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">High Priority</span>;
      case 'low':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Low Priority</span>;
      default:
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">Medium Priority</span>;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by ID, keyword, or title..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as TicketStatusType)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium py-2 px-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as CategoryType)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium py-2 px-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="attendance">Attendance</option>
            <option value="finance">Finance</option>
            <option value="document">Document</option>
            <option value="academic">Academic</option>
          </select>
        </div>

      </div>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-300 mb-1">No Support Tickets Found</h4>
          <p className="text-xs text-slate-400">
            Try adjusting your search query or filters, or ask the AI Assistant to report an issue.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelectTicket(t)}
              className="p-5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer shadow-md group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {t.ticket_number}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t.category}
                  </span>
                  {getPriorityBadge(t.priority)}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(t.status)}
                </div>
              </div>

              <h4 className="font-bold text-white text-sm mb-2 group-hover:text-indigo-200 transition-colors">
                {t.title}
              </h4>

              <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                {t.description}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-indigo-300 font-medium">
                    <Bot className="w-3.5 h-3.5" />
                    <span>{t.assigned_agent}</span>
                  </span>
                  <span className="hidden md:flex items-center gap-1.5 text-slate-400">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[220px]">{t.department}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(t.created_at).toLocaleDateString()}</span>
                  </span>
                  <span className="text-indigo-400 font-bold group-hover:translate-x-1 transition-transform flex items-center">
                    Inspect
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
