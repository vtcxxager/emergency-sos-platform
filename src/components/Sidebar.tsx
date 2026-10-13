import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  AlertTriangle,
  Users,
  Shield,
  HeartHandshake,
  Bell,
  User,
  Radio,
  Building2,
} from 'lucide-react';
import { User as UserType } from '../types/api';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  activeIncidentsCount: number;
  unreadNotificationsCount: number;
  currentUser: UserType;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeIncidentsCount,
  unreadNotificationsCount,
  currentUser,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'sos',
      label: 'SOS Emergency',
      icon: ShieldAlert,
      isEmergency: true,
      badge: null,
    },
    {
      id: 'incidents',
      label: 'Incidents & Alerts',
      icon: AlertTriangle,
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : null,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'contacts',
      label: 'Emergency Contacts',
      icon: Users,
      badge: null,
    },
    {
      id: 'guardians',
      label: 'Guardians & Escalation',
      icon: Shield,
      badge: null,
    },
    {
      id: 'responders',
      label: 'Community Responders',
      icon: HeartHandshake,
      badge: null,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : null,
      badgeColor: 'bg-blue-600 text-white',
    },
    {
      id: 'profile',
      label: 'My Profile & Vitals',
      icon: User,
      badge: null,
    },
    ...(currentUser.primary_role === 'SOCIETY_ADMIN'
      ? [
          {
            id: 'admin',
            label: 'Admin Console',
            icon: Building2,
            badge: null,
          },
        ]
      : []),
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
      <div className="py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                item.isEmergency
                  ? isActive
                    ? 'bg-red-600 text-white font-bold shadow-md'
                    : 'bg-red-600/10 text-red-400 hover:bg-red-600/20 border border-red-500/30 font-semibold'
                  : isActive
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    item.isEmergency
                      ? isActive
                        ? 'text-white'
                        : 'text-red-400'
                      : isActive
                      ? 'text-blue-400'
                      : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== null && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    item.badgeColor || 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Community Desk Info Widget */}
      <div className="p-4 m-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Security Desk (24/7)</span>
        </div>
        <p className="text-[11px] text-slate-400 font-mono">+91 98765 43210</p>
        <p className="text-[10px] text-slate-500 mt-1">Gate 1 Control Room &bull; Channel 4</p>
      </div>
    </aside>
  );
};
