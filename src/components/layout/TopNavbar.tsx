import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  Search,
  Truck,
  Building2,
  ShieldCheck,
  User,
  ChevronDown,
  Sparkles,
  KeyRound,
  PlusCircle,
  LogOut,
} from 'lucide-react';

interface TopNavbarProps {
  onOpenMobileMenu: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenMobileMenu }) => {
  const {
    setActiveTab,
    setTrackedRequestId,
    currentUser,
    activeRole,
    switchRole,
    userEcoPoints,
    setIsAuthModalOpen,
    pendingCentres,
    logout,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setTrackedRequestId(searchQuery.trim().toUpperCase());
    setActiveTab('track_request');
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Quick Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 md:hidden transition cursor-pointer"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Track pickup ID (e.g. ECL-2026-8941)..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-xl text-xs text-slate-800 placeholder-slate-400 transition outline-hidden"
          />
        </form>
      </div>

      {/* Right: Portal Role Switcher, Quick Actions */}
      <div className="flex items-center gap-2.5">
        {/* 3-Portal Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              activeRole === 'superadmin'
                ? 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100'
                : activeRole === 'admin'
                ? 'bg-sky-50 border-sky-200 text-sky-900 hover:bg-sky-100'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
            }`}
          >
            {activeRole === 'superadmin' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
            ) : activeRole === 'admin' ? (
              <Building2 className="w-3.5 h-3.5 text-sky-700" />
            ) : (
              <User className="w-3.5 h-3.5 text-emerald-700" />
            )}
            <span className="capitalize">{activeRole} Portal</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
              <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Active Portal
              </div>

              {/* Option 1: Citizen/User */}
              <button
                onClick={() => {
                  switchRole('user');
                  setRoleDropdownOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 hover:bg-emerald-50 transition flex items-center justify-between cursor-pointer ${
                  activeRole === 'user' ? 'bg-emerald-50/80 font-bold text-emerald-900' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Citizen / User Portal</span>
                </div>
                {activeRole === 'user' && <span className="text-[10px] text-emerald-700">Active</span>}
              </button>

              {/* Option 2: Admin */}
              <button
                onClick={() => {
                  switchRole('admin');
                  setRoleDropdownOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 hover:bg-sky-50 transition flex items-center justify-between cursor-pointer ${
                  activeRole === 'admin' ? 'bg-sky-50/80 font-bold text-sky-900' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-sky-600" />
                  <span>Facility Admin Portal</span>
                </div>
                {activeRole === 'admin' && <span className="text-[10px] text-sky-700">Active</span>}
              </button>

              {/* Option 3: SuperAdmin */}
              <button
                onClick={() => {
                  switchRole('superadmin');
                  setRoleDropdownOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 hover:bg-purple-50 transition flex items-center justify-between cursor-pointer ${
                  activeRole === 'superadmin' ? 'bg-purple-50/80 font-bold text-purple-900' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>SuperAdmin Portal</span>
                </div>
                {pendingCentres.length > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    {pendingCentres.length}
                  </span>
                )}
              </button>

              <div className="pt-1 mt-1 border-t border-slate-100 space-y-0.5">
                <button
                  onClick={() => {
                    setRoleDropdownOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full text-left px-3.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition text-[11px] flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  <span>Switch Account / Modal...</span>
                </button>
                <button
                  onClick={() => {
                    setRoleDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3.5 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition text-[11px] flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Sign Out to Role Selection</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* EcoPoints Indicator for Citizen */}
        {activeRole === 'user' && (
          <button
            onClick={() => setActiveTab('ecoscore_rewards')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer"
            title="Real-time EcoPoints earned from verified recycling"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{userEcoPoints}</span>
            <span className="text-[10px] font-normal text-emerald-700 hidden sm:inline">pts</span>
          </button>
        )}

        {/* Role-specific CTA Button */}
        {activeRole === 'admin' ? (
          <button
            onClick={() => setActiveTab('admin_centres')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Centre</span>
            <span className="sm:hidden">Add</span>
          </button>
        ) : activeRole === 'superadmin' ? (
          <button
            onClick={() => setActiveTab('superadmin_approvals')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Audit ({pendingCentres.length})</span>
            <span className="sm:hidden">Audit</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('schedule_pickup')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Schedule Pickup</span>
            <span className="sm:hidden">Pickup</span>
          </button>
        )}
      </div>
    </header>
  );
};
