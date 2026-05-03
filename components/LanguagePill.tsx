// =============================================================================
// MaaSwara — Language Pill Component
// Small rounded indicator showing the detected conversation language
// =============================================================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '@/lib/types';

interface LanguagePillProps {
  language: SupportedLanguage | null;
}

export default function LanguagePill({ language }: LanguagePillProps) {
  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === language);
  
  // If it's a known top-6 language, show native name. Otherwise show auto-detect or dynamic code.
  const displayText = langInfo 
    ? langInfo.nativeName 
    : (language ? `Language: ${language.toUpperCase()}` : 'Auto-Detect: 100+ Languages');

  return (
    <AnimatePresence>
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
          <span>{displayText}</span>
        </motion.div>
    </AnimatePresence>
  );
}
