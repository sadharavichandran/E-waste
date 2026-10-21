/**
 * EcoLoop MongoDB Backend Service & WebSocket Realtime Client
 * Replaces Supabase Client & Service with direct Node.js Express + MongoDB Atlas/Local connection.
 */

import { CollectionCentre, PickupRequest, ActivityHistoryItem, RequestStatus, UserRole } from '../types';

const API_BASE = '/api';

// Helper for fetch requests with credentials
const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Include HttpOnly cookies
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: any = new Error(data.error || data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.code = data.code;
    throw error;
  }

  return data;
};

// ==========================================
// 1. Database Status & Health
// ==========================================
export interface MongoStatusResult {
  success: boolean;
  isConnected: boolean;
  dbName: string;
  host: string;
  latencyMs: number;
  counts: {
    users: number;
    centres: number;
    requests: number;
    activities: number;
  };
  error?: string | null;
  message: string;
}

export const testMongoConnection = async (): Promise<MongoStatusResult> => {
  try {
    const data = await fetchApi('/system/status');
    const isConn = data.status?.isConnected || false;
    return {
      success: isConn,
      isConnected: isConn,
      dbName: data.status?.dbName || 'ecoloop',
      host: data.status?.host || 'MongoDB',
      latencyMs: data.status?.latencyMs || 0,
      counts: data.counts || { users: 0, centres: 0, requests: 0, activities: 0 },
      error: data.status?.error || null,
      message: isConn
        ? `Connected to MongoDB (${data.status?.dbName}) in ${data.status?.latencyMs || 0}ms`
        : 'MongoDB connection offline. Verify MONGODB_URI.',
    };
  } catch (err: any) {
    return {
      success: false,
      isConnected: false,
      dbName: 'ecoloop',
      host: 'unknown',
      latencyMs: -1,
      counts: { users: 0, centres: 0, requests: 0, activities: 0 },
      error: err.message,
      message: `Failed to reach EcoLoop API server: ${err.message}`,
    };
  }
};

// ==========================================
// 2. Collection Centres API
// ==========================================
export const fetchCentresFromDB = async (): Promise<CollectionCentre[]> => {
  const result = await fetchApi('/centres');
  return result.data || [];
};

export const upsertCentreInDB = async (centre: CollectionCentre): Promise<CollectionCentre> => {
  const existing = await fetchApi(`/centres/${centre.id}`).catch(() => null);

  if (existing && existing.data) {
    const updated = await fetchApi(`/centres/${centre.id}`, {
      method: 'PUT',
      body: JSON.stringify(centre),
    });
    return updated.data;
  } else {
    const created = await fetchApi('/centres', {
      method: 'POST',
      body: JSON.stringify(centre),
    });
    return created.data;
  }
};

export const reviewCentreInDB = async (
  centreId: string,
  decision: 'approved' | 'rejected',
  notes?: string
): Promise<CollectionCentre> => {
  const result = await fetchApi(`/centres/${centreId}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision, notes }),
  });
  return result.data;
};

export const deleteCentreFromDB = async (centreId: string): Promise<void> => {
  await fetchApi(`/centres/${centreId}`, {
    method: 'DELETE',
  });
};

// ==========================================
// 3. Pickup Requests API
// ==========================================
export const fetchRequestsFromDB = async (): Promise<PickupRequest[]> => {
  const result = await fetchApi('/requests');
  return result.data || [];
};

export const upsertRequestInDB = async (req: PickupRequest): Promise<PickupRequest> => {
  const existing = await fetchApi(`/requests/${req.id}`).catch(() => null);

  if (existing && existing.data) {
    const updated = await fetchApi(`/requests/${req.id}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        status: req.status,
        note: req.statusHistory?.[req.statusHistory.length - 1]?.note || 'Updated',
        assignedCentreId: (req as any).assignedCentreId,
      }),
    });
    return updated.data;
  } else {
    const created = await fetchApi('/requests', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    return created.data;
  }
};

