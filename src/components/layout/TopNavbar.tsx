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
        {/* User Account & Role Badge (No portal switching while logged in) */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer shadow-xs"
            title="User Profile & Account"
          >
            <img
              src={
                currentUser?.avatarUrl ||
                (activeRole === 'superadmin'
                  ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
                  : activeRole === 'admin'
                  ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                  : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')
              }
              alt={currentUser?.name || 'User'}
              className="w-6 h-6 rounded-full object-cover border border-emerald-500/40 shrink-0"
            />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">
                {currentUser?.name || 'Authorized Member'}
              </span>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider leading-tight ${
                  activeRole === 'superadmin'
                    ? 'text-purple-700'
                    : activeRole === 'admin'
                    ? 'text-sky-700'
                    : 'text-emerald-700'
                }`}
              >
                {activeRole === 'superadmin' ? 'SuperAdmin' : activeRole === 'admin' ? 'Admin' : 'Citizen'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-3">
                <img
                  src={
                    currentUser?.avatarUrl ||
                    (activeRole === 'superadmin'
                      ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
                      : activeRole === 'admin'
                      ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')
                  }
                  alt={currentUser?.name || 'User'}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{currentUser?.name || 'Authorized Member'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser?.email || 'user@ecoloop.org'}</p>
                  <span
                    className={`inline-block mt-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      activeRole === 'superadmin'
                        ? 'bg-purple-100 text-purple-800'
                        : activeRole === 'admin'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {activeRole === 'superadmin'
                      ? 'SuperAdmin Portal'
                      : activeRole === 'admin'
                      ? 'Facility Admin Portal'
                      : 'Citizen Member Portal'}
                  </span>
                </div>
              </div>

              <div className="px-4 py-2 text-[11px] text-slate-500 border-b border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Organization</span>
                  <span className="font-medium text-slate-800 truncate max-w-[130px] text-right">
                    {currentUser?.organization || 'EcoLoop Network'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Session Status</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Authenticated
                  </span>
                </div>
              </div>

              <div className="pt-1 px-2">
                <button
                  onClick={() => {
                    setRoleDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition text-xs flex items-center gap-2 cursor-pointer font-bold"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
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
            onClick={() => setActiveTab('admin_my_centre')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">My Centre</span>
            <span className="sm:hidden">Centre</span>
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
