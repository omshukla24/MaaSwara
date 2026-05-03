// =============================================================================
// MaaSwara — Triage Banner Component
// Inline severity indicator shown after triage classification
// =============================================================================

'use client';

import { motion } from 'framer-motion';
import { TriageResult } from '@/lib/types';
import { DANGER_SIGN_MAP } from '@/lib/triage/danger-signs';

interface TriageBannerProps {
  triage: TriageResult;
  compact?: boolean;
}

const severityConfig = {
  GREEN: {
    bg: 'var(--triage-green-bg)',
    border: 'var(--triage-green)',
    text: 'var(--triage-green)',
    icon: '✓',
    label: 'All Clear',
  },
  YELLOW: {
    bg: 'var(--triage-yellow-bg)',
    border: 'var(--triage-yellow)',
    text: '#8B6914',
    icon: '⚡',
    label: 'Check-up Advised',
  },
  RED: {
    bg: 'var(--triage-red-bg)',
    border: 'var(--triage-red)',
    text: 'var(--triage-red)',
    icon: '⚠',
    label: 'Urgent — Clinic Now',
  },
};

export default function TriageBanner({ triage, compact = false }: TriageBannerProps) {
  const config = severityConfig[triage.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        rounded-xl overflow-hidden mx-2 my-2
        ${triage.severity === 'RED' ? 'triage-pulse' : ''}
      `}
      style={{
        backgroundColor: config.bg,
        border: `2px solid ${config.border}`,
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{ borderBottom: `1px solid ${config.border}22` }}
      >
        <span className="text-lg">{config.icon}</span>
        <span
          className="font-display font-semibold text-sm"
          style={{ color: config.text }}
        >
          {config.label}
        </span>
        <span
          className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${config.border}22`,
            color: config.text,
          }}
        >
          {triage.severity}
        </span>
      </div>

      {/* Details (hidden in compact mode) */}
      {!compact && (
        <div className="px-4 py-3 space-y-2">
          {/* Detected signs */}
          {triage.signs_detected.length > 0 && (
            <div>
              <p
                className="text-xs font-medium mb-1"
                style={{ color: config.text }}
              >
                Signs detected:
              </p>
              <div className="flex flex-wrap gap-1">
                {triage.signs_detected.map((signId) => {
                  const sign = DANGER_SIGN_MAP[signId];
                  return (
                    <span
                      key={signId}
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: `${config.border}18`,
                        color: config.text,
                      }}
                    >
                      {sign?.name ?? signId}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          <p
            className="text-xs leading-relaxed"
            style={{ color: 'var(--ink-soft)' }}
          >
            {triage.summary_en}
          </p>
        </div>
      )}
    </motion.div>
  );
}
