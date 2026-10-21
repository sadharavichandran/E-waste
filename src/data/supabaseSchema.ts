/**
 * Production-ready Supabase PostgreSQL Schema & Security Blueprint
 * This schema supports the complete EcoLoop Circular Economy platform:
 * - pickup_requests (all e-waste pickup submissions)
 * - collection_centres (e-waste recycling hubs & verification status)
 * - request_status_history (detailed tracking audit log)
 * - activity_history (EcoPoints ledger & reward events)
 * - user_profiles (multi-portal accounts)
 * 
 * Includes Row Level Security (RLS) policies, indexes, and Realtime publication.
 */

export const SUPABASE_SQL_SCHEMA = `-- ===============================================================
-- EcoLoop: Complete PostgreSQL Database Schema for Supabase
-- Target Engine: PostgreSQL 14+ / Supabase
-- ===============================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===============================================================
-- 2. Collection Centres Table (Recycling hubs & Geo directory)
-- ===============================================================
CREATE TABLE IF NOT EXISTS public.collection_centres (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    organization TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    phone TEXT,
    email TEXT,
    operating_hours TEXT NOT NULL DEFAULT '9:00 AM - 6:00 PM',
    accepted_categories TEXT[] NOT NULL DEFAULT '{}',
    is_certified_r2 BOOLEAN NOT NULL DEFAULT false,
    is_hazardous_battery_certified BOOLEAN NOT NULL DEFAULT false,
    centre_type TEXT NOT NULL DEFAULT 'Certified Recycler',
    license_number TEXT DEFAULT '',
    approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    submitted_by_admin_id TEXT,
    submitted_by_admin_name TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    reviewed_by_super_admin_id TEXT,
    reviewed_at TIMESTAMPTZ,
    verification_notes TEXT,
    rating NUMERIC(3,2) DEFAULT 4.8,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ===============================================================
-- 3. Pickup Requests Table (All customer e-waste bookings)
-- ===============================================================
CREATE TABLE IF NOT EXISTS public.pickup_requests (
    id TEXT PRIMARY KEY, -- Formatted: ECL-YYYY-XXXX
    user_id TEXT,
    user_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    email TEXT NOT NULL,
    category TEXT NOT NULL,
    device_name TEXT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    condition TEXT NOT NULL DEFAULT 'working',
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time_slot TEXT NOT NULL DEFAULT 'morning',
    additional_instructions TEXT,
    has_battery_hazard BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'confirmed', 'collected', 'recycled', 'cancelled')),
    points_awarded BOOLEAN NOT NULL DEFAULT false,
    points_earned INTEGER NOT NULL DEFAULT 0,
    estimated_co2_saved_kg NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ===============================================================
-- 4. Request Status History Audit Table
-- ===============================================================
CREATE TABLE IF NOT EXISTS public.request_status_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    request_id TEXT NOT NULL REFERENCES public.pickup_requests(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    note TEXT,
    updated_by TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ===============================================================
-- 5. Activity History & EcoPoints Ledger
-- ===============================================================
CREATE TABLE IF NOT EXISTS public.activity_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    request_id TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'pickup',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ===============================================================
-- 6. User Profiles Table
-- ===============================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    organization TEXT,
    avatar_url TEXT,
    joined_date TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ===============================================================
-- 7. High-Performance Indexes
-- ===============================================================
CREATE INDEX IF NOT EXISTS idx_centres_approval ON public.collection_centres(approval_status);
CREATE INDEX IF NOT EXISTS idx_centres_city ON public.collection_centres(city);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.pickup_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_email ON public.pickup_requests(email);
CREATE INDEX IF NOT EXISTS idx_requests_user ON public.pickup_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_status_history_req ON public.request_status_history(request_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.activity_history(created_at);

-- ===============================================================
-- 8. Row Level Security (RLS) Configuration
-- ===============================================================
ALTER TABLE public.collection_centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Collection Centres: Full access for web portal operations
DROP POLICY IF EXISTS "Centres select policy" ON public.collection_centres;
CREATE POLICY "Centres select policy" ON public.collection_centres FOR SELECT USING (true);

DROP POLICY IF EXISTS "Centres insert policy" ON public.collection_centres;
CREATE POLICY "Centres insert policy" ON public.collection_centres FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Centres update policy" ON public.collection_centres;
CREATE POLICY "Centres update policy" ON public.collection_centres FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Centres delete policy" ON public.collection_centres;
CREATE POLICY "Centres delete policy" ON public.collection_centres FOR DELETE USING (true);

-- Pickup Requests: Full access for client booking and status tracking
DROP POLICY IF EXISTS "Requests select policy" ON public.pickup_requests;
CREATE POLICY "Requests select policy" ON public.pickup_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Requests insert policy" ON public.pickup_requests;
CREATE POLICY "Requests insert policy" ON public.pickup_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Requests update policy" ON public.pickup_requests;
CREATE POLICY "Requests update policy" ON public.pickup_requests FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Requests delete policy" ON public.pickup_requests;
CREATE POLICY "Requests delete policy" ON public.pickup_requests FOR DELETE USING (true);

-- Request Status History policies
DROP POLICY IF EXISTS "History select policy" ON public.request_status_history;
CREATE POLICY "History select policy" ON public.request_status_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "History insert policy" ON public.request_status_history;
CREATE POLICY "History insert policy" ON public.request_status_history FOR INSERT WITH CHECK (true);

-- Activity History policies
DROP POLICY IF EXISTS "Activity select policy" ON public.activity_history;
CREATE POLICY "Activity select policy" ON public.activity_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Activity insert policy" ON public.activity_history;
CREATE POLICY "Activity insert policy" ON public.activity_history FOR INSERT WITH CHECK (true);

-- User Profiles policies
DROP POLICY IF EXISTS "Profiles select policy" ON public.user_profiles;
CREATE POLICY "Profiles select policy" ON public.user_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profiles insert policy" ON public.user_profiles;
CREATE POLICY "Profiles insert policy" ON public.user_profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Profiles update policy" ON public.user_profiles;
CREATE POLICY "Profiles update policy" ON public.user_profiles FOR UPDATE USING (true);

-- ===============================================================
-- 9. Real-Time Replication Publication
-- ===============================================================
-- Enables Supabase Realtime broadcast for instant multi-tab updates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.collection_centres;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pickup_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_history;
`;
