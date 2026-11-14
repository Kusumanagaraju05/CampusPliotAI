import React from 'react';
import { 
  X, 
  Bell, 
  CheckCheck, 
  ArrowRight, 
  AlertCircle, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onSelectTicketNumber?: (ticketNumber: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onSelectTicketNumber
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            <h3 className="font-extrabold text-white text-base">In-App Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            {notifications.filter(n => !n.is_read).length} unread updates
          </span>
          <button
            onClick={onMarkAllRead}
            className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No notifications at this time.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.is_read) onMarkRead(n.id);
                  if (n.ticket_number && onSelectTicketNumber) {
                    onSelectTicketNumber(n.ticket_number);
                    onClose();
                  }
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  n.is_read
                    ? 'bg-slate-950/40 border-slate-800/80 opacity-70'
                    : 'bg-indigo-950/20 border-indigo-500/30 shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    )}
                    <span className="text-xs font-bold text-white">{n.title}</span>
                  </div>
                  {n.ticket_number && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-indigo-300 border border-indigo-500/20 font-bold">
                      {n.ticket_number}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-2">
                  {n.message}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span>{new Date(n.created_at).toLocaleString()}</span>
                  {n.ticket_number && (
                    <span className="text-indigo-400 font-semibold flex items-center gap-0.5">
                      <span>View ticket</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
