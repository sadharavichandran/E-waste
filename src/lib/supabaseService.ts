import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { CollectionCentre, PickupRequest, ActivityHistoryItem, RequestStatus } from '../types';

/**
 * Transform CollectionCentre from Frontend model to Supabase DB row format
 */
export const centreToDbRow = (c: CollectionCentre) => ({
  id: c.id,
  name: c.name,
  organization: c.organization,
  address: c.address,
  city: c.city,
  pincode: c.pincode,
  lat: c.lat,
  lng: c.lng,
  phone: c.phone || '',
  email: c.email || '',
  operating_hours: c.operatingHours || '9:00 AM - 6:00 PM',
  accepted_categories: c.acceptedCategories || [],
  is_certified_r2: !!c.isCertifiedR2,
  is_hazardous_battery_certified: !!c.isHazardousBatteryCertified,
  centre_type: c.centreType || 'Certified Recycler',
  license_number: c.licenseNumber || '',
  approval_status: c.approvalStatus || 'pending',
  submitted_by_admin_id: c.submittedByAdminId || null,
  submitted_by_admin_name: c.submittedByAdminName || null,
  submitted_at: c.submittedAt || new Date().toISOString(),
  reviewed_by_super_admin_id: c.reviewedBySuperAdminId || null,
  reviewed_at: c.reviewedAt || null,
  verification_notes: c.verificationNotes || null,
  rating: c.rating ?? 4.8,
});

/**
 * Transform DB row to CollectionCentre Frontend model
 */
export const dbRowToCentre = (row: any): CollectionCentre => ({
  id: row.id,
  name: row.name,
  organization: row.organization,
  address: row.address,
  city: row.city,
  pincode: row.pincode,
  lat: typeof row.lat === 'number' ? row.lat : parseFloat(row.lat || '0'),
  lng: typeof row.lng === 'number' ? row.lng : parseFloat(row.lng || '0'),
  phone: row.phone || '',
  email: row.email || '',
  operatingHours: row.operating_hours || '9:00 AM - 6:00 PM',
  acceptedCategories: Array.isArray(row.accepted_categories) ? row.accepted_categories : [],
  isCertifiedR2: !!row.is_certified_r2,
  isHazardousBatteryCertified: !!row.is_hazardous_battery_certified,
  centreType: row.centre_type || 'Certified Recycler',
  licenseNumber: row.license_number || '',
  approvalStatus: row.approval_status || 'pending',
  submittedByAdminId: row.submitted_by_admin_id || '',
  submittedByAdminName: row.submitted_by_admin_name || '',
  submittedAt: row.submitted_at || new Date().toISOString(),
  reviewedBySuperAdminId: row.reviewed_by_super_admin_id,
  reviewedAt: row.reviewed_at,
  verificationNotes: row.verification_notes,
  rating: typeof row.rating === 'number' ? row.rating : 4.8,
});

/**
 * Transform PickupRequest to DB row format
 */
export const requestToDbRow = (r: PickupRequest) => ({
  id: r.id,
  user_id: r.userId || null,
  user_name: r.userName,
  contact_number: r.contactNumber,
  email: r.email,
  category: r.category,
  device_name: r.deviceName || null,
  quantity: r.quantity || 1,
  condition: r.condition || 'working',
  address: r.address,
  city: r.city,
  pincode: r.pincode,
  preferred_date: r.preferredDate,
  preferred_time_slot: r.preferredTimeSlot || 'morning',
  additional_instructions: r.additionalInstructions || null,
  has_battery_hazard: !!r.hasBatteryHazard,
  status: r.status || 'submitted',
  points_awarded: !!r.pointsAwarded,
  points_earned: r.pointsEarned || 0,
  estimated_co2_saved_kg: r.estimatedCo2SavedKg || 0,
  status_history: r.statusHistory || [],
  submitted_at: r.submittedAt || new Date().toISOString(),
});

/**
 * Transform DB row to PickupRequest Frontend model
 */
