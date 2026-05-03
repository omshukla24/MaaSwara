// =============================================================================
// MaaSwara — Deterministic Severity Check (SAFETY NET)
// Spec: §5.4
//
// ⚠️  CRITICAL FLAG #1: Never trust the LLM alone with safety calls.
//
// This module runs AFTER every Gemini response. If the conversation
// transcript contains ANY red keyword in ANY supported language,
// severity is FORCED to RED — regardless of what Gemini classified.
//
// This is not a replacement for the LLM. It is a safety net that catches
// the cases where the model under-classifies a dangerous symptom.
// =============================================================================

import { Severity, SeverityOverride, SupportedLanguage } from '@/lib/types';

/**
 * RED keywords by language.
 * If ANY of these appear in the transcript, force severity = RED.
 *
 * These are intentionally broad — better to over-alert than miss
 * a woman who is hemorrhaging.
 */
const RED_KEYWORDS: Record<SupportedLanguage, string[]> = {
  en: [
    'bleeding', 'blood', 'hemorrhage', 'haemorrhage',
    'convulsion', 'seizure', 'fits', 'fainted', 'fainting', 'unconscious',
    'cant breathe', "can't breathe", 'cannot breathe', 'difficulty breathing',
    'water broke', 'water broken', 'water breaking', 'amniotic',
    'blurred vision', 'cant see', "can't see", 'cannot see', 'seeing spots',
    'severe headache', 'worst headache',
    'severe pain', 'sharp pain', 'intense pain',
    'baby not moving', 'baby stopped moving', 'no movement', 'not kicking',
    'preeclampsia', 'eclampsia',
  ],
  hi: [
    'खून', 'रक्तस्राव', 'ब्लीडिंग', 'खून बह',
    'दौरा', 'मिर्गी', 'बेहोश', 'बेहोशी',
    'सांस नहीं', 'सांस लेने में', 'दम घुट',
    'पानी टूट', 'पानी निकल', 'पानी आ गया',
    'धुंधला', 'दिखाई नहीं', 'नजर', 'आंखों में',
    'सर दर्द', 'सिर दर्द', 'सिर में दर्द',
    'तेज दर्द', 'पेट में दर्द', 'पेट दर्द',
    'बच्चा हिल नहीं', 'बच्चा नहीं हिल', 'हलचल नहीं',
  ],
  bho: [
    'खून', 'लहू', 'रगत',
    'दौरा', 'बेहोश', 'मूर्छा',
    'सांस ना आवत', 'सांस नइखे',
    'पानी टूट', 'पानी गिर',
    'दिखाई ना दे', 'आंख में धुंधला',
    'माथा दरद', 'सिर दरद',
    'पेट में दरद', 'तेज दरद',
    'बच्चा ना हिलत',
  ],
  sw: [
    'damu', 'kutoka damu', 'kuvuja damu',
    'kifafa', 'kuzimia', 'kupoteza fahamu',
    'sipumui', 'kupumua', 'kushindwa kupumua',
    'maji yametoka', 'maji yamevunjika',
    'macho haioni', 'kuona vibaya',
    'kichwa kinaumia sana', 'maumivu makali',
    'maumivu ya tumbo', 'tumbo linaumia',
    'mtoto hasogei', 'mtoto hajisikii',
  ],
  yo: [
    'ẹjẹ', 'eje', 'njade',
    'gìrì', 'giri', 'daku', 'subu',
    'kò lè mí', 'ko le mi', 'èémí',
    'omi fọ', 'omi fo',
    'ojú rẹ̀', 'oju re', 'kò rí',
    'orí fó', 'ori fo', 'efori',
    'inú dùn', 'inu dun gidigidi',
    'ọmọ kò ní yí padà', 'omo ko ni yi pada',
  ],
  ha: [
    'jini', 'zubar jini',
    'farfadiya', 'suma', 'fadi',
    'ba iya numfashi', 'numfashi',
    'ruwan ya karye', 'ruwan ya fadi',
    'ba ta gani', 'idanuwa',
    'ciwon kai', 'tsananin ciwon kai',
    'ciwo mai tsanani', 'ciwon ciki',
    'jariri bai motsa ba', 'ba ya motsi',
  ],
};

/**
 * YELLOW keywords by language.
 * These trigger a YELLOW upgrade if severity was GREEN.
 */
const YELLOW_KEYWORDS: Record<SupportedLanguage, string[]> = {
  en: [
    'swelling', 'swollen face', 'swollen hands', 'puffy',
    'vomiting', 'throwing up', 'cant keep food', "can't keep food",
    'nausea severe', 'persistent vomiting',
  ],
  hi: [
    'सूजन', 'मुंह पर सूजन', 'हाथ सूजे',
    'उल्टी', 'बार बार उल्टी', 'खाना नहीं रुक',
  ],
  bho: [
    'सूजन', 'मुंह सूजल', 'हाथ सूजल',
    'उल्टी', 'बार बार उल्टी',
  ],
  sw: [
    'kuvimba', 'uso kuvimba', 'mikono kuvimba',
    'kutapika', 'kutapika sana',
  ],
  yo: [
    'wiwú', 'wiwu', 'ojú wú',
    'gbígbẹ́', 'gbigbe', 'ìbínú inú',
  ],
  ha: [
    'kumburi', 'kumburin fuska',
    'amai', 'amai sosai',
  ],
};

/**
 * Normalize text for keyword matching.
 * Lowercases, removes extra whitespace, keeps Unicode characters intact.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if a transcript contains any keywords from a given dictionary.
 * Returns the matched keywords.
 */
function findKeywordMatches(
  transcript: string,
  keywords: string[]
): string[] {
  const normalized = normalizeText(transcript);
  return keywords.filter((keyword) => normalized.includes(keyword.toLowerCase()));
}

/**
 * Run the deterministic severity check against a conversation transcript.
 *
 * ⚠️  This is the SAFETY NET. It runs after every Gemini response.
 *
 * @param transcript - The full conversation text (user + assistant messages concatenated)
 * @returns SeverityOverride if a forced upgrade is needed, null if Gemini's classification is fine
 */
export function forceSeverityCheck(transcript: string): SeverityOverride | null {
  // Check RED keywords across ALL languages
  for (const [lang, keywords] of Object.entries(RED_KEYWORDS)) {
    const matches = findKeywordMatches(transcript, keywords);
    if (matches.length > 0) {
      return {
        forced: true,
        severity: 'RED',
        matched_keywords: matches,
        source_language: lang as SupportedLanguage,
      };
    }
  }

  // Check YELLOW keywords across ALL languages
  for (const [lang, keywords] of Object.entries(YELLOW_KEYWORDS)) {
    const matches = findKeywordMatches(transcript, keywords);
    if (matches.length > 0) {
      return {
        forced: true,
        severity: 'YELLOW',
        matched_keywords: matches,
        source_language: lang as SupportedLanguage,
      };
    }
  }

  return null;
}

/**
 * Determine if a severity should be overridden.
 * Only upgrades — never downgrades. RED > YELLOW > GREEN.
 */
export function shouldOverride(
  currentSeverity: Severity,
  overrideSeverity: Severity
): boolean {
  const priority: Record<Severity, number> = {
    GREEN: 0,
    YELLOW: 1,
    RED: 2,
  };
  return priority[overrideSeverity] > priority[currentSeverity];
}
