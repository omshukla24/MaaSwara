// =============================================================================
// MaaSwara — Shared TypeScript Types
// =============================================================================

/** Supported language codes */
export type SupportedLanguage = 'en' | 'hi' | 'bho' | 'sw' | 'yo' | 'ha';

/** Triage severity levels */
export type Severity = 'GREEN' | 'YELLOW' | 'RED';

/** WHO danger-sign IDs */
export type DangerSignId =
  | 'D1' | 'D2' | 'D3' | 'D4' | 'D5'
  | 'D6' | 'D7' | 'D8' | 'D9' | 'D10'
  | 'G1';

/** A single WHO danger sign definition */
export interface DangerSign {
  id: DangerSignId;
  name: string;
  description: string;
  severity: Severity;
  action: string;
}

/**
 * Structured triage result emitted by Gemini and validated/overridden
 * by our deterministic safety net.
 */
export interface TriageResult {
  severity: Severity;
  signs_detected: DangerSignId[];
  language: SupportedLanguage;
  weeks_pregnant: number | null;
  needs_alert: boolean;
  summary_en: string;
}

/** Severity override result from the deterministic keyword scanner */
export interface SeverityOverride {
  forced: boolean;
  severity: Severity;
  matched_keywords: string[];
  source_language: SupportedLanguage;
}

/** A single message in a chat conversation */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  triage?: TriageResult;
}

/** An alert record stored in Supabase */
export interface AlertRecord {
  id?: string;
  severity: Severity;
  signs_detected: DangerSignId[];
  language: SupportedLanguage;
  weeks_pregnant: number | null;
  summary_en: string;
  lat: number | null;
  lng: number | null;
  clinic_id: string | null;
  clinic_name: string | null;
  status: 'active' | 'acknowledged' | 'resolved';
  source: 'web-chat' | 'web-voice' | 'telegram';
  transcript_excerpt: string;
  created_at?: string;
}

/** A partner clinic entry */
export interface PartnerClinic {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  languages: SupportedLanguage[];
  active: boolean;
  distance_km?: number;
}

/** API request body for /api/chat */
export interface ChatRequest {
  messages: ChatMessage[];
  location?: {
    lat: number;
    lng: number;
  };
}

/** API response from /api/chat */
export interface ChatResponse {
  reply: string;
  triage: TriageResult | null;
  nearest_clinic?: PartnerClinic;
}

/** Language display info for the UI */
export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

/** All supported languages with display info */
export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
  { code: 'bho', name: 'Bhojpuri', nativeName: 'भोजपुरी' },
];
