import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { SYSTEM_PORTAL_ACCOUNTS } from '../../data/seedData';
import {
  ShieldAlert,
  User,
  ShieldCheck,
  Building2,
  X,
  ArrowRight,
  Lock,
  Mail,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, currentUser, switchRole, setCurrentUser, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'quick' | 'custom'>('quick');
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customRole, setCustomRole] = useState<UserRole>('user');
  const [customOrg, setCustomOrg] = useState('');

  if (!isAuthModalOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customEmail.trim()) {
      showToast('Please enter your name and email', 'warning');
      return;
    }

    const newAccount = {
      id: `usr-${Date.now()}`,
      name: customName.trim(),
      email: customEmail.trim(),
      role: customRole,
      organization: customOrg.trim() || (customRole === 'superadmin' ? 'Regulatory Compliance' : customRole === 'admin' ? 'E-Waste Operations' : 'Citizen'),
      joinedDate: new Date().toISOString().split('T')[0],
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    };

    setCurrentUser(newAccount);
    setIsAuthModalOpen(false);
    showToast(`Logged in as ${newAccount.name} (${newAccount.role.toUpperCase()})`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-sm">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                EcoLoop Multi-Portal Authentication
              </h3>
              <p className="text-xs text-slate-500">
                Select your authorized portal to access role-specific workflows
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center px-6 border-b border-slate-100 bg-white gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('quick')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'quick'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Fast Role Switcher
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'custom'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Custom Credentials Login
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {activeTab === 'quick' ? (
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Select Authorized System Portal
              </span>

              {/* Portal 1: User */}
              <div
                onClick={() => {
                  switchRole('user');
                  setIsAuthModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  currentUser?.role === 'user'
                    ? 'border-emerald-500 bg-emerald-50/60 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">1. Citizen & Resident Portal</h4>
                      {currentUser?.role === 'user' && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Schedule doorstep pickups, track requests, discover verified e-waste hubs, and earn rewards.
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 mt-1 block">user@ecoloop.org</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>

              {/* Portal 2: Admin */}
              <div
                onClick={() => {
                  switchRole('admin');
                  setIsAuthModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  currentUser?.role === 'admin'
                    ? 'border-sky-500 bg-sky-50/60 shadow-xs ring-2 ring-sky-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">2. Facility Admin Portal</h4>
                      {currentUser?.role === 'admin' && (
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Register new collection centers, input GPS locations & licenses, and manage pickup dispatch queues.
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 mt-1 block">admin@ecoloop.org</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>

              {/* Portal 3: SuperAdmin */}
              <div
                onClick={() => {
                  switchRole('superadmin');
                  setIsAuthModalOpen(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  currentUser?.role === 'superadmin'
                    ? 'border-purple-500 bg-purple-50/60 shadow-xs ring-2 ring-purple-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">3. SuperAdmin Verification Portal</h4>
                      {currentUser?.role === 'superadmin' && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Protect users from fake actors. Review credentials, verify licenses, and Approve / Reject centers.
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 mt-1 block">superadmin@ecoloop.org</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleCustomLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Portal Role</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomRole('user')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      customRole === 'user' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    User
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomRole('admin')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      customRole === 'admin' ? 'border-sky-600 bg-sky-50 text-sky-900' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomRole('superadmin')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      customRole === 'superadmin' ? 'border-purple-600 bg-purple-50 text-purple-900' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    SuperAdmin
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-emerald-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="e.g. elena@example.com"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-emerald-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Organization / Department (Optional)</label>
                <input
                  type="text"
                  value={customOrg}
                  onChange={(e) => setCustomOrg(e.target.value)}
                  placeholder="e.g. Stanford Sustainability or San Francisco CleanTech"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-emerald-600 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition"
              >
                Sign In to Portal
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600" /> Real-time RBAC Session Engine
          </span>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="text-xs font-semibold text-slate-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
