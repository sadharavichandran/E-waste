import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
import {
  isSupabaseConfigured,
  getSupabaseConfig,
} from '../lib/supabaseClient';
import {
  fetchCentresFromDB,
  upsertCentreInDB,
  deleteCentreFromDB,
  fetchRequestsFromDB,
  upsertRequestInDB,
  deleteRequestFromDB,
  fetchActivityHistoryFromDB,
  insertActivityInDB,
  logRequestStatusAudit,
  syncAllDataToSupabase,
  subscribeToDatabaseChanges,
  testSupabaseConnection,
} from '../lib/supabaseService';
import confetti from 'canvas-confetti';

export type NavigationTab =
  | 'dashboard'
  | 'decision_engine'
  | 'schedule_pickup'
  | 'track_request'
  | 'collection_centres'
  | 'ecoscore_rewards'
  // Centre Admin Tabs (Strict Real-Time Facility Management)
  | 'admin_my_centre'
  | 'admin_centres'
  | 'admin_pickups'
  | 'admin_schedule'
  | 'admin_inventory'
  | 'admin_history'
  | 'admin_analytics'
  | 'admin_notifications'
  | 'admin_settings'
  // SuperAdmin Tabs
  | 'superadmin_overview'
  | 'superadmin_approvals'
  | 'superadmin_journey'
  | 'superadmin_intelligence';

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
  submitPickupRequest: (
    data: Omit<PickupRequest, 'id' | 'status' | 'submittedAt' | 'statusHistory' | 'pointsAwarded' | 'pointsEarned' | 'estimatedCo2SavedKg'>
  ) => PickupRequest;
  // Admin Actions
  registerCentre: (
    data: Omit<CollectionCentre, 'id' | 'approvalStatus' | 'submittedByAdminId' | 'submittedByAdminName' | 'submittedAt'>
  ) => CollectionCentre;
  updateCentre: (centre: CollectionCentre) => Promise<CollectionCentre>;
  updateRequestStatus: (id: string, newStatus: RequestStatus, note?: string) => Promise<void>;
  // SuperAdmin Actions
  reviewCentre: (centreId: string, decision: 'approved' | 'rejected', notes?: string) => Promise<void>;
  deleteCentre: (centreId: string) => Promise<void>;
  deleteRequest: (requestId: string) => Promise<void>;
  clearAllData: () => Promise<void>;
  // Supabase Database Status & Sync
  isSupabaseConfigured: boolean;
  isSupabaseConnected: boolean;
  isDatabaseLoading: boolean;
  databaseError: string | null;
  syncToSupabase: () => Promise<{ centresCount: number; requestsCount: number; historyCount: number }>;
  reloadFromDatabase: () => Promise<void>;
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

