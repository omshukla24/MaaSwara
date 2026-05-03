// =============================================================================
// MaaSwara — Chat Page (/chat)
// Spec: §7.4 — Screen 3
//
// Full chat interface with warm bubble UI, triage banners, and RED modal.
// Responsive: Full screen on mobile, centered "card" container on desktop.
// =============================================================================

'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { useChatStore } from '@/lib/store/chat-store';
import ChatBubble, { TypingIndicator } from '@/components/ChatBubble';
import ChatInput from '@/components/ChatInput';
import TriageBanner from '@/components/TriageBanner';
import TriageModal from '@/components/TriageModal';
import LanguagePill from '@/components/LanguagePill';
import Wordmark from '@/components/Wordmark';

export default function ChatPage() {
  const {
    messages,
    isLoading,
    currentTriage,
    detectedLanguage,
    nearestClinic,
    showTriageModal,
    error,
    sendMessage,
    setShowTriageModal,
    dismissError,
  } = useChatStore();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div
      className="min-h-screen flex items-center justify-center md:py-8 lg:py-12"
      style={{ backgroundColor: 'var(--cream)' }}
    >
      <div
        className="flex flex-col w-full h-screen md:h-[calc(100vh-4rem)] lg:h-[calc(100vh-6rem)] max-w-4xl overflow-hidden md:rounded-3xl transition-all duration-300"
        style={{
          backgroundColor: 'var(--ivory)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <header
          className="flex items-center justify-between px-4 py-4 shrink-0"
          style={{
            backgroundColor: 'var(--ivory)',
            borderBottom: '1px solid var(--line-soft)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Link
            href="/"
            id="back-to-home"
            className="flex items-center gap-2 text-sm font-semibold
                       transition-all duration-200 hover:opacity-70"
            style={{ color: 'var(--ink-soft)' }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="hidden sm:inline">Back</span>
          </Link>

          <Wordmark size="sm" showTagline={false} />

          <LanguagePill language={detectedLanguage} />
        </header>

        {/* Messages area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-2"
          style={{ backgroundColor: 'var(--cream)' }}
        >
          {/* Welcome message when empty */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 space-y-5 py-12">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--ivory)',
                  border: '2px solid var(--line-soft)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <span className="text-3xl">🤝</span>
              </div>
              <div>
                <p
                  className="font-display font-semibold text-xl"
                  style={{ color: 'var(--ink)' }}
                >
                  Hello, sister
                </p>
                <p
                  className="text-base mt-2 max-w-sm leading-relaxed mx-auto"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  I&apos;m MaaSwara, your health companion. Tell me how you&apos;re
                  feeling today — in any language you&apos;re comfortable with.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {['हिन्दी', 'English', 'Kiswahili', 'Yorùbá', 'Hausa', 'भोजपुरी'].map(
                  (lang) => (
                    <span
                      key={lang}
                      className="text-xs md:text-sm px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: 'var(--cream-warm)',
                        color: 'var(--ink-muted)',
                        border: '1px solid var(--line-soft)',
                      }}
                    >
                      {lang}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((message) => (
            <div key={message.id}>
              <ChatBubble message={message} />

              {/* Show triage banner after bot messages with triage data */}
              {message.role === 'assistant' &&
                message.triage &&
                message.triage.severity !== 'GREEN' && (
                  <TriageBanner triage={message.triage} />
                )}
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && <TypingIndicator />}
        </div>

        {/* Error bar */}
        {error && (
          <div
            className="px-4 py-3 flex items-center justify-between shrink-0"
            style={{
              backgroundColor: 'var(--triage-red-bg)',
              borderTop: '1px solid var(--triage-red)',
            }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--triage-red)' }}>
              {error}
            </p>
            <button
              onClick={dismissError}
              className="text-sm font-bold hover:underline"
              style={{ color: 'var(--triage-red)' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Current triage status bar (GREEN) */}
        {currentTriage && currentTriage.severity === 'GREEN' && messages.length > 0 && (
          <div
            className="px-6 py-3 flex items-center justify-center gap-2 shrink-0"
            style={{
              backgroundColor: 'var(--triage-green-bg)',
              borderTop: '1px solid var(--triage-green)',
            }}
          >
            <span className="text-sm">✓</span>
            <p className="text-sm font-medium" style={{ color: 'var(--triage-green)' }}>
              No danger signs detected — you&apos;re doing well
            </p>
          </div>
        )}

        {/* Chat input */}
        <div style={{ backgroundColor: 'var(--ivory)' }}>
          <ChatInput
            onSend={sendMessage}
            disabled={isLoading}
            placeholder={
              messages.length === 0
                ? 'Tell me how you are feeling today...'
                : 'Type your message...'
            }
          />
        </div>

        {/* RED triage modal */}
        <TriageModal
          isOpen={showTriageModal}
          triage={currentTriage}
          clinic={nearestClinic}
          onClose={() => setShowTriageModal(false)}
        />
      </div>
    </div>
  );
}