export const dbRowToRequest = (row: any): PickupRequest => {
  let statusHistory = [];
  try {
    if (typeof row.status_history === 'string') {
      statusHistory = JSON.parse(row.status_history);
    } else if (Array.isArray(row.status_history)) {
      statusHistory = row.status_history;
    }
  } catch (e) {
    statusHistory = [];
  }

  return {
    id: row.id,
    userId: row.user_id || undefined,
    userName: row.user_name,
    contactNumber: row.contact_number,
    email: row.email,
    category: row.category,
    deviceName: row.device_name || undefined,
    quantity: row.quantity || 1,
    condition: row.condition || 'working',
    address: row.address,
    city: row.city,
    pincode: row.pincode,
    preferredDate: row.preferred_date ? row.preferred_date.split('T')[0] : '',
    preferredTimeSlot: row.preferred_time_slot || 'morning',
    additionalInstructions: row.additional_instructions || undefined,
    hasBatteryHazard: !!row.has_battery_hazard,
    status: row.status || 'submitted',
    submittedAt: row.submitted_at || new Date().toISOString(),
    statusHistory: statusHistory.length > 0 ? statusHistory : [
      {
        status: (row.status || 'submitted') as RequestStatus,
        timestamp: row.submitted_at || new Date().toISOString(),
        note: 'Pickup request recorded in database',
        updatedBy: row.user_name || 'System',
      },
    ],
    pointsAwarded: !!row.points_awarded,
    pointsEarned: row.points_earned || 0,
    estimatedCo2SavedKg: typeof row.estimated_co2_saved_kg === 'number'
      ? row.estimated_co2_saved_kg
      : parseFloat(row.estimated_co2_saved_kg || '0'),
  };
};

/**
 * Transform ActivityHistoryItem to DB row format
 */
export const activityToDbRow = (a: ActivityHistoryItem) => ({
  id: a.id,
  request_id: a.requestId || null,
  title: a.title,
  description: a.description,
  date: a.date,
  points: a.points || 0,
  type: a.type || 'pickup',
});

/**
 * Transform DB row to ActivityHistoryItem
 */
export const dbRowToActivity = (row: any): ActivityHistoryItem => ({
  id: row.id,
  requestId: row.request_id || undefined,
  title: row.title,
  description: row.description,
  date: row.date || new Date().toISOString().split('T')[0],
  points: row.points || 0,
  type: row.type || 'pickup',
});

// ==========================================
// Database Operations: Collection Centres
// ==========================================

export const fetchCentresFromDB = async (): Promise<CollectionCentre[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('collection_centres')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching collection centres from Supabase:', error);
    throw error;
  }

  return (data || []).map(dbRowToCentre);
};

export const upsertCentreInDB = async (centre: CollectionCentre): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) return;

  const row = centreToDbRow(centre);
  const { error } = await client
    .from('collection_centres')
    .upsert(row, { onConflict: 'id' });

  if (error) {
    console.error(`Error saving collection centre ${centre.id} in Supabase:`, error);
    throw error;
  }
};

export const deleteCentreFromDB = async (id: string): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client
    .from('collection_centres')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting collection centre ${id} from Supabase:`, error);
    throw error;
  }
};

// ==========================================
// Database Operations: Pickup Requests
// ==========================================

export const fetchRequestsFromDB = async (): Promise<PickupRequest[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('pickup_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pickup requests from Supabase:', error);
    throw error;
  }

  return (data || []).map(dbRowToRequest);
};

export const upsertRequestInDB = async (req: PickupRequest): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) return;

  const row = requestToDbRow(req);
  const { error } = await client
    .from('pickup_requests')
    .upsert(row, { onConflict: 'id' });

  if (error) {
    console.error(`Error saving pickup request ${req.id} in Supabase:`, error);
    throw error;
  }
};

export const deleteRequestFromDB = async (id: string): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client
    .from('pickup_requests')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting pickup request ${id} from Supabase:`, error);
    throw error;
  }
};

// ==========================================
// Database Operations: Activity History
// ==========================================

export const fetchActivityHistoryFromDB = async (): Promise<ActivityHistoryItem[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('activity_history')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching activity history from Supabase:', error);
    throw error;
  }

  return (data || []).map(dbRowToActivity);
};

export const insertActivityInDB = async (item: ActivityHistoryItem): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) return;

  const row = activityToDbRow(item);
  const { error } = await client
    .from('activity_history')
    .upsert(row, { onConflict: 'id' });

  if (error) {
    console.error('Error inserting activity history in Supabase:', error);
    throw error;
  }
};

// ==========================================
// Database Operations: Request Status History
// ==========================================

export const logRequestStatusAudit = async (
  requestId: string,
  newStatus: RequestStatus,
  note: string,
  updatedBy: string
): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('request_status_history').insert({
      request_id: requestId,
      status: newStatus,
      note,
      updated_by: updatedBy,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Could not write to request_status_history audit table:', err);
  }
};

export interface AuditLogEntry {
  id: string;
  requestId: string;
  status: string;
  note?: string;
  updatedBy?: string;
  timestamp: string;
}

export const fetchStatusAuditHistory = async (requestId?: string): Promise<AuditLogEntry[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    let query = client
      .from('request_status_history')
      .select('*')
      .order('timestamp', { ascending: false });

    if (requestId) {
      query = query.eq('request_id', requestId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching request_status_history:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      requestId: row.request_id,
      status: row.status,
      note: row.note,
      updatedBy: row.updated_by,
      timestamp: row.timestamp,
    }));
  } catch (err) {
    console.warn('Failed to query request_status_history:', err);
    return [];
  }
};

