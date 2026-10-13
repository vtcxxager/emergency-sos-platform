import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  MapPin,
  AlertOctagon,
  Clock,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  Radio,
  RefreshCw,
  Send,
  MessageSquare,
  FileCheck,
} from 'lucide-react';
import { EmergencyCategory, SOSPayload, Incident, User } from '../types/api';
import { apiService } from '../services/api';

interface SOSEmergencyViewProps {
  currentUser: User;
  onSOSCreated: (newIncident: Incident) => void;
  activeIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
}

export const SOSEmergencyView: React.FC<SOSEmergencyViewProps> = ({
  currentUser,
  onSOSCreated,
  activeIncident,
  onSelectIncident,
}) => {
  const [category, setCategory] = useState<EmergencyCategory>('MEDICAL');
  const [message, setMessage] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('Not requested');
  const [locationLoading, setLocationLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const categories: Array<{ id: EmergencyCategory; label: string; desc: string; icon: string }> = [
    { id: 'MEDICAL', label: 'Medical Emergency', desc: 'Heart attack, stroke, acute breathlessness, seizure', icon: '🚑' },
    { id: 'FALL_ACCIDENT', label: 'Fall or Accident', desc: 'Elderly slip, physical injury, immobility', icon: '⚠️' },
    { id: 'PERSONAL_SAFETY', label: 'Personal Safety', desc: 'Immediate physical threat, harassment, elevator trap', icon: '🛡️' },
    { id: 'FIRE_HAZARD', label: 'Fire or Gas Hazard', desc: 'Smoke detected, LPG cylinder leak, electrical spark', icon: '🔥' },
    { id: 'SECURITY_CONCERN', label: 'Security Concern', desc: 'Intrusion, unauthorized access, suspicious behavior', icon: '🚨' },
    { id: 'GENERAL_ASSISTANCE', label: 'General Assistance', desc: 'Urgent mobility or vital caregiver assistance', icon: '🤝' },
  ];

  // Request actual device location via Browser Geolocation API
  const handleAcquireLocation = () => {
    setLocationLoading(true);
    setLocationStatus('Acquiring real device location...');

    if (!('geolocation' in navigator)) {
      setLocationStatus('Geolocation is not supported by your browser.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Number(pos.coords.accuracy.toFixed(1)),
        });
        setLocationStatus(`Acquired (±${Math.round(pos.coords.accuracy)}m accuracy)`);
        setLocationLoading(false);
      },
      (err) => {
        setLocationStatus(`Location error: ${err.message}. Proceeding without GPS.`);
        setLocationLoading(false);
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    // Attempt location acquisition on mount
    handleAcquireLocation();
  }, []);

  const handleConfirmAndTrigger = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    setShowConfirmModal(false);

    const payload: SOSPayload = {
      category,
      message: message.trim(),
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      accuracy_meters: coords?.accuracy ?? null,
    };

    const res = await apiService.triggerSOS(payload);
    setSubmitting(false);

    if (res.success && res.incident) {
      onSOSCreated(res.incident);
    } else {
      setErrorMessage(res.error || 'Failed to trigger emergency alert. Please check connection and retry.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <h2 className="text-xl font-bold text-slate-900">Emergency SOS Activation</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Triggering an alert notifies your primary guardian, secondary guardian, gate security, and on-duty responders at{' '}
              <strong>{currentUser.society_name || 'Palm Meadows'}</strong>.
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0">
            Unit: {currentUser.flat_number || 'Flat 402'}
          </div>
        </div>
      </div>

      {/* Active Incident Card (if already active) */}
      {activeIncident && (activeIncident.status === 'OPEN' || activeIncident.status === 'ACTIVE_RESPONSE') && (
        <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-600 animate-pulse" />
              <span className="font-bold text-red-900 text-sm">
                Active Alert #{activeIncident.id} ({activeIncident.category_display})
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider bg-red-600 text-white px-2.5 py-1 rounded-full">
              {activeIncident.status_display}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-red-200 text-xs text-slate-700 space-y-2">
            <p>
              <strong>Message:</strong> {activeIncident.message || 'No additional note provided.'}
            </p>
            <p className="text-slate-500">
              <strong>Escalation Stage:</strong> {activeIncident.stage_display}
            </p>
            {activeIncident.responder_name ? (
              <p className="text-emerald-700 font-semibold">
                <strong>Assigned Responder:</strong> {activeIncident.responder_name} ({activeIncident.responder_role})
              </p>
            ) : (
              <p className="text-amber-700 font-medium">Awaiting first responder acknowledgment...</p>
            )}
          </div>

          <button
            onClick={() => onSelectIncident(activeIncident)}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Open Incident Command &amp; Live Chat
          </button>
        </div>
      )}

      {/* SOS Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 text-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Alert Submission Error</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* 1. Category Selector */}
        <div>
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-3">
            1. Select Emergency Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`text-left p-4 rounded-xl border text-xs transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'border-red-600 bg-red-50/70 text-slate-900 shadow-sm ring-1 ring-red-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  <span className="text-2xl shrink-0">{cat.icon}</span>
                  <div>
                    <p className={`font-bold ${isSelected ? 'text-red-950' : 'text-slate-900'}`}>{cat.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{cat.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Optional Situation Note */}
        <div>
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-2">
            2. Situation Note or Floor/Door Details (Optional)
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Severe chest pain, front door unlocked, inhaler in kitchen"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
          />
        </div>

        {/* 3. Location & GPS Status */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700">
            <MapPin className="w-4 h-4 text-red-600 shrink-0" />
            <div>
              <p className="font-semibold text-slate-900">GPS Location Status:</p>
              <p className="text-slate-500 text-[11px]">
                {coords ? `${coords.latitude}° N, ${coords.longitude}° E (${locationStatus})` : locationStatus}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAcquireLocation}
            disabled={locationLoading}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition-colors shrink-0"
          >
            {locationLoading ? 'Acquiring...' : 'Refresh Location'}
          </button>
        </div>

        {/* 4. Activation Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={submitting}
            className="w-full py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white font-black text-lg uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-3 transition-transform cursor-pointer"
          >
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <span>{submitting ? 'Triggering Emergency Alert...' : 'Activate Emergency SOS'}</span>
          </button>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Dispatches immediately &bull; Acknowledgment response window starts at 120 seconds
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-7 h-7" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Confirm SOS Emergency Alert</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to broadcast an emergency alert for{' '}
                <strong>{categories.find((c) => c.id === category)?.label}</strong>?
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <p>
                <strong>Location:</strong> {currentUser.flat_number || 'Palm Meadows'}
              </p>
              {coords && (
                <p>
                  <strong>GPS:</strong> {coords.latitude}, {coords.longitude}
                </p>
              )}
              {message && (
                <p>
                  <strong>Note:</strong> {message}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAndTrigger}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md"
              >
                Yes, Send Alert Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
