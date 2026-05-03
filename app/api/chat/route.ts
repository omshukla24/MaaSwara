// =============================================================================
// MaaSwara — Chat API Route
// POST /api/chat
//
// Receives chat messages from the web chat UI, runs triage through
// Gemini 2.5 Flash, and returns the response + triage result.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { triageChat } from '@/lib/gemini/chat';
import { ChatRequest, ChatResponse } from '@/lib/types';
import { findNearestClinic } from '@/lib/triage/clinic-match';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Run triage chat
    const { reply, triage } = await triageChat(body.messages);

    // If RED severity and location provided, find nearest clinic
    let nearest_clinic = undefined;
    if (triage.needs_alert && body.location) {
      nearest_clinic = (await findNearestClinic(body.location.lat, body.location.lng)) ?? undefined;
    }

    // If needs_alert, write to Supabase alerts table
    if (triage.needs_alert) {
      console.log('[MaaSwara Alert] 🚨 RED TRIAGE TRIGGERED - Saving to Supabase');
      try {
        const { getServiceSupabase } = await import('@/lib/supabase/client');
        const supabase = getServiceSupabase();
        
        // Build transcript excerpt (last 3 messages)
        const transcriptExcerpt = body.messages
          .slice(-3)
          .map((m) => `${m.role === 'user' ? 'User' : 'MaaSwara'}: ${m.content}`)
          .join('\n');

        const { error } = await supabase.from('alerts').insert([{
          severity: triage.severity,
          signs_detected: triage.signs_detected,
          language: triage.language,
          weeks_pregnant: triage.weeks_pregnant,
          summary_en: triage.summary_en,
          lat: body.location?.lat ?? null,
          lng: body.location?.lng ?? null,
          clinic_id: nearest_clinic?.id ?? null,
          clinic_name: nearest_clinic?.name ?? null,
          status: 'active',
          source: 'web-chat',
          transcript_excerpt: transcriptExcerpt,
        }]);

        if (error) {
          console.error('[MaaSwara Alert] Failed to save alert to Supabase:', error);
        } else {
          console.log('[MaaSwara Alert] Successfully saved to Supabase');
        }
      } catch (err) {
        console.error('[MaaSwara Alert] Could not write to Supabase (check env vars):', err);
      }
    }

    const response: ChatResponse = {
      reply,
      triage,
      nearest_clinic,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[MaaSwara] Chat API error:', error);

    return NextResponse.json(
      {
        error: 'An error occurred processing your message. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
