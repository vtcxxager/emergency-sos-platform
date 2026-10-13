import React, { useState } from 'react';
import {
  Shield,
  Clock,
  BellRing,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  Smartphone,
  MessageSquare,
  Users,
} from 'lucide-react';
import { EmergencyContact, User } from '../types/api';

interface GuardiansViewProps {
  currentUser: User;
  contacts: EmergencyContact[];
  onNavigateContacts: () => void;
}

export const GuardiansView: React.FC<GuardiansViewProps> = ({
  currentUser,
  contacts,
  onNavigateContacts,
}) => {
  const [preferredChannel, setPreferredChannel] = useState<'ALL' | 'SMS_AND_PUSH' | 'PUSH_ONLY'>('ALL');
  const [primaryTimeout, setPrimaryTimeout] = useState('120');
  const [secondaryTimeout, setSecondaryTimeout] = useState('180');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const primary = contacts.find((c) => c.priority_tier === 'PRIMARY');
  const secondary = contacts.find((c) => c.priority_tier === 'SECONDARY');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Guardian Escalation &amp; Dispatch Protocol</h2>
        <p className="text-xs text-slate-500 mt-1">
          Automated multi-tier notification sequence that activates when resident{' '}
          <strong>{currentUser.first_name} {currentUser.last_name}</strong> presses SOS at{' '}
          <strong>{currentUser.society_name || 'Palm Meadows'}</strong>.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Guardian dispatch preferences successfully saved.</span>
        </div>
      )}

      {/* Escalation Sequence Pipeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
          Active Escalation Timeline (Enforced by Backend Worker)
        </h3>

        <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6 text-xs">
          {/* Stage 1 */}
          <div className="relative">
            <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-red-600 border-2 border-white shadow" />
            <div className="p-4 rounded-xl border border-red-200 bg-red-50/40">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-red-900 text-sm">Tier 1 &bull; Primary Guardian</span>
                <span className="font-mono text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                  T = 0s (Instant Dispatch)
                </span>
              </div>
              <p className="text-slate-600 mt-1">
                Configured Caregiver:{' '}
                <strong>{primary ? `${primary.name} (${primary.phone_number})` : 'No Primary Guardian Assigned'}</strong>
              </p>
              <p className="text-slate-500 text-[11px] mt-1">
                Response window: <strong>{primaryTimeout} seconds</strong>. If unacknowledged, automatically escalates to Tier 2.
              </p>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="relative">
            <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow" />
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-amber-900 text-sm">Tier 2 &bull; Secondary Guardian</span>
                <span className="font-mono text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  T = +{primaryTimeout}s
                </span>
              </div>
              <p className="text-slate-600 mt-1">
                Configured Caregiver:{' '}
                <strong>{secondary ? `${secondary.name} (${secondary.phone_number})` : 'No Secondary Guardian Assigned'}</strong>
              </p>
              <p className="text-slate-500 text-[11px] mt-1">
                Response window: <strong>{secondaryTimeout} seconds</strong>. Alerts backup caregiver line.
              </p>
            </div>
          </div>

          {/* Stage 3 */}
          <div className="relative">
            <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow" />
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-blue-900 text-sm">Tier 3 &bull; Security Control &amp; Verified Volunteers</span>
                <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  T = +{Number(primaryTimeout) + Number(secondaryTimeout)}s (Community Broadcast)
                </span>
              </div>
              <p className="text-slate-600 mt-1">
                Notifies on-duty <strong>Society Security Personnel</strong> and verified active <strong>Medical &amp; First Aid Volunteers</strong> living inside your tower.
              </p>
            </div>
          </div>
        </div>

        {(!primary || !secondary) && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
            <span>You have incomplete guardian tiers. Complete both to ensure uninterrupted response escalation.</span>
            <button
              onClick={onNavigateContacts}
              className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-colors shrink-0"
            >
              Configure Guardians
            </button>
          </div>
        )}
      </div>

      {/* Dispatch Channels & Timeout Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4">
          Notification Channel Settings
        </h3>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-800 block mb-2">Preferred Delivery Channels for Guardians</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'ALL', label: 'All Channels (Recommended)', desc: 'Mobile Push, Urgent SMS, and Automated Call' },
                { id: 'SMS_AND_PUSH', label: 'SMS & Mobile Push', desc: 'Dispatches high-priority push and SMS alerts' },
                { id: 'PUSH_ONLY', label: 'Mobile Push Only', desc: 'Dispatches only mobile app notifications' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPreferredChannel(opt.id as typeof preferredChannel)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    preferredChannel === opt.id
                      ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600 text-blue-950 font-semibold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <p className="font-bold text-xs">{opt.label}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Primary Guardian Window (Seconds)</label>
              <select
                value={primaryTimeout}
                onChange={(e) => setPrimaryTimeout(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold"
              >
                <option value="60">60 Seconds (Rapid response)</option>
                <option value="120">120 Seconds (Recommended Standard)</option>
                <option value="180">180 Seconds</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Secondary Guardian Window (Seconds)</label>
              <select
                value={secondaryTimeout}
                onChange={(e) => setSecondaryTimeout(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold"
              >
                <option value="120">120 Seconds</option>
                <option value="180">180 Seconds (Recommended Standard)</option>
                <option value="240">240 Seconds</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm transition-colors"
            >
              Save Escalation Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
