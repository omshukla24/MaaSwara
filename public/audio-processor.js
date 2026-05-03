// =============================================================================
// MaaSwara — AudioWorkletProcessor
// 
// This file must reside in the `public` directory so it can be loaded
// by the AudioContext. It captures raw Float32 audio from the mic,
// converts it to Int16 (PCM16), and sends it to the main thread.
// =============================================================================

class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0];
    const pcmData = new Int16Array(channelData.length);

    // Convert Float32 (-1.0 to 1.0) to Int16 (-32768 to 32767)
    for (let i = 0; i < channelData.length; i++) {
      let s = Math.max(-1, Math.min(1, channelData[i]));
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // Send the Int16Array to the main thread
    this.port.postMessage(pcmData.buffer, [pcmData.buffer]);

    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
