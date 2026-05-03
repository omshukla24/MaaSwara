// =============================================================================
// MaaSwara — Live Token API Route
// GET /api/live-token
//
// Fetches the Gemini API key securely from the server environment
// so the client can initialize the WebSocket connection.
// Note: In production, you would proxy the WebSocket connection or
// use a short-lived OAuth token instead of sending the raw API key.
// =============================================================================

import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('[MaaSwara] GEMINI_API_KEY is not set in environment variables');
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  return NextResponse.json({ apiKey });
}
