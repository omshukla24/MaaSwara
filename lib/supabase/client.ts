// =============================================================================
// MaaSwara — Supabase Client Factory
// Spec: §4.2 (Backend Architecture - Supabase)
// =============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Global cache to avoid creating multiple instances in dev
let supabaseCache: SupabaseClient | null = null;

/**
 * Get a standard, browser-safe Supabase client (using Anon key).
 * Use this for most client-side operations (like real-time subscriptions).
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseCache) {
    return supabaseCache;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      '[MaaSwara] Supabase env vars not set. Realtime features will not work.'
    );
    // Return a dummy client or throw based on preference.
    // For now, let's just initialize with dummy values if they are missing
    // so it doesn't crash the build, but it will fail on actual requests.
    return createClient(
      supabaseUrl || 'https://dummy.supabase.co',
      supabaseKey || 'dummy_key'
    );
  }

  supabaseCache = createClient(supabaseUrl, supabaseKey);
  return supabaseCache;
}

/**
 * Get a privileged Supabase client (using Service Role key).
 * DANGER: NEVER use this on the client side. ONLY in API routes or Server Actions.
 * Use this to bypass RLS when creating alerts from the chat engine.
 */
export function getServiceSupabase(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      '[MaaSwara] Missing Supabase Service Key. Check your .env file.'
    );
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
