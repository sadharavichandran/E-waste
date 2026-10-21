import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { ToastContainer } from './components/layout/ToastContainer';
import { AuthModal } from './components/layout/AuthModal';
import { RoleSelectionPage } from './components/auth/RoleSelectionPage';
import { LoginPage } from './components/auth/LoginPage';
import { EcoDashboard } from './components/dashboard/EcoDashboard';
import { DecisionEngine } from './components/decisionEngine/DecisionEngine';
import { PickupBooking } from './components/pickup/PickupBooking';
import { RequestTracker } from './components/tracking/RequestTracker';
import { CentreLocator } from './components/centres/CentreLocator';
import { EcoScoreRewards } from './components/rewards/EcoScoreRewards';
import { AdminPortal } from './components/admin/AdminPortal';
import { SuperAdminPortal } from './components/superadmin/SuperAdminPortal';
import { SuperAdminOverview } from './components/superadmin/SuperAdminOverview';
import { EWasteJourney } from './components/superadmin/EWasteJourney';
import { EnvironmentalIntelligence } from './components/superadmin/EnvironmentalIntelligence';
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react';

interface AccessDeniedCardProps {
  requiredRole: 'admin' | 'superadmin';
  title: string;
}

const AccessDeniedCard: React.FC<AccessDeniedCardProps> = ({ requiredRole, title }) => {
  const { switchRole, setActiveTab } = useApp();

  return (
    <div className="py-12 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200/80 p-8 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-inner">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            Authorization Restricted
          </span>
          <h3 className="text-xl font-black text-slate-900">{title} Required</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your current logged-in role does not possess permissions to view or edit this portal. This protects citizens from unverified operations and fraudulent actors.
          </p>
        </div>
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => switchRole(requiredRole)}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <span>Switch to {requiredRole.toUpperCase()} Clearance</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Return to Citizen Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

const MainContent: React.FC = () => {
  const { activeTab, currentUser, setActiveTab } = useApp();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const userRole = currentUser?.role || 'user';

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-800 flex flex-col font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Toast Alert System */}
      <ToastContainer />

      {/* Multi-Portal Authentication & Role Switcher Modal */}
      <AuthModal />

      {/* Collapsible Sidebar Navigation */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        mobileOpen={isMobileOpen}
        setMobileOpen={setIsMobileOpen}
      />

      {/* Main Workspace */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        {/* Top Navbar */}
        <TopNavbar onOpenMobileMenu={() => setIsMobileOpen(true)} />

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Citizen / User Portal Views */}
          {userRole === 'user' && (
            <>
              {activeTab === 'dashboard' && <EcoDashboard />}
              {activeTab === 'decision_engine' && <DecisionEngine />}
              {activeTab === 'schedule_pickup' && <PickupBooking />}
              {activeTab === 'track_request' && <RequestTracker />}
              {activeTab === 'collection_centres' && <CentreLocator />}
              {activeTab === 'ecoscore_rewards' && <EcoScoreRewards />}
            </>
          )}

          {/* Facility Admin Portal Views with RBAC Protection */}
          {activeTab.startsWith('admin_') && (
            userRole !== 'admin' ? (
              <AccessDeniedCard requiredRole="admin" title="Facility Administrator Clearance" />
            ) : (
              <AdminPortal />
            )
          )}

          {/* SuperAdmin Regulatory Portal Views with Strict RBAC */}
          {activeTab.startsWith('superadmin_') && (
            userRole !== 'superadmin' ? (
              <AccessDeniedCard requiredRole="superadmin" title="SuperAdmin Regulatory Clearance" />
            ) : (
              <>
                {activeTab === 'superadmin_overview'      && <SuperAdminOverview />}
                {activeTab === 'superadmin_approvals'     && <SuperAdminPortal />}
                {activeTab === 'superadmin_journey'       && <EWasteJourney />}
                {activeTab === 'superadmin_intelligence'  && <EnvironmentalIntelligence />}
              </>
            )
          )}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-200/80 bg-white/70 py-6 px-4 md:px-8 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl w-full mx-auto">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">EcoLoop</span>
            <span>•</span>
            <span className="italic font-medium text-emerald-800">“Don't Dump It. Loop It.”</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>3-Tier RBAC Architecture</span>
            <span>•</span>
            <span>SuperAdmin Verified E-Waste Hubs</span>
            <span>•</span>
            <span>Zero-Landfill Protocol</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

const AppRouter: React.FC = () => {
  const { currentRoute, navigateTo, isAuthenticated, login, showToast } = useApp();

  // Route: /auth/user/login
  if (currentRoute === '/auth/user/login') {
    return (
      <>
        <ToastContainer />
        <LoginPage
          role="user"
          routePath="/auth/user/login"
          onNavigate={navigateTo}
          onLoginSuccess={login}
          onShowToast={showToast}
        />
      </>
    );
  }

  // Route: /auth/centre/login
  if (currentRoute === '/auth/centre/login') {
    return (
      <>
        <ToastContainer />
        <LoginPage
          role="admin"
          routePath="/auth/centre/login"
          onNavigate={navigateTo}
          onLoginSuccess={login}
          onShowToast={showToast}
        />
      </>
    );
  }

  // Route: /auth/superadmin/login
  if (currentRoute === '/auth/superadmin/login') {
    return (
      <>
        <ToastContainer />
        <LoginPage
          role="superadmin"
          routePath="/auth/superadmin/login"
          onNavigate={navigateTo}
          onLoginSuccess={login}
          onShowToast={showToast}
        />
      </>
    );
  }

  // Route: /auth/select-role OR when user is not authenticated
  if (currentRoute === '/auth/select-role' || !isAuthenticated) {
    return (
      <>
        <ToastContainer />
        <RoleSelectionPage onSelectRoute={navigateTo} />
      </>
    );
  }

  // Authenticated workspace
  return <MainContent />;
};

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