const STORAGE_KEY_CENTRES = 'ecoloop_realtime_centres_v4';
const STORAGE_KEY_REQUESTS = 'ecoloop_realtime_requests_v4';
const STORAGE_KEY_HISTORY = 'ecoloop_realtime_history_v4';
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
    if (currentUser?.role === 'superadmin') return 'superadmin_overview';
    if (currentUser?.role === 'admin') return 'admin_my_centre';
    return 'dashboard';
  });

  // Database Connection States
  const [hasConfiguredSupabase, setHasConfiguredSupabase] = useState<boolean>(() => isSupabaseConfigured());
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [isDatabaseLoading, setIsDatabaseLoading] = useState<boolean>(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);

  // Real-time Collections Centres (Strictly real database data only - no fake/mock fallbacks)
  const [centres, setCentres] = useState<CollectionCentre[]>([]);

  // Real-time Pickup Requests (Strictly real database data only - no fake/mock fallbacks)
  const [requests, setRequests] = useState<PickupRequest[]>([]);

  // Activity history (Strictly real database data only - no fake/mock fallbacks)
  const [activityHistory, setActivityHistory] = useState<ActivityHistoryItem[]>([]);

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

  // Sync state to local storage as continuous fallback
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

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Database Loader Function - strictly real records from Supabase
  const reloadFromDatabase = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setIsSupabaseConnected(false);
      setDatabaseError('Supabase is not configured yet.');
      return;
    }

    setIsDatabaseLoading(true);
    setDatabaseError(null);
    try {
      const test = await testSupabaseConnection();
      if (!test.success) {
        setIsSupabaseConnected(false);
        setDatabaseError(test.error || test.message);
        setIsDatabaseLoading(false);
        return;
      }

      setIsSupabaseConnected(true);

      // Fetch all tables concurrently from Supabase
      const [remoteCentres, remoteRequests, remoteHistory] = await Promise.all([
        fetchCentresFromDB().catch((e) => {
          console.warn('Centres fetch error:', e);
          return null;
        }),
        fetchRequestsFromDB().catch((e) => {
          console.warn('Requests fetch error:', e);
          return null;
        }),
        fetchActivityHistoryFromDB().catch((e) => {
          console.warn('History fetch error:', e);
          return null;
        }),
      ]);

      if (remoteCentres !== null) {
        setCentres(remoteCentres);
      }

      if (remoteRequests !== null) {
        setRequests(remoteRequests);
      }

      if (remoteHistory !== null) {
        setActivityHistory(remoteHistory);
      }
    } catch (err: any) {
      console.error('Database reload failed:', err);
      setIsSupabaseConnected(false);
      setDatabaseError(err.message || 'Failed to communicate with Supabase.');
    } finally {
      setIsDatabaseLoading(false);
    }
  }, []);

  // Sync to Supabase manually
  const syncToSupabase = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured yet. Please configure URL and Key in the modal.');
    }
    setIsDatabaseLoading(true);
    try {
      const result = await syncAllDataToSupabase(centres, requests, activityHistory);
      setIsSupabaseConnected(true);
      showToast(
        `Successfully synced ${result.centresCount} centres and ${result.requestsCount} requests to Supabase!`,
        'success'
      );
      return result;
    } catch (err: any) {
      showToast(`Sync failed: ${err.message}`, 'error');
      throw err;
    } finally {
      setIsDatabaseLoading(false);
    }
  }, [centres, requests, activityHistory, showToast]);

  // Initial connection & Real-time setup
  const isInitialMount = useRef(true);
  useEffect(() => {
    const configCheck = isSupabaseConfigured();
    setHasConfiguredSupabase(configCheck);

    if (configCheck) {
      reloadFromDatabase();
    }

    // Set up Realtime listener
    const unsubscribe = subscribeToDatabaseChanges(
      () => {
        // collection_centres changed
        fetchCentresFromDB()
          .then((fresh) => {
            if (fresh.length > 0) setCentres(fresh);
          })
          .catch(() => {});
      },
      () => {
        // pickup_requests changed
        fetchRequestsFromDB()
          .then((fresh) => {
            if (fresh.length > 0) setRequests(fresh);
          })
          .catch(() => {});
      },
      () => {
        // activity_history changed
        fetchActivityHistoryFromDB()
          .then((fresh) => {
            if (fresh.length > 0) setActivityHistory(fresh);
          })
          .catch(() => {});
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const approvedCentres = centres.filter((c) => c.approvalStatus === 'approved');
  const pendingCentres = centres.filter((c) => c.approvalStatus === 'pending');

  const userEcoPoints = requests.reduce((acc, req) => {
    if (req.pointsAwarded) {
      return acc + (req.pointsEarned || 0);
    }
    return acc;
  }, 0);

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
      setActiveTab('superadmin_overview');
    } else if (user.role === 'admin') {
      setActiveTab('admin_my_centre');
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
      setActiveTab('superadmin_overview');
    } else if (role === 'admin') {
      setActiveTab('admin_my_centre');
    } else {
      setActiveTab('dashboard');
    }

    showToast(`Switched active portal to ${role.toUpperCase()}`, 'info');
  };

  // Submit Pickup Request (Stores in Supabase and local state)
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

    // Update local state immediately
    setRequests((prev) => [newRequest, ...prev]);
    setTrackedRequestId(newId);

    // Save to Supabase DB asynchronously if configured
    if (isSupabaseConfigured()) {
      upsertRequestInDB(newRequest)
        .then(() => {
          logRequestStatusAudit(
            newId,
            'submitted',
            'Request received and placed into dispatch queue',
            `${currentUser?.name || data.userName} (Customer)`
          );
          showToast(`Pickup request ${newId} saved to Supabase PostgreSQL in real time!`, 'success');
        })
        .catch((err: any) => {
          console.warn('Failed to insert request into Supabase:', err);
          showToast(`Pickup ${newId} stored locally (Supabase write error: ${err.message || err})`, 'warning');
        });
    } else {
      showToast(`Pickup request ${newId} registered locally!`, 'success');
    }

    return newRequest;
  };

  // Register Collection Centre (Stores in Supabase and local state)
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

    // Save to Supabase DB asynchronously
    if (isSupabaseConfigured()) {
      upsertCentreInDB(newCentre)
        .then(() => {
          showToast(`E-Waste Centre "${newCentre.name}" saved to Supabase (Pending SuperAdmin review)!`, 'success');
        })
        .catch((err: any) => {
          console.warn('Failed to insert centre into Supabase:', err);
          showToast(`Centre stored locally (Supabase write error: ${err.message})`, 'warning');
        });
    } else {
      showToast(`E-Waste Centre "${newCentre.name}" submitted for SuperAdmin verification!`, 'success');
    }

    return newCentre;
  };

  // Update existing Collection Centre (Stores in Supabase and local state)
  const updateCentre = async (updated: CollectionCentre): Promise<CollectionCentre> => {
    setCentres((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (isSupabaseConfigured()) {
      try {
        await upsertCentreInDB(updated);
        showToast(`Centre "${updated.name}" updated in Supabase!`, 'success');
      } catch (err: any) {
        showToast(`Failed to update centre in Supabase: ${err.message}`, 'error');
      }
    }
    return updated;
  };

  // Review Centre: SuperAdmin approval/rejection
  const reviewCentre = async (centreId: string, decision: 'approved' | 'rejected', notes?: string) => {
    const nowIso = new Date().toISOString();
    let updatedCentre: CollectionCentre | null = null;

    setCentres((prev) =>
      prev.map((c) => {
        if (c.id !== centreId) return c;
        updatedCentre = {
          ...c,
          approvalStatus: decision,
          reviewedBySuperAdminId: currentUser?.id || 'superadmin-001',
          reviewedAt: nowIso,
          verificationNotes:
            notes ||
            (decision === 'approved'
              ? 'Verified against governmental environmental registries.'
              : 'Rejected: Incomplete safety documentation or unverified address.'),
        };
        return updatedCentre;
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

    if (updatedCentre && isSupabaseConfigured()) {
      try {
        await upsertCentreInDB(updatedCentre);
      } catch (err) {
        console.warn('Failed to update centre status in Supabase:', err);
      }
    }
  };

  // Update Request Status (Admin / SuperAdmin)
  const updateRequestStatus = async (id: string, newStatus: RequestStatus, note?: string) => {
    let updatedRequest: PickupRequest | null = null;
    let activityToLog: ActivityHistoryItem | null = null;

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

          activityToLog = {
            id: `act-${Date.now()}`,
            requestId: req.id,
            title: `${req.deviceName || req.category} Verified ${newStatus === 'recycled' ? 'Recycled' : 'Collected'}`,
            description: `Awarded +${pointsJustEarned} real EcoPoints for compliant circular turnover.`,
            date: new Date().toISOString().split('T')[0],
            points: pointsJustEarned,
            type: 'pickup',
          };
          setActivityHistory((h) => [activityToLog!, ...h]);
          showToast(`+${pointsJustEarned} EcoPoints awarded to ${req.userName}!`, 'success');
        }

        updatedRequest = {
          ...req,
          status: newStatus,
          statusHistory: [...req.statusHistory, statusEntry],
          pointsAwarded: req.pointsAwarded || shouldAwardPoints,
          pointsEarned: req.pointsAwarded ? req.pointsEarned : req.pointsEarned + pointsJustEarned,
        };

        return updatedRequest;
      })
    );

    // Sync to Supabase
    if (updatedRequest && isSupabaseConfigured()) {
      try {
        await upsertRequestInDB(updatedRequest);
        await logRequestStatusAudit(
          id,
          newStatus,
          note || `Status updated to ${newStatus}`,
          `${currentUser?.name || 'System Operator'} (${currentUser?.role || 'admin'})`
        );
        if (activityToLog) {
          await insertActivityInDB(activityToLog);
        }
      } catch (err) {
        console.warn('Failed to update request status in Supabase:', err);
      }
    }
  };

  const deleteCentre = async (centreId: string) => {
    setCentres((prev) => prev.filter((c) => c.id !== centreId));
    if (isSupabaseConfigured()) {
      try {
        await deleteCentreFromDB(centreId);
      } catch (err) {
        console.warn('Failed to delete centre from Supabase:', err);
      }
    }
    showToast('Collection centre removed from system', 'info');
  };

  const deleteRequest = async (requestId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    if (isSupabaseConfigured()) {
      try {
        await deleteRequestFromDB(requestId);
      } catch (err) {
        console.warn('Failed to delete request from Supabase:', err);
      }
    }
    showToast(`Request ${requestId} deleted`, 'info');
  };

  const clearAllData = async () => {
    setCentres([]);
    setRequests([]);
    setActivityHistory([]);
    localStorage.removeItem(STORAGE_KEY_CENTRES);
    localStorage.removeItem(STORAGE_KEY_REQUESTS);
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    showToast('All real-time database tables cleared', 'info');
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
        updateCentre,
        updateRequestStatus,
        reviewCentre,
        deleteCentre,
        deleteRequest,
        clearAllData,
        // Supabase Status & Sync
        isSupabaseConfigured: hasConfiguredSupabase,
        isSupabaseConnected,
        isDatabaseLoading,
        databaseError,
        syncToSupabase,
        reloadFromDatabase,
        // UI
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
