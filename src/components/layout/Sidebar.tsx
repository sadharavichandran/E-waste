import React from 'react';
import { useApp, NavigationTab } from '../../context/AppContext';
import {
  LayoutDashboard,
  Compass,
  Truck,
  Search,
  MapPin,
  Award,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Sparkles,
  Building2,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (c: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (o: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    activeRole,
    userEcoPoints,
    setIsAuthModalOpen,
    pendingCentres,
    logout,
  } = useApp();

  // Role-specific navigation items
  let navItems: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [];

  if (activeRole === 'superadmin') {
    navItems = [
      {
        id: 'superadmin_approvals',
        label: 'Centre Verifications',
        icon: ShieldCheck,
        badge: pendingCentres.length > 0 ? `${pendingCentres.length} new` : undefined,
      },
      { id: 'superadmin_audit', label: 'Anti-Fraud Shield', icon: AlertTriangle },
      { id: 'admin_pickups', label: 'Customer Pickups', icon: Truck },
      { id: 'collection_centres', label: 'Verified Public Map', icon: MapPin },
      { id: 'decision_engine', label: 'E-Waste Guide', icon: Compass },
    ];
  } else if (activeRole === 'admin') {
    navItems = [
      { id: 'admin_centres', label: 'E-Waste Centres', icon: Building2 },
      { id: 'admin_pickups', label: 'Pickup Dispatch', icon: Truck },
      { id: 'collection_centres', label: 'Collection Map', icon: MapPin },
      { id: 'decision_engine', label: 'Smart E-Waste Guide', icon: Compass },
    ];
  } else {
    // Regular citizen / user
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'decision_engine', label: 'Smart E-Waste Guide', icon: Compass },
      { id: 'schedule_pickup', label: 'Schedule a Pickup', icon: Truck },
      { id: 'track_request', label: 'Track a Request', icon: Search },
      { id: 'collection_centres', label: 'Find Collection Centres', icon: MapPin },
      { id: 'ecoscore_rewards', label: 'My EcoScore & Badges', icon: Award },
    ];
  }

  const handleNavClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  const getRoleHeader = () => {
    switch (activeRole) {
      case 'superadmin':
        return {
          title: 'SuperAdmin',
          color: 'bg-purple-100 text-purple-900 border-purple-200',
          dot: 'bg-purple-600',
        };
      case 'admin':
        return {
          title: 'Facility Admin',
          color: 'bg-sky-100 text-sky-900 border-sky-200',
          dot: 'bg-sky-600',
        };
      default:
        return {
          title: 'Citizen Portal',
          color: 'bg-emerald-100 text-emerald-900 border-emerald-200',
          dot: 'bg-emerald-600',
        };
    }
  };

  const roleMeta = getRoleHeader();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100">
          <div
            onClick={() => handleNavClick(activeRole === 'superadmin' ? 'superadmin_approvals' : activeRole === 'admin' ? 'admin_centres' : 'dashboard')}
            className="flex items-center gap-3 cursor-pointer select-none overflow-hidden"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shrink-0 shadow-sm shadow-emerald-900/10">
              <Leaf className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-slate-900 text-lg leading-tight tracking-tight">
                  Eco<span className="text-emerald-700">Loop</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-tight">
                  Don't Dump It. Loop It.
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Role Indicator Banner */}
        {!isCollapsed && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-xl border flex items-center justify-between text-[11px] font-semibold bg-slate-50 border-slate-200">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${roleMeta.dot} animate-pulse`} />
              <span className="text-slate-800">{roleMeta.title}</span>
            </span>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-emerald-700 hover:text-emerald-800 text-[10px] font-bold underline underline-offset-2 cursor-pointer"
            >
              Switch Role
            </button>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? activeRole === 'superadmin'
                      ? 'bg-purple-900 text-white font-semibold shadow-xs'
                      : activeRole === 'admin'
                      ? 'bg-sky-800 text-white font-semibold shadow-xs'
                      : 'bg-emerald-700 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User EcoPoints Widget (shown in Citizen mode) */}
        {!isCollapsed && activeRole === 'user' && (
          <div className="mx-3 mb-3 p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Live EcoPoints
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase">Real Pts</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-emerald-300">
                {userEcoPoints}{' '}
                <span className="text-xs font-normal text-slate-300">pts</span>
              </span>
              <button
                onClick={() => handleNavClick('ecoscore_rewards')}
                className="text-[11px] text-white underline underline-offset-2 hover:text-emerald-300 transition cursor-pointer"
              >
                Inspect
              </button>
            </div>
          </div>
        )}

        {/* Bottom Current Profile Area */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between gap-2">
            <div
              onClick={() => setIsAuthModalOpen(true)}
              className={`flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100/80 cursor-pointer transition flex-1 min-w-0 ${
                isCollapsed ? 'justify-center p-1' : ''
              }`}
              title="Click to Switch Portal"
            >
              <img
                src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={currentUser?.name || 'User'}
                className="w-8 h-8 rounded-full object-cover border border-emerald-500/40 shrink-0"
              />
              {!isCollapsed && (
                <div className="flex flex-col truncate flex-1 min-w-0">
                  <span className="text-xs font-semibold text-slate-900 truncate">{currentUser?.name || 'Authorized Member'}</span>
                  <span className="text-[10px] text-slate-500 capitalize truncate">
                    {currentUser?.role || 'User'} • {currentUser?.organization || 'EcoLoop'}
                  </span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={logout}
                title="Sign out & return to role selection"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
