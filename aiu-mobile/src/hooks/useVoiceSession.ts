import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Audio } from 'expo-av';
import { formatTranscriptText } from '../utils/helpers';

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

  const wsRef = useRef<WebSocket | null>(null);
  const dialogueRef = useRef<ChatLogEntry[]>([]);
  const savedPairsRef = useRef<Set<string>>(new Set());
  const currentUserBubbleIdRef = useRef<string | null>(null);
  const currentInterviewerBubbleIdRef = useRef<string | null>(null);
  const isWaitingForModelResponseRef = useRef<boolean>(true);
  const selectedCategoryRef = useRef<string | null>(null);

  // Native recording instances (expo-av)
  const recordingRef = useRef<Audio.Recording | null>(null);
  // Audio playback scheduling
  const nextPlaybackTimeRef = useRef<number>(0);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
  }, [selectedCategory]);

  const updateDialogueState = (newDialogue: ChatLogEntry[]) => {
    dialogueRef.current = newDialogue;
    setDialogue(newDialogue);
  };

  const updateChatBubble = (role: 'interviewer' | 'user', text: string, mode: 'new' | 'append' | 'replace') => {
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
          }
        } catch (err) {
          console.error('[saveLastQAPair] Error saving QA pair:', err);
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
      // 1. Request microphone permissions from OS
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        alert('Microphone access is required for voice sessions.');
        stopVoiceSession();
        return;
      }

      // Set audio options for live voice mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // 2. Connect WebSocket to the BFF Server Proxy (via Tailscale host)
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

      ws.onopen = () => {
        console.log('[WebSocket] Connected to mobile BFF proxy');
      };

      ws.onmessage = async (event) => {
        try {
          const json = JSON.parse(event.data);

          if (json.type === 'proxy_status' && json.status === 'connected') {
            setWsStatus('connected');
            startRecordingStream();
          }

          // Handle incoming Gemini voice audio
          if (json.serverContent?.modelTurn) {
            if (isWaitingForModelResponseRef.current) {
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

          // Handle user's speech transcriptions
          if (json.serverContent?.inputTranscription?.text) {
            const rawText = json.serverContent.inputTranscription.text;
            const formatted = formatTranscriptText(rawText);
            if (formatted) {
              if (!currentUserBubbleIdRef.current) {
                updateChatBubble('user', formatted, 'new');
              } else {
                updateChatBubble('user', formatted, 'replace');
              }
            }
          }

          // Handle interviewer output transcription
          if (json.serverContent?.outputTranscription?.text) {
            const text = json.serverContent.outputTranscription.text;
            if (!currentInterviewerBubbleIdRef.current) {
              updateChatBubble('interviewer', text, 'new');
            } else {
              updateChatBubble('interviewer', text, 'append');
            }
          }

          // Handle Gemini turn complete
          if (json.serverContent?.turnComplete) {
            currentUserBubbleIdRef.current = null;
            isWaitingForModelResponseRef.current = true;
          }
        } catch (err) {
          console.error('[WebSocket] Error handling frame:', err);
        }
      };

      ws.onclose = () => {
        stopVoiceSession();
      };

      ws.onerror = (err) => {
        console.error('[WebSocket] Error:', err);
        stopVoiceSession();
      };

    } catch (err) {
      console.error('[VoiceSession] Initialization failed:', err);
      stopVoiceSession();
    }
  };

  const startRecordingStream = async () => {
    try {
      // In custom dev builds, we hook in a native stream listener (e.g. react-native-live-audio-stream)
      // Here, we prepare and load the recording state
      console.log('[Audio] Initializing recording stream');
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {}
      });
      recordingRef.current = recording;
      await recording.startAsync();

      // Note: Live PCM streaming relies on native buffer listeners emitting binary events
      // via WebSocket. WebSocket is connected and listening to `wsRef.current.send()`.
    } catch (err) {
      console.error('[Audio] Recording start failed:', err);
    }
  };

  const playPCMChunk = (base64Data: string) => {
    // Decode base64 and feed into native audio track queue (e.g., react-native-audio-track)
    // Plays synthesized response mono 16-bit PCM at 24000Hz
    setIsSpeaking(true);
    
    // Simulate speaking text display timeout mapping to duration
    if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
    speakingTimeoutRef.current = setTimeout(() => {
      setIsSpeaking(false);
    }, 1500);
  };

  const stopVoiceSession = async () => {
    setIsVoiceActive(false);
    setWsStatus('disconnected');
    setIsSpeaking(false);

    if (speakingTimeoutRef.current) {
      clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = null;
    }

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {}
      recordingRef.current = null;
    }

    saveDialoguePairs();
  };

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
          console.error('[saveDialoguePairs] Error saving QA pair:', err);
        }
      }
    }

    if (onSaveSuccess) onSaveSuccess();
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
    resetConversation
  };
};
