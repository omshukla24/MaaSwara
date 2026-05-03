// =============================================================================
// MaaSwara — Empty Dashboard Component
// Displayed when there are no active alerts.
// =============================================================================

'use client';

import { motion } from 'framer-motion';

export default function EmptyDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center rounded-2xl"
      style={{
        backgroundColor: 'var(--cream-warm)',
        border: '1px dashed var(--line)',
      }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{
          backgroundColor: 'var(--triage-green-bg)',
          color: 'var(--triage-green)',
        }}
      >
        <span className="text-2xl">✓</span>
      </div>
      <h3
        className="font-display font-semibold text-lg"
        style={{ color: 'var(--ink)' }}
      >
        All Clear
      </h3>
      <p
        className="text-sm mt-2 max-w-sm"
        style={{ color: 'var(--ink-soft)' }}
      >
        There are no active RED triage alerts. When a mother needs urgent care,
        it will appear here immediately.
      </p>
    </motion.div>
  );
}
