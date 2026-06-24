import { useState, useEffect, useRef } from 'react';
import { formatTranscriptText, float32ToInt16, arrayBufferToBase64 } from '../utils/helpers';

export interface ChatLogEntry {
  id: string;
  role: 'interviewer' | 'user';
  text: string;
  timestamp: Date;
}

interface UseVoiceSessionProps {
  token: string | null;
  apiUrl: string;
  wsUrl: string;
  onSaveSuccess?: () => void;
}

export const useVoiceSession = ({ token, apiUrl, wsUrl, onSaveSuccess }: UseVoiceSessionProps) => {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [dialogue, setDialogue] = useState<ChatLogEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const speakingTimeoutRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextPlaybackTimeRef = useRef<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const dialogueEndRef = useRef<HTMLDivElement | null>(null);

  // Transcription and Q&A persistence refs
  const dialogueRef = useRef<ChatLogEntry[]>([]);
  const recognitionRef = useRef<any>(null);
  const currentUserBubbleIdRef = useRef<string | null>(null);
  const currentInterviewerBubbleIdRef = useRef<string | null>(null);
  const savedPairsRef = useRef<Set<string>>(new Set());
  const isWaitingForModelResponseRef = useRef<boolean>(true);
  const selectedCategoryRef = useRef<string | null>(null);

  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
  }, [selectedCategory]);

  const updateDialogueState = (newDialogue: ChatLogEntry[]) => {
    dialogueRef.current = newDialogue;
    setDialogue(newDialogue);
  };

  const updateChatBubble = (role: 'interviewer' | 'user', text: string, mode: 'append' | 'replace' | 'new') => {
    const list = [...dialogueRef.current];
    if (mode === 'new') {
      const id = Math.random().toString(36).substring(2, 11);
      if (role === 'user') {
        currentUserBubbleIdRef.current = id;
      } else {
        currentInterviewerBubbleIdRef.current = id;
      }
      const newEntry: ChatLogEntry = {
        id,
        role,
        text,
        timestamp: new Date()
      };
      updateDialogueState([...list, newEntry]);
      return;
    }

    const targetId = role === 'user' ? currentUserBubbleIdRef.current : currentInterviewerBubbleIdRef.current;
    const index = list.findIndex(e => e.id === targetId);

    if (index !== -1) {
      if (mode === 'append') {
        list[index] = {
          ...list[index],
          text: list[index].text + text
        };
      } else if (mode === 'replace') {
        list[index] = {
          ...list[index],
          text: text
        };
      }
      updateDialogueState(list);
    } else {
      const id = Math.random().toString(36).substring(2, 11);
      if (role === 'user') {
        currentUserBubbleIdRef.current = id;
      } else {
        currentInterviewerBubbleIdRef.current = id;
      }
      const newEntry: ChatLogEntry = {
        id,
        role,
        text,
        timestamp: new Date()
      };
      updateDialogueState([...list, newEntry]);
    }
  };

  const saveLastQAPair = async () => {
    const list = dialogueRef.current;
    if (list.length < 2) return;

    let lastUserIdx = -1;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].role === 'user') {
        lastUserIdx = i;
        break;
      }
    }

    if (lastUserIdx >= 0) {
      const userMsg = list[lastUserIdx];
      let interviewerMsg = null;
      for (let i = lastUserIdx - 1; i >= 0; i--) {
        if (list[i].role === 'interviewer') {
          interviewerMsg = list[i];
          break;
        }
      }

      if (interviewerMsg && userMsg.text.trim()) {
        const pairKey = `${interviewerMsg.id}-${userMsg.id}`;
        if (savedPairsRef.current.has(pairKey)) return;

        savedPairsRef.current.add(pairKey);

        try {
          const res = await fetch(`${apiUrl}/pair`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              question: interviewerMsg.text,
              answer: userMsg.text,
              category: selectedCategoryRef.current
            })
          });
          if (res.ok) {
            if (onSaveSuccess) onSaveSuccess();
          } else {
            const errBody = await res.json().catch(() => ({}));
            console.error('[saveLastQAPair] server save failed:', errBody);
          }
        } catch (err) {
          console.error('[saveLastQAPair] fetch network error saving QA pair:', err);
        }
      }
    }
  };

  const startVoiceSession = async (category: string) => {
    if (!token) return;
    setWsStatus('connecting');
    setIsVoiceActive(true);
    if (dialogueRef.current.length === 0) {
      savedPairsRef.current.clear();
    }
    isWaitingForModelResponseRef.current = true;

    try {
      // 1. Initialize Web Audio Context at 16000Hz (required input frequency)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });
      audioContextRef.current = audioContext;

      // 2. Request mic access with standard echo cancellation filters
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      micStreamRef.current = stream;

      // 3. Initialize SpeechRecognition if available
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let accumulatedTranscript = '';
          for (let i = 0; i < event.results.length; ++i) {
            accumulatedTranscript += event.results[i][0].transcript;
          }
          const fullTranscript = accumulatedTranscript.trim();
          if (fullTranscript) {
            const formatted = formatTranscriptText(fullTranscript);
            if (!currentUserBubbleIdRef.current) {
              updateChatBubble('user', formatted, 'new');
            } else {
              updateChatBubble('user', formatted, 'replace');
            }
          }
        };

        recognition.onerror = (e: any) => {
          console.error('[SpeechRecognition] error encountered:', e);
        };

        recognitionRef.current = recognition;
      }

      // 4. Connect WebSocket to the BFF Server Proxy
      const isResumeSession = dialogueRef.current.length > 0;
      let lastQuestionText = '';
      if (isResumeSession) {
        for (let i = dialogueRef.current.length - 1; i >= 0; i--) {
          if (dialogueRef.current[i].role === 'interviewer') {
            lastQuestionText = dialogueRef.current[i].text;
            break;
          }
        }
      }

      const formattedWsUrl = `${wsUrl}?token=${token}&category=${category}&isResume=${isResumeSession}&lastQuestion=${encodeURIComponent(lastQuestionText)}`;
      const ws = new WebSocket(formattedWsUrl);
      wsRef.current = ws;

      ws.onmessage = async (event) => {
        try {
          const json = JSON.parse(event.data);

          if (json.type === 'proxy_status' && json.status === 'connected') {
            setWsStatus('connected');
            setupAudioProcessor(stream, audioContext);
          }

          // Handle incoming Gemini voice audio
          if (json.serverContent?.modelTurn) {
            if (isWaitingForModelResponseRef.current) {
              // Stop speech recognition when model starts speaking
              if (recognitionRef.current) {
                try {
                  recognitionRef.current.stop();
                } catch (e) { }
              }

              // Save the previous Q&A pair before starting new model turn
              saveLastQAPair();

              currentInterviewerBubbleIdRef.current = null;
              isWaitingForModelResponseRef.current = false;
            }
          }

          if (json.serverContent?.modelTurn?.parts) {
            for (const part of json.serverContent.modelTurn.parts) {
              if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
                playPCMChunk(part.inlineData.data);
              }
              if (part.text) {
                if (!currentInterviewerBubbleIdRef.current) {
                  updateChatBubble('interviewer', part.text, 'new');
                } else {
                  updateChatBubble('interviewer', part.text, 'append');
                }
              }
            }
          }

          // Handle Gemini input transcription (User's speech)
          if (json.serverContent?.inputTranscription?.text) {
            const rawText = json.serverContent.inputTranscription.text;
            console.log('[Gemini Input Transcription] Received:', rawText);
            const formatted = formatTranscriptText(rawText);
            if (formatted) {
              if (!currentUserBubbleIdRef.current) {
                updateChatBubble('user', formatted, 'new');
              } else {
                updateChatBubble('user', formatted, 'replace');
              }
            }
          }

          // Handle Gemini output transcription (AI Interviewer)
          if (json.serverContent?.outputTranscription?.text) {
            const text = json.serverContent.outputTranscription.text;
            if (!currentInterviewerBubbleIdRef.current) {
              updateChatBubble('interviewer', text, 'new');
            } else {
              updateChatBubble('interviewer', text, 'append');
            }
          }

          // Save dialogue turn to database when finalized
          if (json.serverContent?.turnComplete) {
            currentUserBubbleIdRef.current = null;
            isWaitingForModelResponseRef.current = true;
            if (recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) { }
            }
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        stopVoiceSession();
      };

      ws.onerror = (err) => {
        console.error('WebSocket proxy error:', err);
        stopVoiceSession();
      };

    } catch (err) {
      console.error('Failed to initialize audio inputs:', err);
      stopVoiceSession();
      alert('Could not access microphone. Ensure permissions are granted.');
    }
  };

  const setupAudioProcessor = (stream: MediaStream, audioContext: AudioContext) => {
    const source = audioContext.createMediaStreamSource(stream);

    // Create ScriptProcessor for capturing raw mic buffer chunks
    const processor = audioContext.createScriptProcessor(2048, 1, 1);
    scriptProcessorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) return;

      // Skip recording/streaming if Gemini speaker is currently playing audio response
      if (audioContext && audioContext.currentTime < nextPlaybackTimeRef.current) {
        return;
      }

      const inputBuffer = e.inputBuffer.getChannelData(0); // Float32Array
      const pcmBuffer = float32ToInt16(inputBuffer);
      const base64Audio = arrayBufferToBase64(pcmBuffer);

      // Stream media chunks upstream
      const payload = {
        realtimeInput: {
          audio: {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Audio
          }
        }
      };
      wsRef.current.send(JSON.stringify(payload));
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
  };

  const stopVoiceSession = () => {
    setIsVoiceActive(false);
    setWsStatus('disconnected');
    setIsSpeaking(false);
    if (speakingTimeoutRef.current) {
      clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = null;
    }

    // Tear down WebSocket connection
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) { }
      recognitionRef.current = null;
    }

    // Terminate microphone tracks
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }

    // Stop audio processor
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    // Close Web Audio Context
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      audioContextRef.current = null;
    }

    nextPlaybackTimeRef.current = 0;

    // Check dialogue log for QA pairs, save to database
    saveDialoguePairs();
  };

  // Extract completed Q&A pairs from current dialogue list and save to SQLite
  const saveDialoguePairs = async () => {
    if (dialogueRef.current.length < 2 || !token) return;

    for (let i = 0; i < dialogueRef.current.length - 1; i++) {
      const current = dialogueRef.current[i];
      const next = dialogueRef.current[i + 1];

      if (current.role === 'interviewer' && next.role === 'user') {
        const pairKey = `${current.id}-${next.id}`;
        if (savedPairsRef.current.has(pairKey)) continue;

        savedPairsRef.current.add(pairKey);

        try {
          await fetch(`${apiUrl}/pair`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              question: current.text,
              answer: next.text,
              category: selectedCategoryRef.current
            })
          });
        } catch (err) {
          console.error('Error saving QA pair:', err);
        }
      }
    }

    if (onSaveSuccess) onSaveSuccess();
  };

  const playPCMChunk = (base64Data: string) => {
    const audioCtx = audioContextRef.current;
    if (!audioCtx || audioCtx.state === 'closed') return;

    try {
      const binaryString = window.atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit PCM bytes to Float32 sample array
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      // Initialize buffer at 24000Hz (Gemini response sample rate)
      const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.copyToChannel(float32Array, 0);

      // Create audio source node
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      // Schedule play timing to prevent overlaps
      const now = audioCtx.currentTime;
      if (nextPlaybackTimeRef.current < now) {
        nextPlaybackTimeRef.current = now;
      }

      source.start(nextPlaybackTimeRef.current);
      nextPlaybackTimeRef.current += audioBuffer.duration;

      // Handle isSpeaking state mapping
      setIsSpeaking(true);
      const timeRemainingMs = (nextPlaybackTimeRef.current - audioCtx.currentTime) * 1000;
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }
      speakingTimeoutRef.current = setTimeout(() => {
        setIsSpeaking(false);
      }, timeRemainingMs);
    } catch (err) {
      console.error('Failed to play decoded PCM chunk:', err);
    }
  };

  const resetConversation = () => {
    stopVoiceSession();
    updateDialogueState([]);
    currentUserBubbleIdRef.current = null;
    currentInterviewerBubbleIdRef.current = null;
    savedPairsRef.current.clear();
    setSelectedCategory(null);
  };

  return {
    isVoiceActive,
    wsStatus,
    isSpeaking,
    dialogue,
    selectedCategory,
    setSelectedCategory,
    startVoiceSession,
    stopVoiceSession,
    resetConversation,
    dialogueEndRef
  };
};
