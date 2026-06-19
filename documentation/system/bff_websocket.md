# BFF WebSocket Proxy Protocol

The Backend-For-Frontend (BFF) WebSocket proxy acts as a secure, latency-optimized gateway between the client (web application) and Google's Gemini Live API.

---

## 1. Gateway Handshake

To initiate a live interview session, the client establishes a WebSocket connection to the backend.

### Request URL
`ws://localhost:3000?token=<JWT_TOKEN>`

### Authentication
The backend extracts the `token` search parameter and verifies it against the `JWT_SECRET`. If verification fails, the connection is aborted with status code `1008` (Policy Violation).

---

## 2. Gemini Live Integration Config

Once authorized, the backend establishes an upstream connection to Google's Generative Service WebSocket endpoint:
`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=GEMINI_API_KEY`

### Setup Configuration Frame
Upon connection, the backend pushes the configuration frame to Gemini:
```json
{
  "setup": {
    "model": "models/gemini-3.1-flash-live-preview",
    "generationConfig": {
      "responseModalities": ["AUDIO"]
    },
    "outputAudioTranscription": {},
    "systemInstruction": {
      "parts": [{ "text": "You are a warm, conversational AI interviewer. Your goal is to interview the user about their life stories, career, and personal philosophy to help them preserve their knowledge. Ask one interesting and open-ended question at a time. Keep your questions relatively short, and wait for their response. Start by welcoming the user and asking the first question." }]
    }
  }
}
```

---

## 3. Communication Frames

The WebSocket proxy forwards message frames bidirectionally with minimal overhead.

### Client to Server (Upstream)
The client sends user audio input chunks to the backend proxy as a base64-encoded PCM audio structure:
```json
{
  "realtimeInput": {
    "audio": {
      "mimeType": "audio/pcm;rate=16000",
      "data": "Base64EncodedPCMString=="
    }
  }
}
```
The BFF proxy forwards this payload unchanged to the Gemini Live endpoint.

### Server to Client (Downstream)
Gemini outputs response chunks back to the BFF, containing both synthesized voice audio and text transcriptions. The BFF forwards these downstream to the client:
```json
{
  "serverContent": {
    "modelTurn": {
      "parts": [
        {
          "inlineData": {
            "mimeType": "audio/pcm;rate=24000",
            "data": "Base64EncodedPCMResponseString=="
          }
        }
      ]
    },
    "turnComplete": false
  }
}
```
*Note: A transcription sub-object is also included when Gemini finishes synthesizing segments, which is mapped directly in the chat screen.*
```json
{
  "serverContent": {
    "turnComplete": true
  }
}
```
When `turnComplete` is true, the user is free to speak again.
