-- =============================================================================
-- MaaSwara — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================================================

-- Enable PostGIS extension for geospatial queries (distance calculation)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Partner Clinics Table
CREATE TABLE IF NOT EXISTS partner_clinics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  languages TEXT[] NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Partner Clinics
ALTER TABLE partner_clinics ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active clinics
CREATE POLICY "Public can read active clinics"
  ON partner_clinics
  FOR SELECT
  USING (active = TRUE);

-- 2. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT NOT NULL CHECK (severity IN ('GREEN', 'YELLOW', 'RED')),
  signs_detected TEXT[] DEFAULT '{}',
  language TEXT NOT NULL,
  weeks_pregnant INTEGER,
  summary_en TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  clinic_id TEXT REFERENCES partner_clinics(id),
  clinic_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  source TEXT NOT NULL CHECK (source IN ('web-chat', 'web-voice', 'telegram')),
  transcript_excerpt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Alerts
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Allow public to INSERT alerts (since patients use the app without logging in)
-- But only allow SELECT for clinic dashboard users (we'll use service role or anon read for now in the demo)
CREATE POLICY "Allow public insert to alerts"
  ON alerts
  FOR INSERT
  WITH CHECK (true);

-- For the hackathon demo, we will allow anon read access to alerts so the dashboard works without auth.
-- In production, this would be restricted to authenticated clinic users.
CREATE POLICY "Allow public read to alerts for demo"
  ON alerts
  FOR SELECT
  USING (true);

-- Realtime replication
-- We need to enable realtime for the alerts table so the dashboard can listen to inserts/updates
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;

-- Explicitly grant privileges to the service_role (fixes permission denied errors)
GRANT ALL ON partner_clinics TO service_role;
GRANT ALL ON alerts TO service_role;
