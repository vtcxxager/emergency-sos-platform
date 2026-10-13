import React, { useState } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  BadgeCheck,
  AlertTriangle,
} from 'lucide-react';
import { User, Incident } from '../types/api';

interface AdminViewProps {
  currentUser: User;
  incidents: Incident[];
}

export const AdminView: React.FC<AdminViewProps> = ({ currentUser, incidents }) => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'structure' | 'escalation' | 'audit'>('approvals');

  // Sample pending resident & volunteer approvals
  const [pendingUsers, setPendingUsers] = useState([
    {
      id: 201,
      name: 'Sunil Verma',
      email: 'sunil.v@gmail.com',
      phone: '+91 98450 66778',
      role: 'RESIDENT',
      unit: 'Tower 2 - Flat 501',
      requestedAt: '2026-10-12T14:30:00Z',
    },
    {
      id: 202,
      name: 'Pooja Hegde',
      email: 'pooja.h@apollo.org',
      phone: '+91 98450 99001',
      role: 'VOLUNTEER',
      qualifications: 'Registered Nurse (Apollo Hospital)',
      unit: 'Tower 1 - Flat 605',
      requestedAt: '2026-10-12T18:00:00Z',
    },
  ]);

  const [approvedCount, setApprovedCount] = useState(142);

  const handleApprove = (userId: number) => {
    setPendingUsers(pendingUsers.filter((u) => u.id !== userId));
    setApprovedCount(approvedCount + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
              Administrator Console
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              {currentUser.society_name || 'Palm Meadows Estates'} Administration
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage resident approvals, building structure, security assignments, and emergency escalation policies.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start text-xs font-semibold">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'approvals' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            User Approvals ({pendingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('structure')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'structure' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Towers &amp; Flats
          </button>
          <button
            onClick={() => setActiveTab('escalation')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'escalation' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Escalation Rules
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Log ({incidents.length})
          </button>
        </div>
      </div>

      {/* Tab 1: User Approvals */}
      {activeTab === 'approvals' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              Pending Resident &amp; Volunteer Memberships
            </h3>
            <span className="text-xs text-slate-500">
              Total Approved Society Residents: <strong>{approvedCount}</strong>
            </span>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p>All resident and volunteer registration requests have been approved.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{user.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">
                      {user.unit} &bull; {user.phone} &bull; {user.email}
                    </p>
                    {user.qualifications && (
                      <p className="text-emerald-700 font-semibold mt-1">
                        Qualifications: {user.qualifications}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleApprove(user.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
                    >
                      Approve Membership
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Towers & Flats Structure */}
      {activeTab === 'structure' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
            Society Residential Infrastructure
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="font-bold text-slate-800 text-sm block">Tower 1 (Magnolia)</span>
              <p className="text-slate-500 mt-1">10 Floors &bull; 40 Residential Flats</p>
              <p className="text-emerald-700 font-bold mt-2">Occupancy: 38 / 40 (95%)</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="font-bold text-slate-800 text-sm block">Tower 2 (Orchid)</span>
              <p className="text-slate-500 mt-1">12 Floors &bull; 48 Residential Flats</p>
              <p className="text-emerald-700 font-bold mt-2">Occupancy: 45 / 48 (93%)</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="font-bold text-slate-800 text-sm block">Tower 3 (Jacaranda)</span>
              <p className="text-slate-500 mt-1">14 Floors &bull; 56 Residential Flats</p>
              <p className="text-emerald-700 font-bold mt-2">Occupancy: 52 / 56 (92%)</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Escalation Configuration */}
      {activeTab === 'escalation' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
            Society-Wide Emergency Escalation Rules
          </h3>
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <p className="font-bold text-slate-900">T1 Primary Guardian Timeout Window: 120 Seconds</p>
              <p className="text-slate-500 mt-0.5">
                If the resident's primary caregiver does not tap "Accept" within 120 seconds, the Celery background scheduler automatically escalates to Tier 2.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <p className="font-bold text-slate-900">T2 Secondary Guardian Timeout Window: 180 Seconds</p>
              <p className="text-slate-500 mt-0.5">
                If the secondary guardian does not respond, the alert escalates to on-duty Security and active certified Tower Volunteers (+300s total).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
            Official Emergency Incident Audit Trail
          </h3>
          <div className="space-y-2">
            {incidents.map((inc) => (
              <div key={inc.id} className="p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-mono font-bold text-slate-900">Incident #{inc.id}</span>
                  <span className="mx-2 text-slate-400">&bull;</span>
                  <span className="font-semibold">{inc.category_display}</span>
                  <span className="mx-2 text-slate-400">&bull;</span>
                  <span className="text-slate-500">{inc.flat_display}</span>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">
                  {new Date(inc.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
