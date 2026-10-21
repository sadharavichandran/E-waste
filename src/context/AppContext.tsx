import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ActivityHistoryItem,
  AuthAccount,
  CollectionCentre,
  DeviceCategory,
  PickupRequest,
  RequestStatus,
  UserRole,
} from '../types';
import {
  ENVIRONMENTAL_IMPACT_FACTORS,
  SYSTEM_PORTAL_ACCOUNTS,
} from '../data/seedData';
import confetti from 'canvas-confetti';

export type NavigationTab =
  | 'dashboard'
  | 'decision_engine'
  | 'schedule_pickup'
  | 'track_request'
  | 'collection_centres'
  | 'ecoscore_rewards'
  // Admin Tabs
  | 'admin_centres'
  | 'admin_pickups'
  // SuperAdmin Tabs
  | 'superadmin_approvals'
  | 'superadmin_audit';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  currentUser: AuthAccount | null;
  setCurrentUser: (u: AuthAccount | null) => void;
  isAuthenticated: boolean;
  activeRole: UserRole;
  currentRoute: string;
  navigateTo: (route: string) => void;
  login: (user: { id: string; name: string; email: string; role: UserRole; organization?: string }) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  requests: PickupRequest[];
  centres: CollectionCentre[];
  approvedCentres: CollectionCentre[];
  pendingCentres: CollectionCentre[];
  activityHistory: ActivityHistoryItem[];
  trackedRequestId: string | null;
  setTrackedRequestId: (id: string | null) => void;
  preselectedCategory: DeviceCategory | null;
  setPreselectedCategory: (cat: DeviceCategory | null) => void;
  // User Actions
  submitPickupRequest: (data: Omit<PickupRequest, 'id' | 'status' | 'submittedAt' | 'statusHistory' | 'pointsAwarded' | 'pointsEarned' | 'estimatedCo2SavedKg'>) => PickupRequest;
  // Admin Actions
  registerCentre: (data: Omit<CollectionCentre, 'id' | 'approvalStatus' | 'submittedByAdminId' | 'submittedByAdminName' | 'submittedAt'>) => CollectionCentre;
  updateRequestStatus: (id: string, newStatus: RequestStatus, note?: string) => void;
  // SuperAdmin Actions
  reviewCentre: (centreId: string, decision: 'approved' | 'rejected', notes?: string) => void;
  deleteCentre: (centreId: string) => void;
  deleteRequest: (requestId: string) => void;
  clearAllData: () => void;
  // Toasts & Auth Modal
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isSupabaseModalOpen: boolean;
  setIsSupabaseModalOpen: (open: boolean) => void;
  userEcoPoints: number;
}

