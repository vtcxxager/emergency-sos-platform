import React, { useState } from 'react';
import {
  User as UserIcon,
  Building,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Save,
  Phone,
  Mail,
  Home,
} from 'lucide-react';
import { User } from '../types/api';

interface ProfileViewProps {
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, onUpdateUser }) => {
  const [medicalNotes, setMedicalNotes] = useState(
    currentUser.resident_profile?.critical_medical_notes ||
      'Cardiac history: Stent placed in 2024. Needs wheelchair/elevator support in power outage.'
  );
  const [bloodGroup, setBloodGroup] = useState(currentUser.resident_profile?.blood_group || 'O+');
  const [isSeniorCitizen, setIsSeniorCitizen] = useState(currentUser.resident_profile?.is_senior_citizen ?? true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: User = {
      ...currentUser,
      resident_profile: currentUser.resident_profile
        ? {
            ...currentUser.resident_profile,
            critical_medical_notes: medicalNotes,
            blood_group: bloodGroup,
            is_senior_citizen: isSeniorCitizen,
          }
        : undefined,
    };
    onUpdateUser(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white font-bold text-xl flex items-center justify-center shadow-md">
              {currentUser.first_name?.[0]}
              {currentUser.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {currentUser.first_name} {currentUser.last_name}
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  {currentUser.primary_role.replace('_', ' ')}
                </span>
                <span>&bull;</span>
                <span className="font-mono text-slate-600">{currentUser.phone_number}</span>
              </p>
            </div>
          </div>

          <div className="text-right sm:self-center self-start">
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Verified Resident
            </span>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile and emergency vitals updated successfully.</span>
        </div>
      )}

      {/* Account Identity & Residency Unit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Home className="w-4 h-4 text-slate-500" />
            Residential Unit &amp; Society
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Society:</span>
              <span className="font-semibold text-slate-900">{currentUser.society_name || 'Palm Meadows Estates'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Flat / Unit:</span>
              <span className="font-semibold text-slate-900">{currentUser.flat_number || 'Tower 1 - Flat 402'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Occupancy Type:</span>
              <span className="font-semibold text-slate-900">Owner-Occupied</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Registration Code:</span>
              <span className="font-mono text-slate-600">SOC-BLR-001</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            Contact &amp; Verification
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Phone:</span>
              <span className="font-mono font-semibold text-slate-900">{currentUser.phone_number}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Email:</span>
              <span className="font-semibold text-slate-900">{currentUser.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">SMS Alerts:</span>
              <span className="text-emerald-700 font-bold">Active (Verified)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Society Admin Approval:</span>
              <span className="text-emerald-700 font-bold">Approved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Medical Vitals Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-600" />
            Emergency Medical Vitals (For First Responders)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            This confidential medical information is only disclosed to your assigned caregivers and responding medical personnel during an active SOS emergency.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="A+">A Positive (A+)</option>
                <option value="A-">A Negative (A-)</option>
                <option value="B+">B Positive (B+)</option>
                <option value="B-">B Negative (B-)</option>
                <option value="AB+">AB Positive (AB+)</option>
                <option value="AB-">AB Negative (AB-)</option>
                <option value="O+">O Positive (O+)</option>
                <option value="O-">O Negative (O-)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSeniorCitizen}
                  onChange={(e) => setIsSeniorCitizen(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                />
                <span>Senior Citizen Resident (Age 65+)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Critical Medical Conditions, Allergies &amp; Mobility Constraints
            </label>
            <textarea
              rows={4}
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              placeholder="e.g. Pacemaker, diabetic, penicillin allergy, uses walker, emergency key with neighbor in Flat 401..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Provides paramedics and volunteers vital guidance on stairwell evacuations and medication contraindications.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Update Medical Vitals</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
