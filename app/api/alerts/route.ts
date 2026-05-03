// =============================================================================
// MaaSwara — Alerts API Route
// GET /api/alerts - Fetch active alerts for the clinic dashboard
// POST /api/alerts - Create a new alert
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { AlertRecord } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
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
