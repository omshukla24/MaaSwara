// =============================================================================
// MaaSwara — Voice Call UI (/call)
// Spec: Phase 3 - Native Gemini Live Voice Interface
// =============================================================================

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { GeminiLiveClient, LiveClientState } from '@/lib/gemini/live-client';
import Wordmark from '@/components/Wordmark';
import TriageBanner from '@/components/TriageBanner';
import { applyDeterministicOverride } from '@/lib/triage/classify';
import { TriageResult } from '@/lib/types';
import TriageModal from '@/components/TriageModal';

export default function CallPage() {
  const [clientState, setClientState] = useState<LiveClientState>('disconnected');
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [currentTriage, setCurrentTriage] = useState<TriageResult | null>(null);
  const [showTriageModal, setShowTriageModal] = useState(false);

  const clientRef = useRef<GeminiLiveClient | null>(null);

  // Auto-scroll transcript
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clientRef.current?.disconnect();
    };
  }, []);

  const handleConnect = async () => {
    try {
      setClientState('connecting');
      const res = await fetch('/api/live-token');
      if (!res.ok) throw new Error('Could not get API key');
      const { apiKey } = await res.json();

      clientRef.current = new GeminiLiveClient({
        onStateChange: setClientState,
        onAudioLevel: setAudioLevel,
        onTranscript: (text) => {
          setTranscript((prev) => {
            const newText = prev + ' ' + text;
            
            // Run Safety Net Check on the accumulated transcript
            if (!currentTriage || currentTriage.severity !== 'RED') {
              const baseTriage: TriageResult = currentTriage || {
                severity: 'GREEN',
                signs_detected: [],
                language: 'en',
                weeks_pregnant: null,
                needs_alert: false,
                summary_en: 'Conversation ongoing...',
              };
              
              const finalTriage = applyDeterministicOverride(baseTriage, newText);
              if (finalTriage.severity === 'RED' && baseTriage.severity !== 'RED') {
                setCurrentTriage(finalTriage);
                triggerAlert(finalTriage, newText);
              } else if (!currentTriage) {
                setCurrentTriage(finalTriage);
              }
            }
            return newText;
          });
        },
        onError: (err) => {
          console.error('[MaaSwara Call] Error:', err);
          setClientState('error');
        },
        onInteractionStarted: () => setIsSpeaking(true),
        onInteractionEnded: () => setIsSpeaking(false),
      });

      await clientRef.current.connect(apiKey);
    } catch (err) {
      console.error('Failed to start call:', err);
      setClientState('error');
    }
  };

  const handleDisconnect = () => {
    clientRef.current?.disconnect();
    setClientState('disconnected');
    setIsSpeaking(false);
    setIsMuted(false);
    setIsMicMuted(false);
    setAudioLevel(0);
  };

  const toggleMute = () => {
    if (clientRef.current) {
      const muted = clientRef.current.toggleMute();
      setIsMuted(muted);
    }
  };

  const toggleMicMute = () => {
    if (clientRef.current) {
      const micMuted = clientRef.current.toggleMicMute();
      setIsMicMuted(micMuted);
    }
  };

  const triggerAlert = async (triage: TriageResult, fullTranscript: string) => {
    setShowTriageModal(true);
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity: triage.severity,
          signs_detected: triage.signs_detected,
          language: triage.language,
          weeks_pregnant: triage.weeks_pregnant,
          summary_en: triage.summary_en,
          lat: null, // Would fetch location in full impl
          lng: null,
          status: 'active',
          source: 'web-voice',
          transcript_excerpt: fullTranscript.slice(-500),
        }),
      });
    } catch (err) {
      console.error('Failed to trigger alert API:', err);
    }
  };

  // Base size + audio level scaling
  const orbScale = 1 + (isSpeaking ? audioLevel * 5 : audioLevel * 8);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between p-6"
      style={{ backgroundColor: 'var(--cream)' }}
    >
      {/* Header */}
      <header className="w-full max-w-lg flex items-center justify-between py-4">
        <Link
          href="/"
          onClick={handleDisconnect}
          className="flex items-center gap-2 text-sm font-semibold transition-all hover:opacity-70"
          style={{ color: 'var(--ink-soft)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="hidden sm:inline">End Call</span>
        </Link>
        <Wordmark size="sm" showTagline={false} />
        <div className="w-[70px]"></div> {/* Spacer for balance */}
      </header>

      {/* Main Orb Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg relative">
        <div className="absolute top-0 w-full px-4">
          {currentTriage && currentTriage.severity !== 'GREEN' && (
            <TriageBanner triage={currentTriage} />
          )}
        </div>

        <div className="relative flex items-center justify-center w-64 h-64 mb-12">
          {/* Outer glow based on state */}
          <AnimatePresence>
            {clientState === 'connected' && !isMuted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.4, scale: orbScale + 0.2 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'tween', duration: 0.1, ease: 'linear' }}
                className="absolute inset-0 rounded-full blur-2xl transition-transform duration-75"
                style={{
                  backgroundColor: isSpeaking ? 'var(--emerald)' : 'var(--terracotta)',
                }}
              />
            )}
          </AnimatePresence>

          {/* Central Orb */}
          <motion.button
            onClick={clientState === 'connected' ? toggleMute : handleConnect}
            animate={{ scale: clientState === 'connected' && !isMuted ? orbScale : 1 }}
            transition={{ type: 'tween', duration: 0.1, ease: 'linear' }}
            className="z-10 w-40 h-40 rounded-full flex flex-col items-center justify-center shadow-2xl transition-transform duration-75 border-none outline-none focus:outline-none"
            style={{
              background:
                clientState === 'connected'
                  ? isMuted
                    ? 'var(--line)' // Muted state background
                    : isSpeaking
                    ? 'radial-gradient(circle at 30% 30%, var(--emerald-light), var(--emerald))'
                    : 'radial-gradient(circle at 30% 30%, var(--terracotta-light), var(--terracotta))'
                  : 'var(--line)', // Disconnected background
              cursor: clientState === 'connecting' ? 'wait' : 'pointer',
            }}
            disabled={clientState === 'connecting'}
          >
            {clientState === 'disconnected' && (
              <div className="flex flex-col items-center text-white">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
                <span className="font-semibold tracking-wide">TAP TO START</span>
              </div>
            )}

            {clientState === 'connecting' && (
              <span className="text-white font-medium animate-pulse">Connecting...</span>
            )}

            {clientState === 'connected' && isMuted && (
              <div className="flex flex-col items-center text-white opacity-80">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                  <line x1="1" x2="23" y1="1" y2="23" />
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
                <span className="font-semibold tracking-wide text-xs">MUTED</span>
              </div>
            )}
            
            {clientState === 'connected' && !isMuted && (
              <div className="flex flex-col items-center text-white opacity-0 hover:opacity-100 transition-opacity duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="4" height="16" x="6" y="4" />
                  <rect width="4" height="16" x="14" y="4" />
                </svg>
              </div>
            )}
          </motion.button>
        </div>

        {/* Status Text & Mic Control */}
        <div className="h-16 text-center flex flex-col items-center gap-3">
          {clientState === 'connected' && (
            <p className="font-display font-medium text-lg" style={{ color: 'var(--ink)' }}>
              {isMuted ? 'Call paused' : isSpeaking ? 'MaaSwara is speaking...' : 'Listening...'}
            </p>
          )}
          {clientState === 'error' && (
            <p className="font-medium text-red-500">Connection error. Please try again.</p>
          )}

          {clientState === 'connected' && !isMuted && (
            <button
              onClick={toggleMicMute}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isMicMuted 
                  ? 'bg-red-100 text-red-600 border border-red-200' 
                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
              }`}
            >
              {isMicMuted ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="1" x2="23" y1="1" y2="23" />
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                  Mic Muted
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                  Mute Mic
                </>
              )}
            </button>
          )}
        </div>

        {/* Live Transcript Overlay */}
        <div className="w-full mt-8 h-32 overflow-y-auto px-6 text-center text-sm italic" style={{ color: 'var(--ink-soft)' }}>
          {transcript}
          <div ref={transcriptEndRef} />
        </div>
      </div>

      {/* Disconnect Button (Footer) */}
      <div className="h-20 w-full flex justify-center items-end">
        {clientState === 'connected' && (
          <button
            onClick={handleDisconnect}
            className="px-8 py-3 rounded-full font-semibold transition-transform hover:scale-105 active:scale-95 shadow-md"
            style={{ backgroundColor: 'var(--triage-red)', color: 'white' }}
          >
            End Call
          </button>
        )}
      </div>

      <TriageModal
        isOpen={showTriageModal}
        triage={currentTriage}
        clinic={null}
        onClose={() => setShowTriageModal(false)}
      />
    </div>
  );
}
