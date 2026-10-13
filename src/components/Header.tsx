import React, { useState } from 'react';
import {
  ShieldAlert,
  Bell,
  Building,
  CheckCircle2,
  ChevronDown,
  Radio,
  UserCheck,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { User } from '../types/api';
import { PRESET_ACCOUNTS } from '../services/api';

interface HeaderProps {
  currentUser: User;
  onAccountSwitch: (accountKey: 'resident' | 'guardian' | 'security' | 'volunteer' | 'admin') => void;
  unreadNotificationsCount: number;
  onNavigateNotifications: () => void;
  activeIncidentsCount: number;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onAccountSwitch,
  unreadNotificationsCount,
  onNavigateNotifications,
  activeIncidentsCount,
  onOpenAuthModal,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const accounts = [
    { key: 'resident' as const, name: 'Anita Rao', role: 'Resident', unit: 'Tower 1 - Flat 402', phone: '+91 98112 23344' },
    { key: 'guardian' as const, name: 'Rajesh Sharma', role: 'Guardian', unit: 'Son of Anita Rao', phone: '+91 91234 56789' },
    { key: 'security' as const, name: 'Vikram Singh', role: 'Security Staff', unit: 'Gate 1 Control Room', phone: '+91 98220 33445' },
    { key: 'volunteer' as const, name: 'Dr. Arvind Swaminathan', role: 'Volunteer Doctor', unit: 'Tower 1 - Flat 101', phone: '+91 98450 11223' },
    { key: 'admin' as const, name: 'Estate Office', role: 'Society Administrator', unit: 'Management Desk', phone: '+91 98765 43210' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-white flex items-center gap-2">
                <span>ResQCommunity</span>
                <span className="text-[10px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded uppercase">
                  Emergency Portal
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Building className="w-3 h-3 text-slate-400" />
                <span>{currentUser.society_name || 'Palm Meadows Estates'}</span>
              </p>
            </div>
          </div>

          {/* Right Action Icons & User Switcher */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Active Incident Warning if any */}
            {activeIncidentsCount > 0 && (
              <div className="hidden md:flex items-center gap-2 bg-red-500/15 border border-red-500/30 px-3 py-1 rounded-full text-xs font-semibold text-red-400 animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                <span>{activeIncidentsCount} Active Alert{activeIncidentsCount > 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Notification Bell */}
            <button
              onClick={onNavigateNotifications}
              className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* User Profile & Account Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center space-x-2.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400 font-bold text-xs">
                  {currentUser.first_name?.[0] || 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="font-semibold text-slate-100 leading-tight">
                    {currentUser.first_name} {currentUser.last_name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {currentUser.primary_role.replace('_', ' ')}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Role Switcher Menu */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-800 flex justify-between items-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Active Community Accounts
                    </p>
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        onOpenAuthModal();
                      }}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      + Register / Login
                    </button>
                  </div>
                  <div className="py-1">
                    {accounts.map((item) => {
                      const isCurrent = currentUser.username === PRESET_ACCOUNTS[item.key].username;
                      return (
                        <button
                          key={item.key}
                          onClick={() => {
                            onAccountSwitch(item.key);
                            setShowRoleMenu(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs flex items-start justify-between hover:bg-slate-800 transition-colors ${
                            isCurrent ? 'bg-slate-800 text-white font-bold' : 'text-slate-300'
                          }`}
                        >
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {item.role} &bull; {item.unit}
                            </p>
                          </div>
                          {isCurrent && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
