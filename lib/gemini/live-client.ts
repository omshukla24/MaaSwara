// =============================================================================
// MaaSwara — Gemini Live WebSocket Client
// Spec: §4.3 (Voice Modality - Gemini Live)
//
// Manages the WebSocket connection to the Gemini Multimodal Live API,
// handles microphone recording via AudioContext + AudioWorklet,
// and plays back the received PCM audio stream.
// =============================================================================

import { SYSTEM_PROMPT } from '../triage/system-prompt';

export type LiveClientState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface LiveClientOptions {
  onStateChange: (state: LiveClientState) => void;
  onAudioLevel: (level: number) => void;
  onTranscript: (text: string, isFinal: boolean) => void;
  onError: (error: Error) => void;
  onInteractionStarted: () => void; // Triggered when Gemini starts speaking
  onInteractionEnded: () => void;   // Triggered when Gemini finishes speaking
}

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processorNode: AudioWorkletNode | null = null;
  private playbackContext: AudioContext | null = null;
  
  // Audio playback queue
  private nextPlayTime = 0;
  private isMuted = false;
  private isMicMuted = false;
  
  private options: LiveClientOptions;
  
  constructor(options: LiveClientOptions) {
    this.options = options;
  }

  /**
   * Connect to Gemini Live API and start capturing audio.
   */
  async connect(apiKey: string) {
    if (this.ws) return;
    
    this.options.onStateChange('connecting');

    try {
      // Initialize playback context during the user gesture to avoid browser suspension
      if (!this.playbackContext) {
        this.playbackContext = new AudioContext({ sampleRate: 24000 });
      }
      if (this.playbackContext.state === 'suspended') {
        await this.playbackContext.resume();
      }

      // 1. Initialize WebSocket
      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        // Send initial setup message
        const setupMessage = {
          setup: {
            model: 'models/gemini-2.5-flash-native-audio-latest',
            generationConfig: {
              responseModalities: ['AUDIO'],
            },
            systemInstruction: {
              parts: [{ text: SYSTEM_PROMPT }],
            },
          },
        };
        this.ws?.send(JSON.stringify(setupMessage));
        
        // Wait for setupComplete message before starting audio
      };

      this.ws.onmessage = async (event) => {
        let msg;
        if (event.data instanceof Blob) {
          const text = await event.data.text();
          msg = JSON.parse(text);
        } else {
          msg = JSON.parse(event.data);
        }

        this.handleServerMessage(msg);
      };

      this.ws.onerror = (err) => {
        console.error('[Gemini Live] WebSocket error:', err);
        this.options.onError(new Error('WebSocket connection failed'));
        this.disconnect();
      };

      this.ws.onclose = (event) => {
        console.log(`[Gemini Live] WebSocket closed: ${event.code} - ${event.reason}`);
        this.disconnect();
      };

    } catch (error) {
      console.error('[Gemini Live] Connection failed:', error);
      this.options.onError(error as Error);
      this.disconnect();
    }
  }

  /**
   * Toggle microphone mute state. When muted, it also clears current playback.
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.clearPlayback();
    }
    return this.isMuted;
  }

  /**
   * Toggle only the microphone (user input) mute state.
   */
  toggleMicMute(): boolean {
    this.isMicMuted = !this.isMicMuted;
    return this.isMicMuted;
  }

  /**
   * Clear current audio playback (for barge-in or muting)
   */
  clearPlayback() {
    if (this.playbackContext) {
      // We don't close it, we just suspend it or clear the queue
      this.nextPlayTime = 0;
      this.options.onInteractionEnded(); // Stop UI speaking animation
    }
  }

  /**
   * Disconnect and clean up resources.
   */
  disconnect() {
    this.options.onStateChange('disconnected');
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.playbackContext) {
      this.playbackContext.close();
      this.playbackContext = null;
    }
  }

  /**
   * Handle incoming messages from the WebSocket.
   */
  private handleServerMessage(msg: any) {
    if (msg.setupComplete) {
      console.log('[Gemini Live] Setup complete, starting microphone...');
      this.options.onStateChange('connected');
      this.startMicrophone();

      // Trigger the AI to speak first
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          clientContent: {
            turns: [
              {
                role: 'user',
                parts: [{ text: 'Hello, I am here. Please greet me warmly and ask how I am feeling.' }],
              },
            ],
            turnComplete: true,
          },
        }));
      }
      return;
    }
    
    // If the server signals an interruption (barge-in recognized)
    if (msg.serverContent && msg.serverContent.interrupted) {
      this.clearPlayback();
      return;
    }

    if (msg.serverContent && !this.isMuted) {
      const turn = msg.serverContent.modelTurn;
      if (turn && turn.parts) {
        for (const part of turn.parts) {
          if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/pcm')) {
            this.playAudioChunk(part.inlineData.data);
            this.options.onInteractionStarted(); // Assuming audio implies interaction
          }
          if (part.text) {
            this.options.onTranscript(part.text, false); // For now, just pass text
          }
        }
      }
      
      if (msg.serverContent.turnComplete) {
        this.options.onInteractionEnded();
      }
    }
  }

  /**
   * Start capturing microphone audio and streaming it to Gemini.
   */
  private async startMicrophone() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        },
      });

      this.audioContext = new AudioContext({ sampleRate: 16000 });
      await this.audioContext.audioWorklet.addModule('/audio-processor.js');

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processorNode = new AudioWorkletNode(this.audioContext, 'pcm-processor');

      this.processorNode.port.onmessage = (event) => {
        const pcmBuffer = event.data as ArrayBuffer;
        
        // Calculate audio level for UI (orb pulsing)
        const pcm16 = new Int16Array(pcmBuffer);
        let sumSquares = 0;
        for (let i = 0; i < pcm16.length; i++) {
          const norm = pcm16[i] / 32768.0;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / pcm16.length);
        this.options.onAudioLevel(rms);

        // Encode to base64 and send
        const base64 = this.arrayBufferToBase64(pcmBuffer);
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN && !this.isMuted && !this.isMicMuted) {
          this.ws.send(JSON.stringify({
            realtimeInput: {
              mediaChunks: [{
                mimeType: 'audio/pcm;rate=16000',
                data: base64,
              }],
            },
          }));
        }
      };

      source.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);

    } catch (error) {
      console.error('[Gemini Live] Microphone access failed:', error);
      this.options.onError(new Error('Microphone access denied or failed'));
      this.disconnect();
    }
  }

  /**
   * Decode base64 PCM16 from server and play it.
   */
  private playAudioChunk(base64: string) {
    if (!this.playbackContext) return;

    if (this.playbackContext.state === 'suspended') {
      this.playbackContext.resume();
    }

    const binaryStr = atob(base64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const pcm16 = new Int16Array(bytes.buffer);
    
    const audioBuffer = this.playbackContext.createBuffer(1, pcm16.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    
    // Convert Int16 to Float32
    for (let i = 0; i < pcm16.length; i++) {
      channelData[i] = pcm16[i] / 32768.0;
    }

    const source = this.playbackContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.playbackContext.destination);

    const currentTime = this.playbackContext.currentTime;
    if (this.nextPlayTime < currentTime) {
      this.nextPlayTime = currentTime;
    }

    source.start(this.nextPlayTime);
    this.nextPlayTime += audioBuffer.duration;
  }

  /**
   * Utility to convert ArrayBuffer to Base64 string.
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