export const updateRequestStatusInDB = async (
  id: string,
  status: RequestStatus,
  note?: string,
  assignedCentreId?: string
): Promise<{ request: PickupRequest; activity?: ActivityHistoryItem }> => {
  const result = await fetchApi(`/requests/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, note, assignedCentreId }),
  });
  return { request: result.data, activity: result.activity };
};

export const deleteRequestFromDB = async (id: string): Promise<void> => {
  await fetchApi(`/requests/${id}`, {
    method: 'DELETE',
  });
};

// ==========================================
// 4. Activity History API
// ==========================================
export const fetchActivityHistoryFromDB = async (): Promise<ActivityHistoryItem[]> => {
  const result = await fetchApi('/activities');
  return result.data || [];
};

export const insertActivityInDB = async (activity: ActivityHistoryItem): Promise<ActivityHistoryItem> => {
  const result = await fetchApi('/activities', {
    method: 'POST',
    body: JSON.stringify(activity),
  });
  return result.data;
};

// ==========================================
// 5. Authentication API
// ==========================================
export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
  city?: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
}

export const apiRegister = async (payload: {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  facilityName?: string;
  city?: string;
}): Promise<{ user: AuthUserResponse; centre?: CollectionCentre; requiresEmailVerification: boolean }> => {
  const res = await fetchApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res;
};

export const apiLogin = async (payload: {
  email: string;
  password: string;
  requiredRole?: UserRole;
}): Promise<{ user: AuthUserResponse; centre?: CollectionCentre }> => {
  const res = await fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res;
};

export const apiGetMe = async (): Promise<{ authenticated: boolean; user: AuthUserResponse | null; centre?: CollectionCentre }> => {
  return fetchApi('/auth/me');
};

export const apiLogout = async (): Promise<void> => {
  await fetchApi('/auth/logout', { method: 'POST' });
};

export const apiForgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
  return fetchApi('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const apiResetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  return fetchApi('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
};

// ==========================================
// 6. Data Migration & Empty State Sync
// ==========================================
export const importDataToMongoDB = async (
  centres: CollectionCentre[],
  requests: PickupRequest[],
  history: ActivityHistoryItem[]
) => {
  return fetchApi('/system/import-from-supabase', {
    method: 'POST',
    body: JSON.stringify({ centres, requests, history }),
  });
};

export const clearDatabaseInMongoDB = async () => {
  return fetchApi('/system/clear-all', {
    method: 'POST',
  });
};

// ==========================================
// 7. Real-Time WebSocket Client
// Subscribes to live database events broadcast by the Express server
// ==========================================
export const subscribeToMongoRealtime = (
  onCentresChange: () => void,
  onRequestsChange: () => void,
  onActivitiesChange: () => void
): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // Use current host (proxied via Vite /ws) or localhost:5001
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  let ws: WebSocket | null = null;
  let isClosedIntentionally = false;
  let reconnectTimeout: any = null;

  const connect = () => {
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // Send initial ping
        ws?.send(JSON.stringify({ type: 'PING' }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const type = data.type;

          if (
            type === 'CENTRE_CREATED' ||
            type === 'CENTRE_UPDATED' ||
            type === 'CENTRE_DELETED' ||
            type === 'CENTRE_REVIEWED'
          ) {
            onCentresChange();
          } else if (
            type === 'REQUEST_CREATED' ||
            type === 'REQUEST_UPDATED' ||
            type === 'REQUEST_DELETED'
          ) {
            onRequestsChange();
          } else if (type === 'ACTIVITY_CREATED') {
            onActivitiesChange();
          } else if (type === 'DB_SYNCED') {
            onCentresChange();
            onRequestsChange();
            onActivitiesChange();
          }
        } catch (e) {
          // Ignore
        }
      };

      ws.onclose = () => {
        if (!isClosedIntentionally) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws?.close();
      };
    } catch (e) {
      if (!isClosedIntentionally) {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }
  };

  connect();

  return () => {
    isClosedIntentionally = true;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (ws) ws.close();
  };
};

// ==========================================
// 8. Audit Log & Compatibility Helpers
// ==========================================
export interface AuditLogEntry {
  id: string;
  requestId: string;
  status: string;
  note?: string;
  updatedBy?: string;
  timestamp: string;
}

export const fetchStatusAuditHistory = async (requestId?: string): Promise<AuditLogEntry[]> => {
  try {
    const requests = await fetchRequestsFromDB();
    const entries: AuditLogEntry[] = [];

    for (const r of requests) {
      if (requestId && r.id !== requestId) continue;
      if (Array.isArray(r.statusHistory)) {
        for (const sh of r.statusHistory) {
          entries.push({
            id: `${r.id}-${sh.timestamp}-${sh.status}`,
            requestId: r.id,
            status: sh.status,
            note: sh.note,
            updatedBy: sh.updatedBy,
            timestamp: typeof sh.timestamp === 'string' ? sh.timestamp : new Date(sh.timestamp).toISOString(),
          });
        }
      }
    }

    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (e) {
    console.warn('Error assembling status audit history from MongoDB:', e);
    return [];
  }
};

// Aliases for seamless drop-in compatibility across existing admin components
export const subscribeToDatabaseChanges = subscribeToMongoRealtime;
export const testSupabaseConnection = testMongoConnection;

