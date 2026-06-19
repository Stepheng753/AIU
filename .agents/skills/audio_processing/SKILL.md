# Agent Skill: Web Audio API PCM Capturing & Playback

This document details client-side skills for capturing 16-bit linear PCM audio chunks at 16kHz or 24kHz using the Web Audio API, and managing incoming base64 PCM streams for playback.

---

## 1. Capturing 16-bit Linear PCM at 16kHz

Google's Gemini Live API expects audio input formatted as raw, headerless 16-bit linear PCM at 16,000 Hz. The web client must record, downsample, convert, and stream this format.

### Audio Recording Pipeline
1. **Access Microphone**: Use `navigator.mediaDevices.getUserMedia({ audio: true })`.
2. **Audio Context**: Initialize an `AudioContext` with a sample rate of `16000` (supported by modern browsers, which automatically downsamples the microphone input).
3. **Capture Processor**: Set up an `AudioWorklet` (or fallback `ScriptProcessorNode`) to listen for PCM buffers.
4. **Buffer Conversion**: Convert the incoming Float32 arrays from the microphone to Int16 (16-bit) linear PCM buffers.

### Core Conversion Code Snippet
```javascript
// Converts Float32Array [ -1.0, 1.0 ] to Int16Array (16-bit Linear PCM)
function float32ToInt16(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true); // true = little endian
  }
  return buffer;
}
```

---

## 2. Playback of Incoming 24kHz Base64 PCM Chunks

The Gemini Live API responds with audio frames encoded as base64 PCM streams (typically mono 16-bit PCM at 24kHz). To play this back smoothly without gaps:

1. **Audio Queue**: Keep an array of decoded audio buffer segments.
2. **Decoding**: Convert the base64 string to a Uint8Array, wrap it in a DataView/Float32Array, and load it into a Web Audio API buffer.
3. **Scheduling Nodes**: Rather than play-on-receive (which creates pops and gaps), schedule each subsequent buffer to start exactly when the previous buffer finishes playing using `audioContext.currentTime`.

### Audio Scheduling Implementation:
```javascript
let nextStartTime = 0;

function playPCMChunk(base64Data, audioContext) {
  // Convert base64 string to binary
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Parse mono 16-bit PCM (2 bytes per sample)
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }

  // Create AudioBuffer (24kHz Mono)
  const audioBuffer = audioContext.createBuffer(1, float32Array.length, 24000);
  audioBuffer.copyToChannel(float32Array, 0);

  // Play schedule
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);

  const now = audioContext.currentTime;
  if (nextStartTime < now) {
    nextStartTime = now;
  }
  source.start(nextStartTime);
  nextStartTime += audioBuffer.duration;
}
```
Use this pipeline inside web components to implement real-time speech synthesis playback.
