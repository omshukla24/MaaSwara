// =============================================================================
// MaaSwara — Triage Classification Pipeline
// Spec: §5.2, §5.4
//
// Combines LLM classification + deterministic safety net.
// This is the single function that all three channels call after
// receiving a Gemini response.
// =============================================================================

import { TriageResult, Severity, DangerSignId, SupportedLanguage } from '@/lib/types';
import { forceSeverityCheck, shouldOverride } from './severity-check';
import { getHighestSeverity } from './danger-signs';

/**
 * Extract the JSON triage block from a Gemini response.
 *
 * Gemini is instructed to include a ```json block at the end of its
 * response. This function finds and parses it.
 *
 * @param rawResponse - The full text response from Gemini
 * @returns Parsed TriageResult or null if no valid JSON found
 */
export function parseTriageResponse(rawResponse: string): TriageResult | null {
  try {
    // Try to find a ```json block
    const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/);

    if (jsonMatch && jsonMatch[1]) {
      const parsed = JSON.parse(jsonMatch[1].trim());
      return validateTriageResult(parsed);
    }

    // Fallback: try to find any JSON object with "severity" key
    const fallbackMatch = rawResponse.match(/\{[\s\S]*?"severity"\s*:\s*"(GREEN|YELLOW|RED)"[\s\S]*?\}/);
    if (fallbackMatch) {
      const parsed = JSON.parse(fallbackMatch[0]);
      return validateTriageResult(parsed);
    }

    return null;
  } catch {
    console.warn('[MaaSwara] Failed to parse triage JSON from response');
    return null;
  }
}

/**
 * Validate and normalize a parsed triage object into a proper TriageResult.
 */
function validateTriageResult(parsed: Record<string, unknown>): TriageResult | null {
  const validSeverities: Severity[] = ['GREEN', 'YELLOW', 'RED'];
  const validLanguages: SupportedLanguage[] = ['en', 'hi', 'bho', 'sw', 'yo', 'ha'];

  const severity = parsed.severity as string;
  if (!validSeverities.includes(severity as Severity)) {
    return null;
  }

  const language = (parsed.language as string) || 'en';
  const signsDetected = Array.isArray(parsed.signs_detected)
    ? (parsed.signs_detected as string[]).filter((s): s is DangerSignId =>
        ['D1','D2','D3','D4','D5','D6','D7','D8','D9','D10','G1'].includes(s)
      )
    : [];

  return {
    severity: severity as Severity,
    signs_detected: signsDetected,
    language: validLanguages.includes(language as SupportedLanguage)
      ? (language as SupportedLanguage)
      : 'en',
    weeks_pregnant:
      typeof parsed.weeks_pregnant === 'number' ? parsed.weeks_pregnant : null,
    needs_alert: parsed.needs_alert === true || severity === 'RED',
    summary_en:
      typeof parsed.summary_en === 'string'
        ? parsed.summary_en
        : 'No summary available',
  };
}

/**
 * Apply the deterministic safety override to a triage result.
 *
 * ⚠️  This is the core safety function. It takes the LLM's classification
 * and the full conversation transcript, then checks if the deterministic
 * keyword scanner detects a higher severity.
 *
 * If it does → OVERRIDE. The deterministic scanner wins.
 *
 * @param result - The triage result from Gemini (or null if parsing failed)
 * @param transcript - The full conversation text (all messages concatenated)
 * @returns The final TriageResult with any necessary severity upgrade
 */
export function applyDeterministicOverride(
  result: TriageResult | null,
  transcript: string
): TriageResult {
  // If Gemini didn't produce a valid triage result, create a default
  const baseResult: TriageResult = result ?? {
    severity: 'GREEN',
    signs_detected: [],
    language: 'en',
    weeks_pregnant: null,
    needs_alert: false,
    summary_en: 'Unable to parse triage result from model response',
  };

  // Run the deterministic safety check
  const override = forceSeverityCheck(transcript);

  if (override && shouldOverride(baseResult.severity, override.severity)) {
    console.log(
      `[MaaSwara Safety Net] ⚠️ OVERRIDING severity: ${baseResult.severity} → ${override.severity}`,
      `| Matched keywords: ${override.matched_keywords.join(', ')}`,
      `| Language: ${override.source_language}`
    );

    return {
      ...baseResult,
      severity: override.severity,
      needs_alert: override.severity === 'RED' ? true : baseResult.needs_alert,
      summary_en: baseResult.summary_en + ` [SAFETY OVERRIDE: ${override.matched_keywords.join(', ')}]`,
    };
  }

  // Also cross-check: if signs_detected contain RED signs but severity is not RED
  if (baseResult.signs_detected.length > 0) {
    const signsSeverity = getHighestSeverity(baseResult.signs_detected);
    if (shouldOverride(baseResult.severity, signsSeverity)) {
      console.log(
        `[MaaSwara Safety Net] ⚠️ Sign-based override: ${baseResult.severity} → ${signsSeverity}`,
        `| Signs: ${baseResult.signs_detected.join(', ')}`
      );
      return {
        ...baseResult,
        severity: signsSeverity,
        needs_alert: signsSeverity === 'RED' ? true : baseResult.needs_alert,
      };
    }
  }

  return baseResult;
}

/**
 * Extract just the conversational reply from Gemini's response,
 * stripping out the JSON triage block.
 */
export function extractReplyText(rawResponse: string): string {
  // Remove the ```json block
  return rawResponse
    .replace(/```json\s*[\s\S]*?\s*```/g, '')
    .trim();
}

/**
 * Build a full transcript string from a list of messages.
 * Used as input for the deterministic severity check.
 */
export function buildTranscript(
  messages: { role: string; content: string }[]
): string {
  return messages.map((m) => m.content).join(' ');
}
