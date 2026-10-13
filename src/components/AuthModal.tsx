import React, { useState } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Building,
  KeyRound,
  Phone,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import { User, UserRole } from '../types/api';
import { apiService, PRESET_ACCOUNTS } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  onAccountSelect: (accountKey: 'resident' | 'guardian' | 'security' | 'volunteer' | 'admin') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onAccountSelect,
}) => {
  const [mode, setMode] = useState<'quick' | 'login' | 'register'>('quick');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Register form state
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('RESIDENT');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await apiService.login(username.trim(), password);
    setLoading(false);

    if (res.success) {
      onLoginSuccess(apiService.getCurrentUser());
      onClose();
    } else {
      setError(res.error || 'Login failed. Please check credentials.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await apiService.register({
      username: regUsername.trim(),
      email: regEmail.trim(),
      phone_number: regPhone.trim(),
      first_name: regFirstName.trim(),
      last_name: regLastName.trim(),
      primary_role: regRole,
      password: regPassword,
    });
    setLoading(false);

    if (res.success) {
      onLoginSuccess(apiService.getCurrentUser());
      onClose();
    } else {
      setError(res.error || 'Registration failed.');
    }
  };

  const presetList = [
    {
      key: 'resident' as const,
      name: 'Anita Rao',
      role: 'Resident (Elderly)',
      unit: 'Tower 1 - Flat 402',
      phone: '+91 98112 23344',
      badge: 'One-Tap SOS & Community Help',
      color: 'border-red-200 bg-red-50/50 hover:bg-red-50',
    },
    {
      key: 'guardian' as const,
      name: 'Rajesh Sharma',
      role: 'Primary Guardian',
      unit: 'Son of Anita Rao',
      phone: '+91 91234 56789',
      badge: 'Escalation Timer & Ward Vitals',
      color: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50',
    },
    {
      key: 'security' as const,
      name: 'Vikram Singh',
      role: 'Security Staff',
      unit: 'Gate 1 Control Room',
      phone: '+91 98220 33445',
      badge: 'Gate Dispatch & Society Alarms',
      color: 'border-blue-200 bg-blue-50/50 hover:bg-blue-50',
    },
    {
      key: 'volunteer' as const,
      name: 'Dr. Arvind Swaminathan',
      role: 'Community Volunteer',
      unit: 'Tower 1 - Flat 101 (Doctor)',
      phone: '+91 98450 11223',
      badge: 'Nearby Help & BLS Certified',
      color: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50',
    },
    {
      key: 'admin' as const,
      name: 'Estate Office',
      role: 'Society Administrator',
      unit: 'Management Desk',
      phone: '+91 98765 43210',
      badge: 'Resident Approvals & Audit',
      color: 'border-purple-200 bg-purple-50/50 hover:bg-purple-50',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-xs animate-fadeIn max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Community Account Access</h3>
              <p className="text-[11px] text-slate-500">Palm Meadows Emergency Network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => {
              setMode('quick');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              mode === 'quick' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Quick Role Switch (Demo)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Django Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register New User
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Quick Role Switch Tab */}
        {mode === 'quick' && (
          <div className="space-y-3">
            <p className="text-slate-600">
              Instantly test multi-user actions across different perspectives without logging out:
            </p>
            <div className="space-y-2">
              {presetList.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => {
                    onAccountSelect(preset.key);
                    onClose();
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${preset.color}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{preset.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                        {preset.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{preset.unit} &bull; {preset.phone}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-slate-500">
                      &bull; {preset.badge}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold shrink-0 self-center">
                    Switch To
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. Django Login Tab */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Username / Phone</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. anita.rao, rajesh.sharma, vikram.singh"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In with Django REST API'}</span>
            </button>
          </form>
        )}

        {/* 3. Register New User Tab */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="username"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Primary Role</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                >
                  <option value="RESIDENT">Resident</option>
                  <option value="GUARDIAN">Guardian</option>
                  <option value="VOLUNTEER">Volunteer Responder</option>
                  <option value="SECURITY_STAFF">Security Guard</option>
                  <option value="SOCIETY_ADMIN">Society Admin</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+91 9XXXXXXXXX"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Password</label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Create password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Registering...' : 'Register Account'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
