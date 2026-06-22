import React from 'react';
import { VoiceChat } from './ui/ia-siri-chat';
import type { ChatLogEntry, UserProfile } from '../App';

interface ChatViewProps {
  dialogue: ChatLogEntry[];
  user: UserProfile | null;
  isVoiceActive: boolean;
  wsStatus: 'disconnected' | 'connecting' | 'connected';
  isSpeaking: boolean;
  startVoiceSession: () => void;
  stopVoiceSession: () => void;
  dialogueEndRef: React.RefObject<HTMLDivElement | null>;
  renderMessageText: (text: string) => React.ReactNode;
}

export default function ChatView({
  dialogue,
  user,
  isVoiceActive,
  wsStatus,
  isSpeaking,
  startVoiceSession,
  stopVoiceSession,
  dialogueEndRef,
  renderMessageText
}: ChatViewProps) {
  return (
    <div className="chat-view-container">
      {/* Dialogue Area */}
      <section className="dialogue-container">
        {dialogue.length === 0 ? null : (
          <>
            {dialogue.map((entry) => (
              <div key={entry.id} className={`dialogue-bubble ${entry.role}`}>
                <p>{renderMessageText(entry.text)}</p>
                <span className="bubble-meta">
                  {entry.role === 'interviewer' ? 'Gemini AI' : user?.name || 'User'} • {entry.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
            <div ref={dialogueEndRef} />
          </>
        )}
      </section>

      {/* Floating Centered Mic Control */}
      <div className="floating-mic-container">
        <VoiceChat
          isListening={isVoiceActive && wsStatus === 'connected' && !isSpeaking}
          isProcessing={wsStatus === 'connecting'}
          isSpeaking={isSpeaking}
          onClick={isVoiceActive ? stopVoiceSession : startVoiceSession}
          statusText={
            wsStatus === 'connecting'
              ? 'NEGOTIATING HANDSHAKE...'
              : wsStatus === 'connected'
                ? (isSpeaking ? 'GEMINI TALKING...' : 'STREAMING SOUND INPUT • CLICK TO FINISH')
                : 'CONSOLE IDLE • UNMUTE MIC TO CHAT'
          }
          disabled={wsStatus === 'connecting'}
        />
      </div>
    </div>
  );
}