// ==========================================
// Connection Test & Diagnostics
// ==========================================

export interface ConnectionTestResult {
  success: boolean;
  latencyMs: number;
  message: string;
  error?: string;
  tables: {
    [key: string]: {
      accessible: boolean;
      count?: number;
      error?: string;
    };
  };
}

export const testSupabaseConnection = async (): Promise<ConnectionTestResult> => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      latencyMs: 0,
      message: 'Supabase credentials are not configured yet.',
      error: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY',
      tables: {},
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      latencyMs: 0,
      message: 'Supabase client could not be initialized.',
      error: 'Invalid URL or Anon Key',
      tables: {},
    };
  }

  const startTime = Date.now();
  const tables: ConnectionTestResult['tables'] = {};

  // Test collection_centres table
  try {
    const { count, error } = await client
      .from('collection_centres')
      .select('*', { count: 'exact', head: true });

    if (error) {
      tables['collection_centres'] = { accessible: false, error: error.message };
    } else {
      tables['collection_centres'] = { accessible: true, count: count ?? 0 };
    }
  } catch (err: any) {
    tables['collection_centres'] = { accessible: false, error: err.message };
  }

  // Test pickup_requests table
  try {
    const { count, error } = await client
      .from('pickup_requests')
      .select('*', { count: 'exact', head: true });

    if (error) {
      tables['pickup_requests'] = { accessible: false, error: error.message };
    } else {
      tables['pickup_requests'] = { accessible: true, count: count ?? 0 };
    }
  } catch (err: any) {
    tables['pickup_requests'] = { accessible: false, error: err.message };
  }

  // Test activity_history table
  try {
    const { count, error } = await client
      .from('activity_history')
      .select('*', { count: 'exact', head: true });

    if (error) {
      tables['activity_history'] = { accessible: false, error: error.message };
    } else {
      tables['activity_history'] = { accessible: true, count: count ?? 0 };
    }
  } catch (err: any) {
    tables['activity_history'] = { accessible: false, error: err.message };
  }

  const latencyMs = Date.now() - startTime;
  const anyAccessible = Object.values(tables).some((t) => t.accessible);

  if (anyAccessible) {
    return {
      success: true,
      latencyMs,
      message: `Successfully connected to Supabase PostgreSQL in ${latencyMs}ms!`,
      tables,
    };
  } else {
    const firstErr = Object.values(tables).find((t) => t.error)?.error || 'Table access failed. Ensure schema has been run.';
    return {
      success: false,
      latencyMs,
      message: 'Connected to Supabase endpoint, but tables do not exist yet. Please execute the SQL Schema in Supabase SQL Editor.',
      error: firstErr,
      tables,
    };
  }
};

// ==========================================
// 1-Click Sync Local State to Supabase DB
// ==========================================

export const syncAllDataToSupabase = async (
  centres: CollectionCentre[],
  requests: PickupRequest[],
  history: ActivityHistoryItem[]
): Promise<{ centresCount: number; requestsCount: number; historyCount: number }> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured');

  let centresCount = 0;
  let requestsCount = 0;
  let historyCount = 0;

  // 1. Sync Centres
  if (centres.length > 0) {
    const centreRows = centres.map(centreToDbRow);
    const { error } = await client.from('collection_centres').upsert(centreRows, { onConflict: 'id' });
    if (error) throw new Error(`Centres sync failed: ${error.message}`);
    centresCount = centreRows.length;
  }

  // 2. Sync Requests
  if (requests.length > 0) {
    const requestRows = requests.map(requestToDbRow);
    const { error } = await client.from('pickup_requests').upsert(requestRows, { onConflict: 'id' });
    if (error) throw new Error(`Requests sync failed: ${error.message}`);
    requestsCount = requestRows.length;
  }

  // 3. Sync Activity History
  if (history.length > 0) {
    const historyRows = history.map(activityToDbRow);
    const { error } = await client.from('activity_history').upsert(historyRows, { onConflict: 'id' });
    if (error) throw new Error(`History sync failed: ${error.message}`);
    historyCount = historyRows.length;
  }

  return { centresCount, requestsCount, historyCount };
};

// ==========================================
// Real-Time Postgres Replication Channel
// ==========================================

export const subscribeToDatabaseChanges = (
  onCentresChange: () => void,
  onRequestsChange: () => void,
  onActivityChange: () => void
) => {
  const client = getSupabaseClient();
  if (!client) return () => {};

  try {
    const channel = client
      .channel('ecoloop_realtime_db')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'collection_centres' },
        () => {
          onCentresChange();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pickup_requests' },
        () => {
          onRequestsChange();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activity_history' },
        () => {
          onActivityChange();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (e) {
    console.warn('Realtime subscription error:', e);
    return () => {};
  }
};
