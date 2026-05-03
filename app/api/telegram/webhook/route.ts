// =============================================================================
// MaaSwara — Telegram Webhook API
// POST /api/telegram/webhook
//
// Receives messages from Telegram users, runs them through the Triage Engine,
// triggers Clinic Alerts if RED, and replies back to the user.
// =============================================================================

import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram/client';
import { triageChat } from '@/lib/gemini/chat';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Ignore non-message updates (like edits, inline queries, etc.)
    if (!payload.message || !payload.message.text) {
      return NextResponse.json({ status: 'ignored' });
    }

    const chatId = payload.message.chat.id;
    const userText = payload.message.text;

    // 1. Run the message through the universal MaaSwara Triage Engine
    const { reply, triage } = await triageChat([
      { id: Date.now().toString(), role: 'user', content: userText, timestamp: Date.now() }
    ]);

    // 2. Format the response for Telegram
    let replyText = reply; // Start with the conversational reply

    if (triage.severity === 'RED') {
      replyText = `🚨 *URGENT* 🚨\n\n${replyText}\n\n*Please go to the nearest healthcare clinic immediately.* An alert has been sent to our partner clinics.`;
      
      // 3. Persist RED alert to Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('alerts').insert({
          severity: triage.severity,
          signs_detected: triage.signs_detected,
          language: triage.language,
          weeks_pregnant: triage.weeks_pregnant,
          summary_en: triage.summary_en,
          status: 'active',
          source: 'telegram',
          transcript_excerpt: userText.slice(-500)
        });
      }
    } else if (triage.severity === 'YELLOW') {
      replyText = `⚠️ *CAUTION* ⚠️\n\n${replyText}\n\n*Please consult a doctor soon.*`;
    }

    // 4. Send the reply back to the Telegram user
    await sendTelegramMessage(chatId, replyText);

    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('[Telegram Webhook] Error processing message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
