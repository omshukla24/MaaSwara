// =============================================================================
// MaaSwara — Shared Gemini Client
// =============================================================================

import { GoogleGenAI } from '@google/genai';

/**
 * Shared GoogleGenAI client instance.
 * Uses the API key from environment variables.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      '[MaaSwara] GEMINI_API_KEY is not set. ' +
        'Get a free key from https://aistudio.google.com/apikey'
    );
  }

  return new GoogleGenAI({ apiKey });
}
