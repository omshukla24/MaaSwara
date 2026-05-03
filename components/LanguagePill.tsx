// =============================================================================
// MaaSwara — Language Pill Component
// Small rounded indicator showing the detected conversation language
// Supports 100+ languages via Gemini auto-detect
// =============================================================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '@/lib/types';

interface LanguagePillProps {
  language: SupportedLanguage | null;
}

export default function LanguagePill({ language }: LanguagePillProps) {
  // Try to find a known language entry first
  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === language);

  // If Gemini returns a language code we don't have in the list,
  // display the raw code (e.g. "xh" for Xhosa) as a fallback
  const displayName = langInfo
    ? langInfo.nativeName
    : language
    ? language.toUpperCase()
    : null;

  return (
    <AnimatePresence>
      {displayName ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: 'var(--cream-warm)',
            color: 'var(--emerald-soft)',
            border: '1px solid var(--line)',
          }}
        >
          <span className="text-xs">🌐</span>
          <span>{displayName}</span>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: 'var(--cream-warm)',
            color: 'var(--ink-muted)',
            border: '1px solid var(--line)',
          }}
        >
          <span className="text-xs">🌐</span>
          <span>100+ Languages</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
