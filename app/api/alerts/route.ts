// =============================================================================
// MaaSwara — Alerts API Route
// GET /api/alerts - Fetch active alerts for the clinic dashboard (auth required)
// POST /api/alerts - Create a new alert (internal origin only)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { AlertRecord } from '@/lib/types';
import { cookies } from 'next/headers';

/**
 * Verify that the request comes from an authenticated clinic session.
 * Checks for the HttpOnly cookie set by the clinic login flow.
 */
async function isClinicAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('maaswara_clinic_auth');
  return authCookie?.value === 'authenticated';
}

/**
 * Verify that the request originates from our own application.
 * Checks the Origin/Referer header against our known app URL.
 */
function isInternalOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin') || '';
  const referer = request.headers.get('referer') || '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';

  const allowedOrigins = [
    appUrl,
    vercelUrl,
    'http://localhost:3000',
    'https://maa-swara.vercel.app',
  ].filter(Boolean);

  return allowedOrigins.some(
    (allowed) => origin.startsWith(allowed) || referer.startsWith(allowed)
  );
}

export async function GET(request: NextRequest) {
  try {
    // Only authenticated clinic users can read alerts
    const authed = await isClinicAuthenticated();
    if (!authed) {
      return NextResponse.json(
        { error: 'Unauthorized — clinic login required' },
        { status: 401 }
      );
    }

    const supabase = getServiceSupabase();

    // Fetch active alerts, ordered by newest first
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[MaaSwara] Error fetching alerts:', error);
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }

    return NextResponse.json({ alerts: data });
  } catch (error) {
    console.error('[MaaSwara] Alerts GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only allow alert creation from our own application pages
    if (!isInternalOrigin(request)) {
      return NextResponse.json(
        { error: 'Forbidden — alerts can only be created from the MaaSwara application' },
        { status: 403 }
      );
    }

    const body: AlertRecord = await request.json();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('alerts')
      .insert([
        {
          severity: body.severity,
          signs_detected: body.signs_detected,
          language: body.language,
          weeks_pregnant: body.weeks_pregnant,
          summary_en: body.summary_en,
          lat: body.lat,
          lng: body.lng,
          clinic_id: body.clinic_id,
          clinic_name: body.clinic_name,
          status: body.status || 'active',
          source: body.source,
          transcript_excerpt: body.transcript_excerpt,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[MaaSwara] Error creating alert:', error);
      return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
    }

    return NextResponse.json({ alert: data }, { status: 201 });
  } catch (error) {
    console.error('[MaaSwara] Alerts POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
