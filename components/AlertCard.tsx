// =============================================================================
// MaaSwara — Alert Card Component (Clinic Dashboard)
// Displays a RED triage alert in the dashboard.
// =============================================================================

'use client';

import { motion } from 'framer-motion';
import { AlertRecord, SUPPORTED_LANGUAGES } from '@/lib/types';
import { DANGER_SIGN_MAP } from '@/lib/triage/danger-signs';

interface AlertCardProps {
  alert: AlertRecord;
  onAcknowledge?: (id: string) => void;
  onResolve?: (id: string) => void;
}

export default function AlertCard({ alert, onAcknowledge, onResolve }: AlertCardProps) {
  const languageName =
    SUPPORTED_LANGUAGES.find((l) => l.code === alert.language)?.name || alert.language;

  // Formatting date
  const dateStr = alert.created_at
    ? new Date(alert.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Just now';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: 'var(--ivory)',
        border: '1px solid var(--triage-red)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          backgroundColor: 'var(--triage-red-bg)',
          borderBottom: '1px solid var(--triage-red)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg triage-pulse">🚨</span>
          <h3
            className="font-display font-semibold text-sm"
            style={{ color: 'var(--triage-red)' }}
          >
            RED ALERT
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className="px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: 'var(--ivory)',
              color: 'var(--triage-red)',
            }}
          >
            {dateStr}
          </span>
          <span
            className="px-2 py-0.5 rounded-full font-medium uppercase"
            style={{
              backgroundColor: 'var(--ivory)',
              color: 'var(--ink-muted)',
              border: '1px solid var(--line-soft)',
            }}
          >
            {alert.source.replace('-', ' ')}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Symptoms and Summary */}
        <div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {alert.signs_detected.map((signId) => {
              const signName = DANGER_SIGN_MAP[signId]?.name || signId;
              return (
                <span
                  key={signId}
                  className="text-xs px-2 py-1 rounded-md font-medium"
                  style={{
                    backgroundColor: 'var(--triage-red-bg)',
                    color: 'var(--triage-red)',
                  }}
                >
                  {signName}
                </span>
              );
            })}
          </div>
          <p
            className="text-sm leading-relaxed font-medium"
            style={{ color: 'var(--ink)' }}
          >
            {alert.summary_en}
          </p>
        </div>

        {/* Patient Context */}
        <div
          className="rounded-lg p-3 text-sm grid grid-cols-2 gap-2"
          style={{
            backgroundColor: 'var(--cream)',
            border: '1px solid var(--line-soft)',
            color: 'var(--ink-soft)',
          }}
        >
          <div>
            <span className="font-medium" style={{ color: 'var(--ink)' }}>
              Language:
            </span>{' '}
            {languageName}
          </div>
          <div>
            <span className="font-medium" style={{ color: 'var(--ink)' }}>
              Pregnancy:
            </span>{' '}
            {alert.weeks_pregnant ? `${alert.weeks_pregnant} weeks` : 'Unknown'}
          </div>
          <div className="col-span-2">
            <span className="font-medium" style={{ color: 'var(--ink)' }}>
              Nearest Clinic:
            </span>{' '}
            {alert.clinic_name || 'Unknown'}
          </div>
        </div>

        {/* Transcript Excerpt */}
        {alert.transcript_excerpt && (
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--ink-muted)' }}>
              Last messages:
            </p>
            <div
              className="text-xs font-mono p-2 rounded bg-opacity-50 whitespace-pre-wrap overflow-hidden"
              style={{
                backgroundColor: 'var(--cream-warm)',
                color: 'var(--ink-soft)',
                border: '1px solid var(--line-soft)',
              }}
            >
              {alert.transcript_excerpt}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div
        className="px-4 py-3 flex gap-2"
        style={{
          backgroundColor: 'var(--cream-warm)',
          borderTop: '1px solid var(--line-soft)',
        }}
      >
        <button
          onClick={() => onAcknowledge?.(alert.id!)}
          className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: 'var(--ivory)',
            color: 'var(--emerald)',
            border: '1px solid var(--emerald)',
          }}
        >
          Acknowledge
        </button>
        <button
          onClick={() => onResolve?.(alert.id!)}
          className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: 'var(--emerald)',
            color: 'var(--ivory)',
          }}
        >
          Mark Resolved
        </button>
      </div>
    </motion.div>
  );
}
