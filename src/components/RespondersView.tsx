import React, { useState } from 'react';
import {
  HeartHandshake,
  Shield,
  CheckCircle2,
  Phone,
  Radio,
  Building,
  UserCheck,
  Activity,
  Heart,
} from 'lucide-react';
import { User } from '../types/api';

interface RespondersViewProps {
  currentUser: User;
}

export const RespondersView: React.FC<RespondersViewProps> = ({ currentUser }) => {
  const [isVolunteerAvailable, setIsVolunteerAvailable] = useState(true);
  const [isOnDuty, setIsOnDuty] = useState(true);

  // Sample verified community network for Palm Meadows
  const securityPersonnel = [
    {
      id: 1,
      name: 'Vikram Singh',
      role: 'Head Security Guard',
      employeeId: 'SEC-BLR-042',
      gate: 'Gate 1 (Main Entrance)',
      shift: 'Day Shift (06:00 - 18:00)',
      radio: 'Channel 4',
      phone: '+91 98220 33445',
      isOnDuty: true,
    },
    {
      id: 2,
      name: 'Santosh Kumar',
      role: 'Security Patrol Guard',
      employeeId: 'SEC-BLR-045',
      gate: 'Tower 1 & 2 Perimeter',
      shift: 'Day Shift (06:00 - 18:00)',
      radio: 'Channel 4',
      phone: '+91 98220 33448',
      isOnDuty: true,
    },
    {
      id: 3,
      name: 'Mohan Lal',
      role: 'Night Shift Guard',
      employeeId: 'SEC-BLR-050',
      gate: 'Gate 2 (Back Gate)',
      shift: 'Night Shift (18:00 - 06:00)',
      radio: 'Channel 4',
      phone: '+91 98220 33452',
      isOnDuty: false,
    },
  ];

  const certifiedVolunteers = [
    {
      id: 101,
      name: 'Dr. Arvind Swaminathan',
      qualifications: 'Cardiologist & Emergency BLS Certified',
      flat: 'Tower 1 - Flat 101 (Ground Floor)',
      phone: '+91 98450 11223',
      cprCertified: true,
      firstAid: true,
      isAvailable: true,
      incidentsAssisted: 7,
    },
    {
      id: 102,
      name: 'Priya Narang',
      qualifications: 'Certified Red Cross First Aid Instructor',
      flat: 'Tower 2 - Flat 304',
      phone: '+91 98450 44556',
      cprCertified: true,
      firstAid: true,
      isAvailable: true,
      incidentsAssisted: 3,
    },
    {
      id: 103,
      name: 'Col. Ranjit Varma (Retd.)',
      qualifications: 'Disaster Management & Trauma Responder',
      flat: 'Tower 3 - Flat 201',
      phone: '+91 98450 77889',
      cprCertified: true,
      firstAid: true,
      isAvailable: false,
      incidentsAssisted: 11,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Community Responders &amp; Security Desk</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified network of on-site security guards and neighbor first responders for{' '}
            <strong>{currentUser.society_name || 'Palm Meadows Estates'}</strong>.
          </p>
        </div>

        {/* Volunteer/Staff Duty Toggle if user is volunteer/staff */}
        {(currentUser.primary_role === 'VOLUNTEER' || currentUser.primary_role === 'SECURITY_STAFF') && (
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center gap-3 self-start">
            <span className="text-xs font-bold text-slate-700">Emergency Response Duty:</span>
            <button
              onClick={() => {
                if (currentUser.primary_role === 'VOLUNTEER') setIsVolunteerAvailable(!isVolunteerAvailable);
                else setIsOnDuty(!isOnDuty);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                (currentUser.primary_role === 'VOLUNTEER' ? isVolunteerAvailable : isOnDuty)
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {(currentUser.primary_role === 'VOLUNTEER' ? isVolunteerAvailable : isOnDuty)
                ? 'ON DUTY (AVAILABLE)'
                : 'OFF DUTY'}
            </button>
          </div>
        )}
      </div>

      {/* Grid: On-duty Security Guards & Certified Volunteers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Personnel Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                Society Security Personnel (24/7)
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
              Radio Channel 4
            </span>
          </div>

          <div className="space-y-3">
            {securityPersonnel.map((guard) => (
              <div
                key={guard.id}
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  guard.isOnDuty ? 'border-slate-200 bg-slate-50/50' : 'border-slate-100 bg-slate-50/20 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{guard.name}</h4>
                    <p className="text-slate-500 font-medium">
                      {guard.role} &bull; {guard.employeeId}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      guard.isOnDuty
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {guard.isOnDuty ? 'On Duty' : 'Off Duty'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600 font-mono text-[11px]">
                  <span>Post: {guard.gate}</span>
                  <span>Shift: {guard.shift}</span>
                  <span className="text-blue-700 font-bold">{guard.phone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certified Community Volunteers Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                Verified Resident Volunteers
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Neighbor Care Network
            </span>
          </div>

          <div className="space-y-3">
            {certifiedVolunteers.map((vol) => (
              <div
                key={vol.id}
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  vol.isAvailable ? 'border-slate-200 bg-slate-50/50' : 'border-slate-100 bg-slate-50/20 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>{vol.name}</span>
                      <span title="Verified by Society">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      </span>
                    </h4>
                    <p className="text-slate-600 font-medium">{vol.qualifications}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      vol.isAvailable
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {vol.isAvailable ? 'Available' : 'Away'}
                  </span>
                </div>

                <p className="text-slate-500 text-[11px] font-mono">
                  Unit: <strong>{vol.flat}</strong> &bull; Assisted: {vol.incidentsAssisted} emergencies
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-blue-700 font-mono font-bold">{vol.phone}</span>
                  <div className="flex gap-1.5">
                    {vol.firstAid && (
                      <span className="bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-bold text-[10px]">
                        First Aid
                      </span>
                    )}
                    {vol.cprCertified && (
                      <span className="bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-bold text-[10px]">
                        CPR
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
