import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  PhoneCall,
  ArrowRight,
  Shield,
  HeartHandshake,
  Activity,
  MapPin,
  ChevronRight,
  Radio,
  Plus,
  HelpCircle,
  Loader2,
  AlertOctagon,
  X,
  FileCheck,
  UserCheck,
  Building,
  Heart,
  Siren,
  KeyRound,
  Check,
  User,
} from 'lucide-react';
import {
  User as UserType,
  EmergencyContact,
  Incident,
  NotificationItem,
  CommunityAssistanceRequest,
  CommunityHelpCategory,
} from '../types/api';
import { apiService } from '../services/api';

interface DashboardViewProps {
  currentUser: UserType;
  contacts: EmergencyContact[];
  incidents: Incident[];
  communityRequests: CommunityAssistanceRequest[];
  notifications: NotificationItem[];
  onNavigateTab: (tab: string) => void;
  onSelectIncident: (incident: Incident) => void;
  onSOSCreated: (incident: Incident) => void;
  onCommunityRequestCreated: () => void;
  onRefreshData?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  contacts,
  incidents,
  communityRequests,
  notifications,
  onNavigateTab,
  onSelectIncident,
  onSOSCreated,
  onCommunityRequestCreated,
  onRefreshData,
}) => {
  // One-Tap SOS State
  const [isActivatingSOS, setIsActivatingSOS] = useState(false);
  const [sosSuccessBanner, setSosSuccessBanner] = useState<string | null>(null);
  const [sosErrorBanner, setSosErrorBanner] = useState<string | null>(null);
  const [activeSOSIncident, setActiveSOSIncident] = useState<Incident | null>(null);
  const [showAddDetailsModal, setShowAddDetailsModal] = useState(false);
  const [postDetailsMessage, setPostDetailsMessage] = useState('');

  // Community Assistance Request Modal State
  const [showCommunityHelpModal, setShowCommunityHelpModal] = useState(false);
  const [communityCategory, setCommunityCategory] = useState<CommunityHelpCategory>('WELLNESS_CHECK');
  const [communityDesc, setCommunityDesc] = useState('');
  const [submittingCommunityHelp, setSubmittingCommunityHelp] = useState(false);

  // Volunteer / Responder Action State
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isVolunteerAvailable, setIsVolunteerAvailable] = useState(true);

  // Escalation Countdown Simulation for Guardian View (120s timer)
  const [escalationSeconds, setEscalationSeconds] = useState(84);

  useEffect(() => {
    const timer = setInterval(() => {
      setEscalationSeconds((prev) => (prev > 0 ? prev - 1 : 120));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const primaryGuardian = contacts.find((c) => c.priority_tier === 'PRIMARY');
  const secondaryGuardian = contacts.find((c) => c.priority_tier === 'SECONDARY');
  const activeIncidents = incidents.filter((i) => i.status === 'OPEN' || i.status === 'ACTIVE_RESPONSE');
  const openCommunityRequests = communityRequests.filter((r) => r.status === 'OPEN' || r.status === 'ACCEPTED');

  // Contact readiness score
  const hasPrimary = !!primaryGuardian;
  const hasSecondary = !!secondaryGuardian;
  const primaryVerified = primaryGuardian?.is_verified ?? false;
  const secondaryVerified = secondaryGuardian?.is_verified ?? false;
  const readinessPercent =
    (hasPrimary ? 25 : 0) + (primaryVerified ? 25 : 0) + (hasSecondary ? 25 : 0) + (secondaryVerified ? 25 : 0);

  // --- INSTANT ONE-TAP SOS ACTION ---
  const handleInstantSOS = async () => {
    if (isActivatingSOS) return; // duplicate protection
    setIsActivatingSOS(true);
    setSosErrorBanner(null);
    setSosSuccessBanner(null);

    // Attempt non-blocking location capture
    let lat: number | null = null;
    let lng: number | null = null;
    let acc: number | null = null;

    if ('geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 2500, enableHighAccuracy: true });
        });
        lat = Number(pos.coords.latitude.toFixed(6));
        lng = Number(pos.coords.longitude.toFixed(6));
        acc = Number(pos.coords.accuracy.toFixed(1));
      } catch {
        // Location failed/denied: proceed IMMEDIATELY without blocking
      }
    }

    const res = await apiService.triggerOneTapSOS({
      category: 'GENERAL_EMERGENCY',
      latitude: lat,
      longitude: lng,
      accuracy_meters: acc,
    });

    setIsActivatingSOS(false);

    if (res.success && res.incident) {
      setActiveSOSIncident(res.incident);
      setSosSuccessBanner(`EMERGENCY ALERT CONFIRMED: Incident #${res.incident.id} registered. Notification broadcast sent to Guardians and Security.`);
      onSOSCreated(res.incident);
    } else {
      setSosErrorBanner(res.error || 'Emergency alert could not reach backend. Please tap RETRY or call Security directly.');
    }
  };

  // Submit Community Help (Non-Emergency)
  const handleCommunityHelpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCommunityHelp(true);
    await apiService.createCommunityRequest(communityCategory, communityDesc);
    setSubmittingCommunityHelp(false);
    setShowCommunityHelpModal(false);
    setCommunityDesc('');
    onCommunityRequestCreated();
  };

  const handleSavePostDetails = async () => {
    if (activeSOSIncident && postDetailsMessage.trim()) {
      await apiService.addIncidentDetails(activeSOSIncident.id, postDetailsMessage.trim());
      setShowAddDetailsModal(false);
      setPostDetailsMessage('');
      if (onRefreshData) onRefreshData();
    }
  };

  // Volunteer accept community request with concurrency protection
  const handleAcceptCommunityHelp = async (requestId: number) => {
    setActionError(null);
    setActionMessage(null);
    const res = await apiService.acceptCommunityRequest(requestId);
    if (res.success) {
      setActionMessage('You have accepted this community request. The resident has been notified of your assistance.');
      if (onRefreshData) onRefreshData();
      onCommunityRequestCreated();
    } else {
      setActionError(res.error || 'Could not accept request.');
    }
  };

  // Guardian or Security acknowledge incident
  const handleAcknowledgeIncident = async (incidentId: number) => {
    setActionError(null);
    setActionMessage(null);
    const res = await apiService.acknowledgeIncident(incidentId);
    if (res.success) {
      setActionMessage(`Incident #${incidentId} acknowledged. You are now designated as active responder.`);
      if (onRefreshData) onRefreshData();
    } else {
      setActionError(res.error || 'Incident was already acknowledged by another responder.');
    }
  };

  const communityCategoriesList: Array<{ id: CommunityHelpCategory; label: string; desc: string }> = [
    { id: 'WELLNESS_CHECK', label: 'Check On Me / Wellness Check', desc: 'Need a friendly neighbor to check in' },
    { id: 'MINOR_FALL', label: 'Assistance After Minor Fall', desc: 'Slipped safely, need a hand standing up' },
    { id: 'SECURITY_DESK', label: 'Help Reaching Security Desk', desc: 'Package, gate assistance, or inquiry' },
    { id: 'FIRST_AID', label: 'Nearby First-Aid / Bandage Support', desc: 'Minor cut, burn, or basic dressing' },
    { id: 'MOBILITY_SUPPORT', label: 'Mobility & Stairwell Assistance', desc: 'Elevator power cut or heavy bag assistance' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Temporary Action Alerts / Success Banners */}
      {actionMessage && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-4 text-emerald-950 flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-bold text-xs text-emerald-900">{actionMessage}</p>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="bg-amber-50 border-2 border-amber-500 rounded-2xl p-4 text-amber-950 flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="font-bold text-xs text-amber-900">{actionError}</p>
          </div>
          <button onClick={() => setActionError(null)} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {sosSuccessBanner && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-4 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm text-emerald-900">{sosSuccessBanner}</p>
              <p className="text-xs text-emerald-700">Immediate response window running &bull; T1 Primary Guardian notified.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setShowAddDetailsModal(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              + Add Situation Note
            </button>
            <button
              onClick={() => setSosSuccessBanner(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {sosErrorBanner && (
        <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 text-red-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <p className="font-bold text-sm text-red-900">{sosErrorBanner}</p>
              <p className="text-xs text-red-700">Call Security immediately at +91 98765 43210 if connection is down.</p>
            </div>
          </div>
          <button
            onClick={handleInstantSOS}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <span>RETRY SOS NOW</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Urgent Active Incident Alert Banner across all roles */}
      {activeIncidents.length > 0 && !sosSuccessBanner && (
        <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-5 shadow-sm animate-pulse">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded">
                    Active Emergency Alert
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    Incident #{activeIncidents[0].id} &bull; {activeIncidents[0].category_display}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Resident: <strong>{activeIncidents[0].resident_name}</strong> &bull; {activeIncidents[0].flat_display}
                  {activeIncidents[0].responder_name && (
                    <span className="text-emerald-700 font-semibold ml-2">
                      &bull; Assigned Responder: {activeIncidents[0].responder_name}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {currentUser.primary_role !== 'RESIDENT' && !activeIncidents[0].assigned_responder_id && (
                <button
                  onClick={() => handleAcknowledgeIncident(activeIncidents[0].id)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Accept &amp; Respond
                </button>
              )}
              <button
                onClick={() => onSelectIncident(activeIncidents[0])}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <span>Incident Command</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ROLE-SPECIFIC MAIN DASHBOARD SECTIONS */}

      {/* ========================================================= */}
      {/* A. RESIDENT DASHBOARD: ONE-TAP SOS & COMMUNITY HELP */}
      {/* ========================================================= */}
      {currentUser.primary_role === 'RESIDENT' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ONE-TAP INSTANT SOS CARD */}
            <div className="lg:col-span-1 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full text-white">
                    One-Tap Emergency
                  </span>
                  <Radio className="w-5 h-5 text-white animate-pulse" />
                </div>
                <h2 className="text-2xl font-black tracking-tight leading-tight">
                  INSTANT SOS
                </h2>
                <p className="text-xs text-white/90 mt-1 leading-relaxed">
                  <strong>Press once.</strong> No forms or delays. Dispatches immediately to your Guardians &amp; Security Desk.
                </p>
              </div>

              {/* LARGE RED SOS BUTTON */}
              <div className="my-6 flex justify-center relative z-10">
                <button
                  type="button"
                  onClick={handleInstantSOS}
                  disabled={isActivatingSOS}
                  className="w-40 h-40 rounded-full bg-white hover:bg-red-50 active:scale-95 text-red-600 font-black text-3xl tracking-wider shadow-[0_0_40px_rgba(255,255,255,0.4)] flex flex-col items-center justify-center gap-1.5 transition-all transform cursor-pointer border-4 border-red-200 disabled:opacity-60"
                >
                  {isActivatingSOS ? (
                    <>
                      <Loader2 className="w-10 h-10 animate-spin text-red-600" />
                      <span className="text-xs font-bold uppercase tracking-normal">Sending...</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-12 h-12 text-red-600 animate-bounce" />
                      <span>SOS</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center relative z-10 text-[11px] text-white/90 font-medium">
                <span>Instant Dispatch &bull; Auto GPS Capture</span>
              </div>
            </div>

            {/* COMMUNITY HELP & READINESS OVERVIEW */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-5">
              {/* Separate Request Community Help Card */}
              <div className="p-4 rounded-2xl border-2 border-blue-200 bg-blue-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Need Non-Emergency Assistance?</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Request neighbor volunteer help for wellness checks, minor slips, or mobility without triggering a critical red SOS.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCommunityHelpModal(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>Request Community Help</span>
                </button>
              </div>

              {/* Readiness & Guardians Status */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Emergency Guardian Readiness</h4>
                    <p className="text-xs text-slate-500">
                      Caregivers alerted during your SOS activation ({currentUser.flat_number || 'Palm Meadows'})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 font-mono">{readinessPercent}%</span>
                    <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          readinessPercent === 100 ? 'bg-emerald-500' : readinessPercent >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${readinessPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Guardian Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Primary Guardian Widget */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Tier 1 &bull; Primary Guardian</span>
                      {primaryGuardian?.is_verified ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          {primaryGuardian ? 'Unverified' : 'Not Set'}
                        </span>
                      )}
                    </div>
                    {primaryGuardian ? (
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{primaryGuardian.name}</p>
                        <p className="text-[11px] text-slate-600 font-mono">{primaryGuardian.phone_number}</p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No primary guardian configured.</p>
                    )}
                  </div>

                  {/* Secondary Guardian Widget */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Tier 2 &bull; Secondary Guardian</span>
                      {secondaryGuardian?.is_verified ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          {secondaryGuardian ? 'Unverified' : 'Not Set'}
                        </span>
                      )}
                    </div>
                    {secondaryGuardian ? (
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{secondaryGuardian.name}</p>
                        <p className="text-[11px] text-slate-600 font-mono">{secondaryGuardian.phone_number}</p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No secondary guardian configured.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Total Emergency Contacts: <strong>{contacts.length}</strong>
                </span>
                <button
                  onClick={() => onNavigateTab('contacts')}
                  className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1"
                >
                  <span>Manage Caregiver Contacts</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* B. GUARDIAN DASHBOARD: WARD STATUS & ESCALATION CONTROL */}
      {/* ========================================================= */}
      {currentUser.primary_role === 'GUARDIAN' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  Primary Guardian Command View
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Ward Care Monitor &bull; Anita Rao</h3>
                <p className="text-xs text-slate-500">
                  Unit: Tower 1 - Flat 402 &bull; Palm Meadows Estates
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="tel:+919811223344"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Ward (+91 98112 23344)</span>
                </a>
              </div>
            </div>

            {/* Ward Emergency Status */}
            {activeIncidents.length > 0 ? (
              <div className="p-4 rounded-xl border-2 border-red-500 bg-red-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                    <span className="font-bold text-red-900 text-sm">
                      EMERGENCY ALERT ACTIVE: Incident #{activeIncidents[0].id}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                    T1 Escalation: {escalationSeconds}s left
                  </span>
                </div>
                <p className="text-xs text-slate-700">
                  Category: <strong>{activeIncidents[0].category_display}</strong> &bull; Location: {activeIncidents[0].flat_display}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => handleAcknowledgeIncident(activeIncidents[0].id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    I Acknowledge &amp; Am Responding Now
                  </button>
                  <a
                    href="tel:+919876543210"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Call Gate Security (+91 98765 43210)</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-bold text-emerald-950 text-xs">Ward Status: Safe &bull; No Active Alarms</p>
                    <p className="text-[11px] text-emerald-700">Immediate SMS and push will trigger if Anita Rao activates SOS.</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full uppercase">
                  Normal
                </span>
              </div>
            )}

            {/* Ward Critical Medical Information */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-red-600" />
                <span>Authorized Medical Information (Caregiver Access)</span>
              </h4>
              <p className="text-xs text-slate-700">
                <strong>Blood Group:</strong> O+ &bull; <strong>Senior Citizen:</strong> Yes &bull; <strong>Current Notes:</strong> Cardiac stent placed in 2024. Needs wheelchair/elevator support in power outage.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* C. SECURITY STAFF DASHBOARD: GATE 1 CONTROL ROOM */}
      {/* ========================================================= */}
      {currentUser.primary_role === 'SECURITY_STAFF' && (
        <div className="space-y-5">
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                  Gate 1 Security Control Desk
                </span>
                <h3 className="text-lg font-bold text-white mt-1">Society Incident Command &amp; Patrol Board</h3>
                <p className="text-xs text-slate-400">
                  Officer on Duty: <strong>Vikram Singh</strong> (SEC-BLR-042) &bull; Radio: Channel 4
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>Radio Active (Ch 4)</span>
                </span>
              </div>
            </div>

            {/* Live Incidents Queue for Security */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Active Society Emergency Alarms ({activeIncidents.length})
              </h4>
              {activeIncidents.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-400 text-xs">
                  All security sectors quiet. No active resident emergencies.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeIncidents.map((inc) => (
                    <div
                      key={inc.id}
                      className="p-4 rounded-xl bg-red-950/60 border border-red-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-red-200 text-sm">
                            Incident #{inc.id} &bull; {inc.category_display}
                          </span>
                          <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded">
                            {inc.status_display}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          Resident: <strong>{inc.resident_name}</strong> &bull; {inc.flat_display} &bull; Phone: {inc.resident_phone}
                        </p>
                        {inc.responder_name && (
                          <p className="text-xs text-emerald-400 mt-0.5">
                            Responder: {inc.responder_name} ({inc.responder_role})
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAcknowledgeIncident(inc.id)}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm"
                        >
                          Dispatch Gate Guard
                        </button>
                        <button
                          onClick={() => onSelectIncident(inc)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Gate Clearance Code Generator */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-white">Emergency Gate Clearance Pass: #8841</p>
                <p className="text-slate-400 text-[11px]">
                  Ambulance and Fire Rescue fast-track barrier override for Gate 1.
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs">
                Barrier Ready
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* D. VOLUNTEER DASHBOARD: NEARBY REQUESTS & FIRST AID */}
      {/* ========================================================= */}
      {currentUser.primary_role === 'VOLUNTEER' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Community First Responder Network
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Dr. Arvind Swaminathan (Cardiologist &bull; Flat 101)
                </h3>
                <p className="text-xs text-slate-500">
                  Certified BLS &bull; CPR Trained &bull; Ground Floor Rapid Access
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsVolunteerAvailable(!isVolunteerAvailable)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                    isVolunteerAvailable
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {isVolunteerAvailable ? 'Status: Available for Calls' : 'Status: Off Duty'}
                </button>
              </div>
            </div>

            {/* Volunteer Community Requests List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-blue-600" />
                  <span>Neighbor Community Requests ({openCommunityRequests.length})</span>
                </h4>
                <span className="text-[11px] text-slate-400">First responder queue</span>
              </div>

              {openCommunityRequests.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-xs text-center">
                  No pending community assistance requests right now.
                </div>
              ) : (
                <div className="space-y-2">
                  {openCommunityRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{req.category_display}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              req.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {req.status_display}
                          </span>
                        </div>
                        <p className="text-slate-700 mt-1">{req.description || 'Assistance requested.'}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Resident: <strong>{req.resident_name}</strong> ({req.flat_display}) &bull; Phone: {req.resident_phone}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {req.status === 'OPEN' ? (
                          <button
                            onClick={() => handleAcceptCommunityHelp(req.id)}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm"
                          >
                            Accept &amp; En Route
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                            Accepted by: {req.volunteer_name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* E. SOCIETY ADMIN DASHBOARD: PLATFORM GOVERNANCE */}
      {/* ========================================================= */}
      {currentUser.primary_role === 'SOCIETY_ADMIN' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                  Society Management Office
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Palm Meadows Estates &bull; Safety Governance &amp; Audits
                </h3>
                <p className="text-xs text-slate-500">
                  Total Units: 142 &bull; Active Coverage: 98% Verified
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('admin')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Open Administrator Console
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xl font-black text-slate-900">142</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Residents</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xl font-black text-emerald-600">98%</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Guardian Ready</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xl font-black text-blue-600">4</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">On-Duty Security</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xl font-black text-purple-600">3</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Medical Volunteers</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Active Community Help Requests List (shown for all when open) */}
      {currentUser.primary_role === 'RESIDENT' && openCommunityRequests.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-blue-600" />
              <span>Active Community Assistance Requests ({openCommunityRequests.length})</span>
            </h4>
            <span className="text-xs text-blue-600 font-semibold">Community Network</span>
          </div>

          <div className="space-y-2">
            {openCommunityRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{req.category_display}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        req.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {req.status_display}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">{req.description || 'Assistance requested.'}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Resident: {req.resident_name} ({req.flat_display}) &bull; {new Date(req.created_at).toLocaleTimeString()}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  {req.volunteer_name ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      Accepted by: {req.volunteer_name}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                      Broadcast to Volunteers
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Speed Dial Emergency Directory */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400">Security Gate Control</span>
            <p className="text-base font-bold text-slate-900 mt-0.5">+91 98765 43210</p>
            <p className="text-[11px] text-slate-500">24/7 Security Desk (Radio Ch 4)</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <PhoneCall className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400">Emergency Ambulance</span>
            <p className="text-base font-bold text-red-600 mt-0.5">108 / 102</p>
            <p className="text-[11px] text-slate-500">Public Medical Helpline</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400">Police &amp; Fire Rescue</span>
            <p className="text-base font-bold text-slate-900 mt-0.5">112 / 101</p>
            <p className="text-[11px] text-slate-500">National Emergency Support</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 6. Post-SOS Add Details Modal */}
      {showAddDetailsModal && activeSOSIncident && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Add Situation Note to SOS #{activeSOSIncident.id}</h3>
              <button
                onClick={() => setShowAddDetailsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-500">
              Your SOS was already dispatched! You can add extra situation guidance (e.g. door unlocked, chest pain, floor location) for responders.
            </p>

            <textarea
              rows={3}
              value={postDetailsMessage}
              onChange={(e) => setPostDetailsMessage(e.target.value)}
              placeholder="e.g. Unlocked front door, inhaler in kitchen, severe dizziness..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddDetailsModal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSavePostDetails}
                disabled={!postDetailsMessage.trim()}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Update Responders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Community Help Request Modal */}
      {showCommunityHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Request Community Help</h3>
              </div>
              <button
                onClick={() => setShowCommunityHelpModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600">
              This broadcasts a neighbor assistance request to verified volunteers and security at{' '}
              <strong>{currentUser.society_name || 'Palm Meadows'}</strong>.
            </p>

            <form onSubmit={handleCommunityHelpSubmit} className="space-y-4">
              <div>
                <label className="font-bold text-slate-800 block mb-2">Select Assistance Type</label>
                <div className="space-y-2">
                  {communityCategoriesList.map((cat) => {
                    const isSelected = communityCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCommunityCategory(cat.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 text-slate-900 ring-1 ring-blue-600 font-semibold'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <p className="font-bold">{cat.label}</p>
                        <p className="text-[11px] text-slate-500">{cat.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Optional Details or Message</label>
                <textarea
                  rows={2}
                  value={communityDesc}
                  onChange={(e) => setCommunityDesc(e.target.value)}
                  placeholder="e.g. Slipped in hallway, need assistance standing up..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCommunityHelpModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCommunityHelp}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {submittingCommunityHelp ? 'Broadcasting...' : 'Broadcast to Volunteers'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
