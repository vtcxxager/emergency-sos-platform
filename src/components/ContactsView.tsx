import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Phone,
  Mail,
  Clock,
  KeyRound,
  X,
} from 'lucide-react';
import { EmergencyContact, PriorityTier, User } from '../types/api';
import { apiService } from '../services/api';

interface ContactsViewProps {
  currentUser: User;
  contacts: EmergencyContact[];
  onContactsUpdated: () => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  currentUser,
  contacts,
  onContactsUpdated,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState<EmergencyContact | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // New Contact form
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [priorityTier, setPriorityTier] = useState<PriorityTier>('PRIMARY');

  // Verification code input
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    await apiService.addEmergencyContact({
      name: name.trim(),
      relationship: relationship.trim() || 'Family Member',
      phone_number: phone.trim(),
      email: email.trim(),
      priority_tier: priorityTier,
    });

    setName('');
    setRelationship('');
    setPhone('');
    setEmail('');
    setShowAddModal(false);
    onContactsUpdated();
  };

  const handleDelete = async (id: number) => {
    await apiService.deleteEmergencyContact(id);
    setDeleteConfirmId(null);
    onContactsUpdated();
  };

  const handleRequestVerificationCode = async (contact: EmergencyContact) => {
    setShowVerifyModal(contact);
    setVerificationCode('');
    setVerifyError(null);
    const res = await apiService.requestContactCode(contact.id);
    setVerifyMessage(res.message);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showVerifyModal) return;

    const res = await apiService.verifyContact(showVerifyModal.id, verificationCode);
    if (res.success) {
      setShowVerifyModal(null);
      onContactsUpdated();
    } else {
      setVerifyError(res.message);
    }
  };

  const primaryContacts = contacts.filter((c) => c.priority_tier === 'PRIMARY');
  const secondaryContacts = contacts.filter((c) => c.priority_tier === 'SECONDARY');
  const tertiaryContacts = contacts.filter((c) => c.priority_tier === 'EMERGENCY');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Emergency Contacts &amp; Guardians</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configured priority caregivers alerted during residential SOS activation at{' '}
            <strong>{currentUser.society_name || 'Palm Meadows'}</strong>.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Emergency Contact</span>
        </button>
      </div>

      {/* Contact Tier Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tier 1: Primary Guardian */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
              Tier 1 &bull; Primary Guardian (Immediate T0)
            </span>
          </div>

          {primaryContacts.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No Primary Guardian Configured</p>
              <p className="text-[11px] mt-1 text-slate-400">Required for first-tier alert routing.</p>
            </div>
          ) : (
            primaryContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onVerify={() => handleRequestVerificationCode(contact)}
                onDelete={() => setDeleteConfirmId(contact.id)}
              />
            ))
          )}
        </div>

        {/* Tier 2: Secondary Guardian */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              Tier 2 &bull; Secondary Guardian (+120s Escalation)
            </span>
          </div>

          {secondaryContacts.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              <Users className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No Secondary Guardian</p>
              <p className="text-[11px] mt-1 text-slate-400">Escalates here if Primary does not answer.</p>
            </div>
          ) : (
            secondaryContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onVerify={() => handleRequestVerificationCode(contact)}
                onDelete={() => setDeleteConfirmId(contact.id)}
              />
            ))
          )}
        </div>

        {/* Tier 3: Emergency Contacts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
              Tier 3 &bull; Backup Emergency Contacts
            </span>
          </div>

          {tertiaryContacts.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              <Users className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No Backup Contacts</p>
              <p className="text-[11px] mt-1 text-slate-400">Additional family or neighboring friends.</p>
            </div>
          ) : (
            tertiaryContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onVerify={() => handleRequestVerificationCode(contact)}
                onDelete={() => setDeleteConfirmId(contact.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Add Emergency Contact</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Rao"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Relationship</label>
                <input
                  type="text"
                  required
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="e.g. Son, Daughter, Neighbor"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Phone Number (E.164 with country code)</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. contact@email.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Priority Escalation Tier</label>
                <select
                  value={priorityTier}
                  onChange={(e) => setPriorityTier(e.target.value as PriorityTier)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="PRIMARY">Primary Guardian (Tier 1 - Instant Notification)</option>
                  <option value="SECONDARY">Secondary Guardian (Tier 2 - Escalated if T1 unacknowledged)</option>
                  <option value="EMERGENCY">Emergency Contact (Tier 3 - General Backup)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Code Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Verify Emergency Contact</h3>
              <button
                onClick={() => setShowVerifyModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600">
              A 6-digit confirmation code was dispatched to <strong>{showVerifyModal.phone_number}</strong>.
            </p>

            {verifyMessage && (
              <p className="p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl font-medium">
                {verifyMessage}
              </p>
            )}

            {verifyError && (
              <p className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl font-medium">
                {verifyError}
              </p>
            )}

            <form onSubmit={handleVerifySubmit} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Enter 6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center text-lg font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Confirm Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center">
            <h3 className="font-bold text-slate-900 text-base">Remove Contact</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove this emergency contact? They will no longer receive emergency alerts.
            </p>
            <div className="flex gap-2 pt-2 text-xs">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ContactCardProps {
  contact: EmergencyContact;
  onVerify: () => void;
  onDelete: () => void;
}

const ContactCard: React.FC<ContactCardProps> = ({ contact, onVerify, onDelete }) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">{contact.name}</h4>
          <p className="text-xs text-slate-500">{contact.relationship}</p>
        </div>

        <button
          onClick={onDelete}
          className="text-slate-400 hover:text-red-600 transition-colors p-1"
          title="Delete Contact"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1 text-xs text-slate-700 font-mono">
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>{contact.phone_number}</span>
        </div>
        {contact.email && (
          <div className="flex items-center gap-2 text-slate-500">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-sans truncate">{contact.email}</span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        {contact.is_verified ? (
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Verified Caregiver
          </span>
        ) : (
          <button
            onClick={onVerify}
            className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors"
          >
            <KeyRound className="w-3 h-3" />
            Verify with OTP Code
          </button>
        )}

        <span className="text-[10px] text-slate-400 font-mono">
          Added {new Date(contact.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};
