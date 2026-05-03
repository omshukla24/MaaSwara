// =============================================================================
// MaaSwara — Triage Modal (RED Alert Full-Screen)
// Spec: §7.4 — Screen 4
//
// Surfaces when severity = RED. Full-screen overlay with calm, urgent messaging.
// "You are not alone. Help is coming."
// =============================================================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { TriageResult, PartnerClinic } from '@/lib/types';
import { DANGER_SIGN_MAP } from '@/lib/triage/danger-signs';

interface TriageModalProps {
  isOpen: boolean;
  triage: TriageResult | null;
  clinic: PartnerClinic | null;
  onClose: () => void;
}

export default function TriageModal({
  isOpen,
  triage,
  clinic,
  onClose,
}: TriageModalProps) {
  if (!triage) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(42, 24, 16, 0.6)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              backgroundColor: 'var(--ivory)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {/* Terracotta banner header */}
            <div
              className="px-6 py-5 text-center"
              style={{ backgroundColor: 'var(--terracotta)' }}
            >
              <span className="text-3xl mb-2 block">⚠️</span>
              <h2
                className="font-display font-semibold text-xl"
                style={{ color: 'var(--ivory)' }}
              >
                Important
              </h2>
            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-5">
              {/* Main message */}
              <div className="text-center">
                <p
                  className="font-display font-semibold text-lg mb-2"
                  style={{ color: 'var(--ink)' }}
                >
                  Please go to a clinic now
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  {triage.signs_detected.length > 0
                    ? `You may have signs of ${
                        DANGER_SIGN_MAP[triage.signs_detected[0]]?.name.toLowerCase() ??
                        'a pregnancy complication'
                      }. This needs a doctor today.`
                    : 'Based on your symptoms, you should see a doctor today.'}
                </p>
              </div>

              {/* Nearest clinic card */}
              {clinic && (
                <div
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: 'var(--cream)',
                    border: '1px solid var(--line)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">📍</span>
                    <div>
                      <p
                        className="font-display font-semibold text-sm"
                        style={{ color: 'var(--ink)' }}
                      >
                        Nearest clinic:
                      </p>
                      <p
                        className="font-display font-medium text-base mt-0.5"
                        style={{ color: 'var(--emerald)' }}
                      >
                        {clinic.name}
                      </p>
                      {clinic.distance_km && (
                        <p
                          className="text-xs mt-1"
                          style={{ color: 'var(--ink-muted)' }}
                        >
                          {clinic.distance_km} km away
                        </p>
                      )}
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: 'var(--ink-muted)' }}
                      >
                        They have been notified
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                {clinic && (
                  <>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      id="open-maps-button"
                      className="flex-1 py-3 rounded-xl text-center text-sm font-semibold
                                 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        backgroundColor: 'var(--emerald)',
                        color: 'var(--ivory)',
                      }}
                    >
                      Open in Maps
                    </a>
                    <a
                      href={`tel:${clinic.phone}`}
                      id="call-clinic-button"
                      className="flex-1 py-3 rounded-xl text-center text-sm font-semibold
                                 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        backgroundColor: 'var(--terracotta)',
                        color: 'var(--ivory)',
                      }}
                    >
                      Call Clinic
                    </a>
                  </>
                )}
              </div>

              {/* Close / acknowledge */}
              <button
                onClick={onClose}
                id="close-triage-modal"
                className="w-full py-2 text-sm font-medium rounded-xl
                           transition-all duration-200 hover:opacity-80"
                style={{
                  color: 'var(--ink-muted)',
                  border: '1px solid var(--line)',
                }}
              >
                I understand
              </button>
            </div>

            {/* Footer message */}
            <div
              className="px-6 py-4 text-center"
              style={{
                backgroundColor: 'var(--cream-warm)',
                borderTop: '1px solid var(--line-soft)',
              }}
            >
              <p
                className="font-display font-medium italic text-sm"
                style={{ color: 'var(--terracotta-deep)' }}
              >
                You are not alone. Help is coming.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
