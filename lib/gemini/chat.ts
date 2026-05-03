// =============================================================================
// MaaSwara — AI #2: Gemini 2.5 Flash (Web Chat)
// Spec: §3.2 — AI Integration #2
//
// This is the text-based triage model for the web /chat page.
// It uses Gemini 2.5 Flash for fast multilingual text dialog
// with structured output (JSON triage blocks).
// =============================================================================

import { getGeminiClient } from './client';
import { SYSTEM_PROMPT } from '@/lib/triage/system-prompt';
import {
  parseTriageResponse,
  applyDeterministicOverride,
  extractReplyText,
  buildTranscript,
} from '@/lib/triage/classify';
import { ChatMessage, TriageResult } from '@/lib/types';

/**
 * The model ID for web chat.
 * Using Gemini 2.5 Flash — best speed + multilingual + structured output
 * combo on the free tier.
 */
const CHAT_MODEL = 'gemini-2.5-flash';

/**
 * Run a triage chat turn using Gemini 2.5 Flash.
 *
 * Takes the full conversation history and returns both the
 * conversational reply and the structured triage result.
 *
 * @param messages - The full conversation history
 * @returns Object with the reply text and triage result
 */
export async function triageChat(
  messages: ChatMessage[]
): Promise<{ reply: string; triage: TriageResult }> {
  const client = getGeminiClient();

  // Build the conversation for Gemini
  const contents = messages.map((msg) => ({
    role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: msg.content }],
  }));

  // Call Gemini 2.5 Flash
  const response = await client.models.generateContent({
    model: CHAT_MODEL,
    contents,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  });

  const rawText = response.text ?? '';

  // Extract the conversational reply (without JSON block)
  const reply = extractReplyText(rawText);

  // Parse the triage JSON from Gemini's response
  const parsedTriage = parseTriageResponse(rawText);

  // Build full transcript for safety check
  const fullTranscript = buildTranscript([
    ...messages.map((m) => ({ role: m.role, content: m.content })),
    { role: 'assistant', content: rawText },
  ]);

  // ⚠️ Apply deterministic safety override (Flag #1)
  const finalTriage = applyDeterministicOverride(parsedTriage, fullTranscript);

  return {
    reply,
    triage: finalTriage,
  };
}
