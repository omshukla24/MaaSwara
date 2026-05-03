// =============================================================================
// MaaSwara — Chat Store (Zustand)
// Client-side state management for the /chat page
// =============================================================================

import { create } from 'zustand';
import { ChatMessage, TriageResult, SupportedLanguage, PartnerClinic } from '@/lib/types';

interface ChatState {
  // State
  messages: ChatMessage[];
  isLoading: boolean;
  currentTriage: TriageResult | null;
  detectedLanguage: SupportedLanguage | null;
  nearestClinic: PartnerClinic | null;
  showTriageModal: boolean;
  error: string | null;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  setShowTriageModal: (show: boolean) => void;
  dismissError: () => void;
}

/**
 * Generate a simple unique ID for messages
 */
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: [],
  isLoading: false,
  currentTriage: null,
  detectedLanguage: null,
  nearestClinic: null,
  showTriageModal: false,
  error: null,

  sendMessage: async (content: string) => {
    const { messages } = get();

    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];

    set({
      messages: updatedMessages,
      isLoading: true,
      error: null,
    });

    try {
      // Attempt to get the user's real location for clinic routing
      let location: { lat: number; lng: number } | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 60000,
          })
        );
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch {
        // Geolocation denied or unavailable — continue without it
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          location,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
        triage: data.triage,
      };

      set({
        messages: [...updatedMessages, assistantMessage],
        isLoading: false,
        currentTriage: data.triage,
        detectedLanguage: data.triage?.language ?? null,
        nearestClinic: data.nearest_clinic ?? null,
        // Show modal on RED severity
        showTriageModal: data.triage?.severity === 'RED',
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send message. Please try again.',
      });
    }
  },

  clearChat: () => {
    set({
      messages: [],
      isLoading: false,
      currentTriage: null,
      detectedLanguage: null,
      nearestClinic: null,
      showTriageModal: false,
      error: null,
    });
  },

  setShowTriageModal: (show: boolean) => {
    set({ showTriageModal: show });
  },

  dismissError: () => {
    set({ error: null });
  },
}));
