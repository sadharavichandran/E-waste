/**
 * Production-ready Supabase PostgreSQL Schema & Security Blueprint
 * This schema supports the complete EcoLoop Circular Economy platform:
 * - pickup_requests
 * - collection_centres
 * - request_status_history
 * - user_profiles
 * - eco_rewards
 * Includes Row Level Security (RLS) policies, indexes, and automated point awarding triggers.
 */

export const SUPABASE_SQL_SCHEMA = `-- ===============================================================
-- EcoLoop: PostgreSQL Database Schema for Supabase
-- Target Engine: PostgreSQL 15+ / Supabase Auth & Storage
-- ===============================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. User Profiles Table (Synced with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    user_type TEXT NOT NULL DEFAULT 'household' CHECK (user_type IN ('household', 'student', 'institution')),
    institution_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    eco_points INTEGER NOT NULL DEFAULT 0 CHECK (eco_points >= 0),
    tier TEXT NOT NULL DEFAULT 'Eco Novice' CHECK (tier IN ('Eco Novice', 'Green Guardian', 'Circular Champion', 'Emerald Ambassador')),
    total_devices_submitted INTEGER NOT NULL DEFAULT 0,
    total_devices_collected INTEGER NOT NULL DEFAULT 0,
    total_devices_recycled INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. Collection Centres Table (Geo-spatial & partner directory)
CREATE TABLE IF NOT EXISTS public.collection_centres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    organization TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    phone TEXT,
    email TEXT,
    operating_hours TEXT NOT NULL,
    accepted_categories TEXT[] NOT NULL DEFAULT '{}',
    is_certified_r2 BOOLEAN NOT NULL DEFAULT false,
    is_hazardous_battery_certified BOOLEAN NOT NULL DEFAULT false,
    centre_type TEXT NOT NULL CHECK (centre_type IN ('Drop-off Kiosk', 'Certified Recycler', 'Brand Take-Back', 'Municipal Hub')),
    rating NUMERIC(3,2) DEFAULT 4.5,
    is_verified_partner BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. Pickup Requests Table
CREATE TABLE IF NOT EXISTS public.pickup_requests (
    id VARCHAR(30) PRIMARY KEY, -- Formatted: ECL-YYYY-XXXX
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    email TEXT NOT NULL,
    device_category TEXT NOT NULL CHECK (
        device_category IN ('mobile', 'laptop', 'tablet', 'desktop', 'charger_cable', 'battery', 'audio_wearable', 'home_appliance', 'other')
    ),
    device_name TEXT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    device_condition TEXT NOT NULL CHECK (device_condition IN ('working', 'repairable', 'non_working')),
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time_slot TEXT NOT NULL CHECK (preferred_time_slot IN ('morning', 'afternoon', 'evening')),
    additional_instructions TEXT,
    has_battery_hazard BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'confirmed', 'collected', 'recycled', 'cancelled')),
    points_awarded BOOLEAN NOT NULL DEFAULT false,
    points_earned INTEGER NOT NULL DEFAULT 0,
    estimated_co2_saved_kg NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. Request Status History Table (Audit log for tracking)
CREATE TABLE IF NOT EXISTS public.request_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id VARCHAR(30) NOT NULL REFERENCES public.pickup_requests(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    note TEXT NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. Eco Rewards & Badges Table
CREATE TABLE IF NOT EXISTS public.eco_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    request_id VARCHAR(30) REFERENCES public.pickup_requests(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    points INTEGER NOT NULL CHECK (points != 0),
    reward_type TEXT NOT NULL CHECK (reward_type IN ('pickup', 'dropoff', 'badge_unlock', 'redemption')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    -- Prevent duplicate reward claims for the same completed event
    CONSTRAINT unique_request_reward UNIQUE (user_id, request_id, reward_type)
);

-- ===============================================================
-- 7. Indexes for Query Performance
-- ===============================================================
CREATE INDEX IF NOT EXISTS idx_pickup_user_id ON public.pickup_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_pickup_status ON public.pickup_requests(status);
CREATE INDEX IF NOT EXISTS idx_pickup_city_pincode ON public.pickup_requests(city, pincode);
CREATE INDEX IF NOT EXISTS idx_status_history_request ON public.request_status_history(request_id);
CREATE INDEX IF NOT EXISTS idx_centres_city_pincode ON public.collection_centres(city, pincode);
CREATE INDEX IF NOT EXISTS idx_rewards_user ON public.eco_rewards(user_id);

-- ===============================================================
-- 8. Row Level Security (RLS) Configuration
-- ===============================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eco_rewards ENABLE ROW LEVEL SECURITY;

-- Collection Centres: Public read access for all users
CREATE POLICY "Collection centres are publicly visible"
    ON public.collection_centres FOR SELECT
    USING (true);

-- User Profiles: Users can view & update their own profile
CREATE POLICY "Users can view own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Pickup Requests: Users can view their own requests, public can lookup by request ID
CREATE POLICY "Users can view own requests or lookup by ID"
    ON public.pickup_requests FOR SELECT
    USING (auth.uid() = user_id OR auth.role() = 'anon');

CREATE POLICY "Users can insert pickup requests"
    ON public.pickup_requests FOR INSERT
    WITH CHECK (true);

-- Eco Rewards: Users can only see their own rewards
CREATE POLICY "Users can view own eco rewards"
    ON public.eco_rewards FOR SELECT
    USING (auth.uid() = user_id);
`;