const STORAGE_KEY_CENTRES = 'ecoloop_realtime_centres_v3';
const STORAGE_KEY_REQUESTS = 'ecoloop_realtime_requests_v3';
const STORAGE_KEY_HISTORY = 'ecoloop_realtime_history_v3';
const STORAGE_KEY_AUTH = 'ecoloop_realtime_auth_v4';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check initial route from window pathname if present
  const getInitialRoute = () => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (['/auth/user/login', '/auth/centre/login', '/auth/superadmin/login', '/auth/select-role'].includes(p)) {
        return p;
      }
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH);
      if (saved) return '/portal';
    } catch (e) {
      console.warn(e);
    }
    return '/auth/select-role';
  };

  const [currentRoute, setCurrentRoute] = useState<string>(getInitialRoute);

  // Authentication & Session
  const [currentUser, setCurrentUser] = useState<AuthAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read saved auth:', e);
    }
    return null;
  });

  const isAuthenticated = currentUser !== null;
  const activeRole: UserRole = currentUser?.role || 'user';

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<NavigationTab>(() => {
    if (currentUser?.role === 'superadmin') return 'superadmin_approvals';
    if (currentUser?.role === 'admin') return 'admin_centres';
    return 'dashboard';
  });

  // Real-time Collections Centres
  const [centres, setCentres] = useState<CollectionCentre[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CENTRES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read centres:', e);
    }
    return [];
  });

  // Real-time Pickup Requests
  const [requests, setRequests] = useState<PickupRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REQUESTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read requests:', e);
    }
    return [];
  });

  // Activity history
  const [activityHistory, setActivityHistory] = useState<ActivityHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read history:', e);
    }
    return [];
  });

  const [trackedRequestId, setTrackedRequestId] = useState<string | null>(null);
  const [preselectedCategory, setPreselectedCategory] = useState<DeviceCategory | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Sync session to LocalStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_AUTH);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CENTRES, JSON.stringify(centres));
    } catch (e) {
      console.error(e);
    }
  }, [centres]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(requests));
    } catch (e) {
      console.error(e);
    }
  }, [requests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(activityHistory));
    } catch (e) {
      console.error(e);
    }
  }, [activityHistory]);

  const approvedCentres = centres.filter((c) => c.approvalStatus === 'approved');
  const pendingCentres = centres.filter((c) => c.approvalStatus === 'pending');

  const userEcoPoints = requests.reduce((acc, req) => {
    if (req.pointsAwarded) {
      return acc + (req.pointsEarned || 0);
    }
    return acc;
  }, 0);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const navigateTo = (route: string) => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined' && window.history?.pushState) {
      window.history.pushState({}, '', route);
    }
  };

  // Login handler
  const login = (user: { id: string; name: string; email: string; role: UserRole; organization?: string }) => {
    const account: AuthAccount = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization || (user.role === 'superadmin' ? 'Regulatory Authority' : user.role === 'admin' ? 'Collection Facility' : 'Resident Citizen'),
      joinedDate: new Date().toISOString().split('T')[0],
      avatarUrl:
        user.role === 'superadmin'
          ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
          : user.role === 'admin'
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };

    setCurrentUser(account);

    // Route to appropriate role portal tab
    if (user.role === 'superadmin') {
      setActiveTab('superadmin_approvals');
    } else if (user.role === 'admin') {
      setActiveTab('admin_centres');
    } else {
      setActiveTab('dashboard');
    }

    navigateTo('/portal');
  };

  // Logout handler
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_AUTH);
    navigateTo('/auth/select-role');
    showToast('Signed out of EcoLoop session', 'info');
  };

  const switchRole = (role: UserRole) => {
    const account = SYSTEM_PORTAL_ACCOUNTS.find((a) => a.role === role) || {
      id: `${role}-${Date.now()}`,
      name: role === 'superadmin' ? 'Dr. Sarah Al-Mansoor' : role === 'admin' ? 'Marcus Sterling' : 'Avery Morgan',
      email: `${role}@ecoloop.org`,
      role,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    setCurrentUser(account);

    if (role === 'superadmin') {
      setActiveTab('superadmin_approvals');
    } else if (role === 'admin') {
      setActiveTab('admin_centres');
    } else {
      setActiveTab('dashboard');
    }

    showToast(`Switched active portal to ${role.toUpperCase()}`, 'info');
  };

  const submitPickupRequest = (
    data: Omit<PickupRequest, 'id' | 'status' | 'submittedAt' | 'statusHistory' | 'pointsAwarded' | 'pointsEarned' | 'estimatedCo2SavedKg'>
  ): PickupRequest => {
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const newId = `ECL-2026-${randomHex}`;
    const nowIso = new Date().toISOString();

    const categoryFactor = ENVIRONMENTAL_IMPACT_FACTORS[data.category] || ENVIRONMENTAL_IMPACT_FACTORS.other;
    const estimatedCo2 = parseFloat((categoryFactor.co2KgPerUnit * data.quantity).toFixed(1));

    const newRequest: PickupRequest = {
      ...data,
      id: newId,
      userId: currentUser?.id || 'guest',
      status: 'submitted',
      submittedAt: nowIso,
      statusHistory: [
        {
          status: 'submitted',
          timestamp: nowIso,
          note: 'Request received and placed into dispatch queue',
          updatedBy: `${currentUser?.name || data.userName} (Customer)`,
        },
      ],
      pointsAwarded: false,
      pointsEarned: 0,
      estimatedCo2SavedKg: estimatedCo2,
    };

    setRequests((prev) => [newRequest, ...prev]);
    setTrackedRequestId(newId);
    showToast(`Pickup request ${newId} registered in real time!`, 'success');
    return newRequest;
  };

  const registerCentre = (
    data: Omit<CollectionCentre, 'id' | 'approvalStatus' | 'submittedByAdminId' | 'submittedByAdminName' | 'submittedAt'>
  ): CollectionCentre => {
    const newId = `cntr-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newCentre: CollectionCentre = {
      ...data,
      id: newId,
      approvalStatus: 'pending',
      submittedByAdminId: currentUser?.id || 'admin-001',
      submittedByAdminName: currentUser?.name || 'Facility Administrator',
      submittedAt: nowIso,
      rating: 4.8,
    };

    setCentres((prev) => [newCentre, ...prev]);
    showToast(`E-Waste Centre "${newCentre.name}" submitted for SuperAdmin verification!`, 'success');
    return newCentre;
  };

  const reviewCentre = (centreId: string, decision: 'approved' | 'rejected', notes?: string) => {
    const nowIso = new Date().toISOString();

    setCentres((prev) =>
      prev.map((c) => {
        if (c.id !== centreId) return c;
        return {
          ...c,
          approvalStatus: decision,
          reviewedBySuperAdminId: currentUser?.id || 'superadmin-001',
          reviewedAt: nowIso,
          verificationNotes: notes || (decision === 'approved' ? 'Verified against governmental environmental registries.' : 'Rejected: Incomplete safety documentation or unverified address.'),
        };
      })
    );

    if (decision === 'approved') {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#059669', '#10b981', '#34d399', '#3b82f6'],
        });
      } catch (e) {
        // ignore
      }
      showToast(`Centre approved! It is now publicly active on the E-Waste Locator map.`, 'success');
    } else {
      showToast(`Centre rejected. Protected citizens from unverified facility.`, 'warning');
    }
  };

  const updateRequestStatus = (id: string, newStatus: RequestStatus, note?: string) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== id) return req;

        const nowIso = new Date().toISOString();
        const statusEntry = {
          status: newStatus,
          timestamp: nowIso,
          note: note || `Status updated to ${newStatus}`,
          updatedBy: `${currentUser?.name || 'System Operator'} (${currentUser?.role || 'admin'})`,
        };

        let pointsJustEarned = 0;
        let shouldAwardPoints = false;

        if ((newStatus === 'collected' || newStatus === 'recycled') && !req.pointsAwarded) {
          shouldAwardPoints = true;
          const factor = ENVIRONMENTAL_IMPACT_FACTORS[req.category] || ENVIRONMENTAL_IMPACT_FACTORS.other;
          pointsJustEarned = factor.pointsReward * req.quantity;
        }

        if (shouldAwardPoints) {
          try {
            confetti({
              particleCount: 75,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#059669', '#10b981', '#34d399', '#f59e0b'],
            });
          } catch (e) {
            // ignore
          }

          const newActivity: ActivityHistoryItem = {
            id: `act-${Date.now()}`,
            requestId: req.id,
            title: `${req.deviceName || req.category} Verified ${newStatus === 'recycled' ? 'Recycled' : 'Collected'}`,
            description: `Awarded +${pointsJustEarned} real EcoPoints for compliant circular turnover.`,
            date: new Date().toISOString().split('T')[0],
            points: pointsJustEarned,
            type: 'pickup',
          };
          setActivityHistory((h) => [newActivity, ...h]);
          showToast(`+${pointsJustEarned} EcoPoints awarded to ${req.userName}!`, 'success');
        }

        return {
          ...req,
          status: newStatus,
          statusHistory: [...req.statusHistory, statusEntry],
          pointsAwarded: req.pointsAwarded || shouldAwardPoints,
          pointsEarned: req.pointsAwarded ? req.pointsEarned : req.pointsEarned + pointsJustEarned,
        };
      })
    );
  };

  const deleteCentre = (centreId: string) => {
    setCentres((prev) => prev.filter((c) => c.id !== centreId));
    showToast('Collection centre removed from system', 'info');
  };

  const deleteRequest = (requestId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    showToast(`Request ${requestId} deleted`, 'info');
  };

  const clearAllData = () => {
    setCentres([]);
    setRequests([]);
    setActivityHistory([]);
    localStorage.removeItem(STORAGE_KEY_CENTRES);
    localStorage.removeItem(STORAGE_KEY_REQUESTS);
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    showToast('All real-time database tables cleared to blank state', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthenticated,
        activeRole,
        currentRoute,
        navigateTo,
        login,
        logout,
        switchRole,
        activeTab,
        setActiveTab,
        requests,
        centres,
        approvedCentres,
        pendingCentres,
        activityHistory,
        trackedRequestId,
        setTrackedRequestId,
        preselectedCategory,
        setPreselectedCategory,
        submitPickupRequest,
        registerCentre,
        updateRequestStatus,
        reviewCentre,
        deleteCentre,
        deleteRequest,
        clearAllData,
        toasts,
        showToast,
        removeToast,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isSupabaseModalOpen,
        setIsSupabaseModalOpen,
        userEcoPoints,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
