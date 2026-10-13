/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { SOSEmergencyView } from './components/SOSEmergencyView';
import { IncidentsView } from './components/IncidentsView';
import { ContactsView } from './components/ContactsView';
import { GuardiansView } from './components/GuardiansView';
import { RespondersView } from './components/RespondersView';
import { NotificationsView } from './components/NotificationsView';
import { ProfileView } from './components/ProfileView';
import { AdminView } from './components/AdminView';
import { AuthModal } from './components/AuthModal';
import {
  User,
  EmergencyContact,
  Incident,
  NotificationItem,
  CommunityAssistanceRequest,
} from './types/api';
import { apiService, PRESET_ACCOUNTS } from './services/api';
import {
  Users,
  Shield,
  HeartHandshake,
  Radio,
  Building2,
  CheckCircle2,
  LogIn,
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<User>(apiService.getCurrentUser());
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [communityRequests, setCommunityRequests] = useState<CommunityAssistanceRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Load initial data
  const refreshData = async () => {
    const loadedContacts = await apiService.getEmergencyContacts();
    const loadedIncidents = await apiService.getIncidents();
    const loadedCommunityRequests = await apiService.getCommunityRequests();
    const loadedNotifications = await apiService.getNotifications();

    setContacts(loadedContacts);
    setIncidents(loadedIncidents);
    setCommunityRequests(loadedCommunityRequests);
    setNotifications(loadedNotifications);
    setCurrentUser(apiService.getCurrentUser());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleAccountSwitch = (accountKey: 'resident' | 'guardian' | 'security' | 'volunteer' | 'admin') => {
    apiService.switchAccount(accountKey);
    refreshData();
  };

  const handleSOSCreated = (newIncident: Incident) => {
    refreshData();
    setSelectedIncident(newIncident);
    setCurrentTab('incidents');
  };

  const handleSelectIncidentById = (id: number) => {
    const inc = incidents.find((i) => i.id === id);
    if (inc) {
      setSelectedIncident(inc);
      setCurrentTab('incidents');
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length;
  const activeIncidents = incidents.filter((i) => i.status === 'OPEN' || i.status === 'ACTIVE_RESPONSE');

  const demoAccounts = [
    { key: 'resident' as const, label: 'Anita Rao', role: 'Resident (Flat 402)', icon: Users, color: 'text-red-600' },
    { key: 'guardian' as const, label: 'Rajesh Sharma', role: 'Primary Guardian', icon: Shield, color: 'text-amber-600' },
    { key: 'security' as const, label: 'Vikram Singh', role: 'Security Desk (Gate 1)', icon: Radio, color: 'text-blue-600' },
    { key: 'volunteer' as const, label: 'Dr. Arvind', role: 'Volunteer Doctor (Flat 101)', icon: HeartHandshake, color: 'text-emerald-600' },
    { key: 'admin' as const, label: 'Estate Office', role: 'Society Administrator', icon: Building2, color: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-600/20 selection:text-red-900">
      {/* Real Application Header */}
      <Header
        currentUser={currentUser}
        onAccountSwitch={handleAccountSwitch}
        unreadNotificationsCount={unreadNotificationsCount}
        onNavigateNotifications={() => setCurrentTab('notifications')}
        activeIncidentsCount={activeIncidents.length}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      {/* MULTI-USER LIVE TESTING BAR (Test real community workflow without opening multiple browsers) */}
      <div className="bg-slate-900/95 border-b border-slate-800 text-white px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-slate-300">Live Multi-User Network:</span>
            <span className="text-[11px] text-slate-400 hidden md:inline">
              Switch role to experience real-time emergency notifications &amp; responder assignment
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {demoAccounts.map((account) => {
              const isActive = currentUser.username === PRESET_ACCOUNTS[account.key].username;
              const Icon = account.icon;
              return (
                <button
                  key={account.key}
                  type="button"
                  onClick={() => handleAccountSwitch(account.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-red-600 text-white font-bold shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                  title={account.role}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{account.label}</span>
                  {isActive && <CheckCircle2 className="w-3 h-3 text-white" />}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="px-2.5 py-1 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
            >
              <LogIn className="w-3 h-3" />
              <span>Login / Custom</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar Navigation + Active Screen Content */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          activeIncidentsCount={activeIncidents.length}
          unreadNotificationsCount={unreadNotificationsCount}
          currentUser={currentUser}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {currentTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              contacts={contacts}
              incidents={incidents}
              communityRequests={communityRequests}
              notifications={notifications}
              onNavigateTab={setCurrentTab}
              onSelectIncident={(inc) => {
                setSelectedIncident(inc);
                setCurrentTab('incidents');
              }}
              onSOSCreated={handleSOSCreated}
              onCommunityRequestCreated={refreshData}
              onRefreshData={refreshData}
            />
          )}

          {currentTab === 'sos' && (
            <SOSEmergencyView
              currentUser={currentUser}
              onSOSCreated={handleSOSCreated}
              activeIncident={activeIncidents[0] || null}
              onSelectIncident={(inc) => {
                setSelectedIncident(inc);
                setCurrentTab('incidents');
              }}
            />
          )}

          {currentTab === 'incidents' && (
            <IncidentsView
              currentUser={currentUser}
              incidents={incidents}
              selectedIncident={selectedIncident}
              onSelectIncident={setSelectedIncident}
              onIncidentUpdated={refreshData}
            />
          )}

          {currentTab === 'contacts' && (
            <ContactsView
              currentUser={currentUser}
              contacts={contacts}
              onContactsUpdated={refreshData}
            />
          )}

          {currentTab === 'guardians' && (
            <GuardiansView
              currentUser={currentUser}
              contacts={contacts}
              onNavigateContacts={() => setCurrentTab('contacts')}
            />
          )}

          {currentTab === 'responders' && <RespondersView currentUser={currentUser} />}

          {currentTab === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              onNotificationsUpdated={refreshData}
              onSelectIncidentById={handleSelectIncidentById}
            />
          )}

          {currentTab === 'profile' && (
            <ProfileView
              currentUser={currentUser}
              onUpdateUser={(updated) => {
                apiService.setCurrentUser(updated);
                setCurrentUser(updated);
              }}
            />
          )}

          {currentTab === 'admin' && (
            <AdminView
              currentUser={currentUser}
              incidents={incidents}
            />
          )}
        </main>
      </div>

      {/* Auth Modal (Login / Register / Quick Switch) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          refreshData();
        }}
        onAccountSelect={(key) => {
          handleAccountSwitch(key);
        }}
      />

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p className="font-semibold text-slate-700">
            ResQCommunity &bull; Community Emergency Response Platform
          </p>
          <p className="text-[11px] text-slate-400">
            Protected Community Network &bull; 24/7 Gate &amp; Guardian Dispatch Active &bull; Django REST &bull; PostgreSQL
          </p>
        </div>
      </footer>
    </div>
  );
}
