import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  UserCheck,
  MapPin,
  CheckCircle2,
  Send,
  MessageSquare,
  FileCheck,
  ChevronRight,
  X,
  Phone,
  Shield,
  Radio,
} from 'lucide-react';
import { Incident, User } from '../types/api';
import { apiService } from '../services/api';

interface IncidentsViewProps {
  currentUser: User;
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident | null) => void;
  onIncidentUpdated: () => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  currentUser,
  incidents,
  selectedIncident,
  onSelectIncident,
  onIncidentUpdated,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [newUpdateMessage, setNewUpdateMessage] = useState('');
  const [closureNotes, setClosureNotes] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const filteredIncidents = incidents.filter((i) => {
    if (filter === 'ACTIVE') return i.status === 'OPEN' || i.status === 'ACTIVE_RESPONSE';
    if (filter === 'RESOLVED') return i.status === 'RESOLVED';
    return true;
  });

  const handleAcknowledge = async (id: number) => {
    setActionLoading(true);
    await apiService.acknowledgeIncident(id);
    setActionLoading(false);
    onIncidentUpdated();
  };

  const handleResolve = async (id: number) => {
    if (!closureNotes.trim()) return;
    setActionLoading(true);
    await apiService.resolveIncident(id, closureNotes.trim());
    setActionLoading(false);
    setShowResolveModal(false);
    setClosureNotes('');
    onIncidentUpdated();
  };

  const handleSendMessage = async (id: number) => {
    if (!newUpdateMessage.trim()) return;
    await apiService.addIncidentUpdate(id, newUpdateMessage.trim());
    setNewUpdateMessage('');
    onIncidentUpdated();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Incident Command &amp; Response Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time emergency tracking, guardian escalation logs, and responder dispatching
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Incidents ({incidents.length})
          </button>
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'ACTIVE' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Alerts ({incidents.filter((i) => i.status === 'OPEN' || i.status === 'ACTIVE_RESPONSE').length})
          </button>
          <button
            onClick={() => setFilter('RESOLVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'RESOLVED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Resolved ({incidents.filter((i) => i.status === 'RESOLVED').length})
          </button>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 text-base">No Incidents Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are currently no incidents matching the selected filter.
            </p>
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const isActive = incident.status === 'OPEN' || incident.status === 'ACTIVE_RESPONSE';
            return (
              <div
                key={incident.id}
                onClick={() => onSelectIncident(incident)}
                className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isActive ? 'border-red-200 bg-red-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm shadow-sm ${
                      incident.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : incident.status === 'ACTIVE_RESPONSE'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-600 text-white animate-pulse'
                    }`}
                  >
                    #{incident.id}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900 text-sm">{incident.category_display}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          incident.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : incident.status === 'ACTIVE_RESPONSE'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {incident.status_display}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {incident.stage_display}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium mb-1.5">{incident.message}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        Resident: {incident.resident_name} ({incident.flat_display})
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 font-mono text-slate-600">
                        <Clock className="w-3 h-3" />
                        {new Date(incident.created_at).toLocaleString()}
                      </span>
                      {incident.latitude && (
                        <>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3 h-3 text-red-500" />
                            GPS: {incident.latitude}, {incident.longitude}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                  {incident.responder_name ? (
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Responder</span>
                      <span className="text-xs font-bold text-blue-700">{incident.responder_name}</span>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                      Pending Acceptance
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-600 text-white font-mono">
                  #{selectedIncident.id}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedIncident.category_display}</h3>
                  <p className="text-xs text-slate-500">
                    {selectedIncident.resident_name} &bull; {selectedIncident.flat_display}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onSelectIncident(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Emergency Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Situation Message:</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      selectedIncident.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedIncident.status_display}
                  </span>
                </div>
                <p className="text-slate-900 text-sm font-medium">{selectedIncident.message}</p>
                <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-4 text-slate-600 font-mono text-[11px]">
                  <span>Phone: {selectedIncident.resident_phone}</span>
                  {selectedIncident.latitude && (
                    <span>
                      GPS: {selectedIncident.latitude}, {selectedIncident.longitude}
                    </span>
                  )}
                  <span>Logged: {new Date(selectedIncident.created_at).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Responder Status / Action Box */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 text-xs">Responder Coordination</span>
                  <span className="text-[11px] font-semibold text-blue-700 font-mono">
                    Stage: {selectedIncident.stage_display}
                  </span>
                </div>

                {selectedIncident.responder_name ? (
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{selectedIncident.responder_name}</p>
                      <p className="text-slate-500">Role: {selectedIncident.responder_role}</p>
                    </div>
                    {selectedIncident.acknowledged_at && (
                      <span className="text-slate-500 text-[11px] font-mono">
                        Accepted at {new Date(selectedIncident.acknowledged_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-amber-800 text-xs">
                    No responder has formally accepted this incident yet.
                  </p>
                )}

                {/* Responder Action Buttons */}
                {selectedIncident.status !== 'RESOLVED' && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-blue-200">
                    {!selectedIncident.responder_name && (
                      <button
                        type="button"
                        onClick={() => handleAcknowledge(selectedIncident.id)}
                        disabled={actionLoading}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Accept &amp; Respond (I am heading there)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowResolveModal(true)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Mark Incident Resolved</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Closure Notes (if resolved) */}
              {selectedIncident.status === 'RESOLVED' && (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-950 space-y-1">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Formal Incident Closure Report
                  </span>
                  <p className="text-xs mt-1">{selectedIncident.closure_notes || 'Resolved safely.'}</p>
                  <p className="text-[10px] text-emerald-700 font-mono mt-1">
                    Resolved at: {selectedIncident.resolved_at ? new Date(selectedIncident.resolved_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              )}

              {/* Discussion Thread */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  Incident Updates &amp; Discussion Thread
                </h4>

                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
                  {selectedIncident.discussions.length === 0 ? (
                    <p className="text-slate-400 italic text-[11px] p-2 bg-slate-50 rounded-lg">
                      No status updates posted yet.
                    </p>
                  ) : (
                    selectedIncident.discussions.map((d) => (
                      <div key={d.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-800">{d.author_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(d.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-700">{d.message}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add update input */}
                {selectedIncident.status !== 'RESOLVED' && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newUpdateMessage}
                      onChange={(e) => setNewUpdateMessage(e.target.value)}
                      placeholder="Post a status update (e.g. Paramedic on site, vitals stable)..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendMessage(selectedIncident.id)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Incident Closure Modal */}
      {showResolveModal && selectedIncident && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Close Incident #{selectedIncident.id}</h3>
            <p className="text-xs text-slate-500">
              Please enter official closure documentation explaining the assistance rendered and final resident status.
            </p>

            <textarea
              rows={3}
              value={closureNotes}
              onChange={(e) => setClosureNotes(e.target.value)}
              placeholder="e.g. Resident assisted to bed safely, vitals normal, family member on site."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleResolve(selectedIncident.id)}
                disabled={!closureNotes.trim() || actionLoading}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold"
              >
                Submit Closure Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
