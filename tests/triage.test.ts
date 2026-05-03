// =============================================================================
// MaaSwara — Triage Classification Tests
// Tests for parsing Gemini responses and applying deterministic overrides
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  parseTriageResponse,
  applyDeterministicOverride,
  extractReplyText,
  buildTranscript,
} from '@/lib/triage/classify';

describe('parseTriageResponse', () => {
  it('parses a valid JSON block from a Gemini response', () => {
    const response = `Behen, aap theek hain. Thodi thakaan hona normal hai.

\`\`\`json
{
  "severity": "GREEN",
  "signs_detected": ["G1"],
  "language": "hi",
  "weeks_pregnant": 16,
  "needs_alert": false,
  "summary_en": "Patient reports mild fatigue. Normal first-trimester symptom."
}
\`\`\``;

    const result = parseTriageResponse(response);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('GREEN');
    expect(result!.signs_detected).toContain('G1');
    expect(result!.language).toBe('hi');
    expect(result!.weeks_pregnant).toBe(16);
    expect(result!.needs_alert).toBe(false);
  });

  it('parses a RED triage correctly', () => {
    const response = `Sister, this is serious. Please go to the nearest clinic.

\`\`\`json
{
  "severity": "RED",
  "signs_detected": ["D2"],
  "language": "en",
  "weeks_pregnant": 28,
  "needs_alert": true,
  "summary_en": "Suspected preeclampsia — severe headache with vision changes at 28 weeks."
}
\`\`\``;

    const result = parseTriageResponse(response);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('RED');
    expect(result!.signs_detected).toContain('D2');
    expect(result!.needs_alert).toBe(true);
  });

  it('returns null for response with no JSON block', () => {
    const response = 'Hello sister, how are you feeling today?';
    const result = parseTriageResponse(response);
    expect(result).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    const response = '```json\n{ invalid json }\n```';
    const result = parseTriageResponse(response);
    expect(result).toBeNull();
  });

  it('returns null for invalid severity value', () => {
    const response = '```json\n{ "severity": "PURPLE" }\n```';
    const result = parseTriageResponse(response);
    expect(result).toBeNull();
  });

  it('forces needs_alert=true when severity is RED regardless of model output', () => {
    const response = `\`\`\`json
{
  "severity": "RED",
  "signs_detected": ["D1"],
  "language": "en",
  "weeks_pregnant": null,
  "needs_alert": false,
  "summary_en": "Bleeding detected"
}
\`\`\``;

    const result = parseTriageResponse(response);
    expect(result).not.toBeNull();
    expect(result!.needs_alert).toBe(true);
  });

  it('filters invalid sign IDs', () => {
    const response = `\`\`\`json
{
  "severity": "GREEN",
  "signs_detected": ["G1", "INVALID", "D99"],
  "language": "en",
  "weeks_pregnant": null,
  "needs_alert": false,
  "summary_en": "Test"
}
\`\`\``;

    const result = parseTriageResponse(response);
    expect(result).not.toBeNull();
    expect(result!.signs_detected).toEqual(['G1']);
  });
});

describe('applyDeterministicOverride', () => {
  it('overrides GREEN to RED when transcript contains danger keywords', () => {
    const greenResult = {
      severity: 'GREEN' as const,
      signs_detected: [],
      language: 'en' as const,
      weeks_pregnant: null,
      needs_alert: false,
      summary_en: 'Patient seems fine',
    };

    const transcript = 'I have been bleeding since morning but I feel okay';
    const result = applyDeterministicOverride(greenResult, transcript);

    expect(result.severity).toBe('RED');
    expect(result.needs_alert).toBe(true);
    expect(result.summary_en).toContain('SAFETY OVERRIDE');
  });

  it('does NOT downgrade RED to GREEN', () => {
    const redResult = {
      severity: 'RED' as const,
      signs_detected: ['D1' as const],
      language: 'en' as const,
      weeks_pregnant: 28,
      needs_alert: true,
      summary_en: 'Bleeding detected',
    };

    const transcript = 'I feel okay now';
    const result = applyDeterministicOverride(redResult, transcript);

    expect(result.severity).toBe('RED');
    expect(result.needs_alert).toBe(true);
  });

  it('creates a default GREEN result when Gemini returns null', () => {
    const transcript = 'I feel fine today, just a little tired';
    const result = applyDeterministicOverride(null, transcript);

    expect(result.severity).toBe('GREEN');
    expect(result.needs_alert).toBe(false);
  });

  it('overrides null Gemini result to RED when keywords detected', () => {
    const transcript = 'I am bleeding heavily';
    const result = applyDeterministicOverride(null, transcript);

    expect(result.severity).toBe('RED');
    expect(result.needs_alert).toBe(true);
  });

  it('overrides GREEN to RED on Hindi keywords', () => {
    const greenResult = {
      severity: 'GREEN' as const,
      signs_detected: [],
      language: 'hi' as const,
      weeks_pregnant: null,
      needs_alert: false,
      summary_en: 'Normal',
    };

    const transcript = 'मुझे खून आ रहा है';
    const result = applyDeterministicOverride(greenResult, transcript);

    expect(result.severity).toBe('RED');
  });
});

describe('extractReplyText', () => {
  it('removes JSON block from response', () => {
    const response = `Hello sister, how are you?

\`\`\`json
{ "severity": "GREEN" }
\`\`\``;

    const reply = extractReplyText(response);
    expect(reply).toBe('Hello sister, how are you?');
    expect(reply).not.toContain('json');
    expect(reply).not.toContain('severity');
  });

  it('returns full text when no JSON block present', () => {
    const response = 'Hello, how are you?';
    const reply = extractReplyText(response);
    expect(reply).toBe('Hello, how are you?');
  });
});

describe('buildTranscript', () => {
  it('concatenates all message contents', () => {
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
      { role: 'user', content: 'I feel pain' },
    ];

    const transcript = buildTranscript(messages);
    expect(transcript).toBe('Hello Hi there I feel pain');
  });
});
