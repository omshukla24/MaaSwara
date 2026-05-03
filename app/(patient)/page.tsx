// =============================================================================
// MaaSwara — Patient Landing Page (/)
// Spec: §7.4 — Screen 1
//
// Responsive split view for PC (text left, actions right) and stacked for Mobile.
// Cream background, terracotta CTA.
// =============================================================================

import Link from 'next/link';
import Wordmark from '@/components/Wordmark';
import { SUPPORTED_LANGUAGES } from '@/lib/types';

export default function PatientLanding() {
  return (
    <main className="warm-gradient min-h-screen flex items-center justify-center p-6 md:p-12 lg:p-24">
      <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-24">
        
        {/* Left side: Hero Text & Branding */}
        <div className="flex-1 text-center md:text-left max-w-xl space-y-6">
          <Wordmark size="lg" showTagline={false} className="md:text-left" />
          <p
            className="font-display italic text-xl md:text-2xl"
            style={{ color: 'var(--terracotta-deep)' }}
          >
            A mother&apos;s voice, in her own voice.
          </p>
          <p
            className="text-base md:text-lg leading-relaxed"
            style={{ color: 'var(--ink-soft)' }}
          >
            MaaSwara is a smart health companion for pregnant women. Speak naturally in your own language to check your symptoms and get directed to a doctor if needed.
          </p>

          <div className="hidden md:flex flex-wrap gap-2 pt-4">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <span
                key={lang.code}
                className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{
                  backgroundColor: 'var(--ivory)',
                  color: 'var(--emerald-soft)',
                  border: '1px solid var(--emerald-light)',
                  opacity: 0.8,
                }}
              >
                {lang.nativeName}
              </span>
            ))}
          </div>
        </div>

        {/* Right side: Actions Card */}
        <div className="w-full max-w-[420px] space-y-8">
          {/* Voice Call CTA (Phase 3 — disabled for now) */}
          <div
            className="rounded-3xl p-8 text-center space-y-5 transition-transform hover:scale-[1.01]"
            style={{
              backgroundColor: 'var(--ivory)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--line-soft)',
            }}
          >
            <div className="relative inline-block">
              <Link
                href="/call"
                id="call-button"
                className="inline-flex items-center justify-center w-24 h-24 rounded-full
                           pulse-terracotta transition-all duration-300
                           hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: 'var(--terracotta)',
                  color: 'var(--ivory)',
                  boxShadow: 'var(--shadow-md)',
                }}
                aria-label="Start voice call"
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </Link>
            </div>

            <div>
              <p
                className="font-display font-semibold text-xl"
                style={{ color: 'var(--ink)' }}
              >
                Tap to call
              </p>
              <p
                className="text-sm mt-1.5"
                style={{ color: 'var(--ink-soft)' }}
              >
                Speak in your own language.
              </p>
            </div>

            {/* Language list (Mobile only) */}
            <div className="flex md:hidden flex-wrap justify-center gap-2 pt-2">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <span
                  key={lang.code}
                  className="text-[10px] px-2 py-1 rounded-full font-medium uppercase tracking-wide"
                  style={{
                    backgroundColor: 'var(--cream)',
                    color: 'var(--ink-soft)',
                    border: '1px solid var(--line)',
                  }}
                >
                  {lang.nativeName}
                </span>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--line-soft)' }} />
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--ink-muted)' }}
            >
              or
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--line-soft)' }} />
          </div>

          {/* Text Chat CTA */}
          <Link
            href="/chat"
            id="chat-button"
            className="block w-full py-4 rounded-xl text-center font-display font-semibold text-lg
                       transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--emerald)',
              color: 'var(--ivory)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <span className="mr-2">💬</span>
            Type instead
          </Link>

          {/* Telegram link */}
          <div className="text-center">
            <p
              className="text-sm mb-1.5"
              style={{ color: 'var(--ink-muted)' }}
            >
              📲 Or message us on Telegram:
            </p>
            <a
              href="https://t.me/MaaSwarabot"
              target="_blank"
              rel="noopener noreferrer"
              id="telegram-link"
              className="font-display font-semibold text-base hover:underline transition-all"
              style={{ color: 'var(--terracotta)' }}
            >
              @MaaSwarabot
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
