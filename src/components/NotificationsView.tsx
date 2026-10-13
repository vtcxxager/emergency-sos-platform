import React from 'react';
import { Bell, CheckCheck, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { NotificationItem, Incident } from '../types/api';
import { apiService } from '../services/api';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  onNotificationsUpdated: () => void;
  onSelectIncidentById: (id: number) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onNotificationsUpdated,
  onSelectIncidentById,
}) => {
  const handleMarkAllRead = async () => {
    for (const n of notifications) {
      if (!n.is_read) {
        await apiService.markNotificationRead(n.id);
      }
    }
    onNotificationsUpdated();
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.is_read) {
      await apiService.markNotificationRead(item.id);
      onNotificationsUpdated();
    }
    if (item.incident_id) {
      onSelectIncidentById(item.incident_id);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Notifications &amp; Alert History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Emergency broadcasts, responder acknowledgments, and verification messages
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <CheckCheck className="w-4 h-4" />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p>No notifications at this time.</p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                item.is_read
                  ? 'bg-white border-slate-200 hover:border-slate-300'
                  : 'bg-blue-50/60 border-blue-200 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    item.channel === 'PUSH_AND_SMS'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{item.body}</p>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                    <span>&bull;</span>
                    <span className="font-mono">{item.channel}</span>
                  </p>
                </div>
              </div>

              {item.incident_id && (
                <button
                  type="button"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
                >
                  <span>View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
