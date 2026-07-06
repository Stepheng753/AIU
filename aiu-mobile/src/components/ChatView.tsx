import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Briefcase, Compass, Users, Activity, Power } from 'lucide-react-native';
import VoiceChat from './VoiceChat';
import { ChatLogEntry, UserProfile } from '../../App';
import { ThemeColors } from '../themes/themeColors';

const BriefcaseIcon = Briefcase as any;
const CompassIcon = Compass as any;
const UsersIcon = Users as any;
const ActivityIcon = Activity as any;
const PowerIcon = Power as any;

interface ChatViewProps {
  dialogue: ChatLogEntry[];
  user: UserProfile | null;
  isVoiceActive: boolean;
  wsStatus: 'disconnected' | 'connecting' | 'connected';
  isSpeaking: boolean;
  startVoiceSession: (category: string) => void;
  stopVoiceSession: () => void;
  renderMessageText: (text: string, style?: any) => React.ReactNode;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  resetConversation: () => void;
  colors: ThemeColors;
}

const { width } = Dimensions.get('window');

export default function ChatView({
  dialogue,
  user,
  isVoiceActive,
  wsStatus,
  isSpeaking,
  startVoiceSession,
  stopVoiceSession,
  renderMessageText,
  selectedCategory,
  setSelectedCategory,
  resetConversation,
  colors
}: ChatViewProps) {
  const flatListRef = useRef<FlatList | null>(null);

  const categories = [
    {
      id: 'career',
      title: 'Career & Ambition',
      description: 'Preserve your career journey, professional achievements, and work philosophy.',
      icon: <BriefcaseIcon size={22} color={colors.primary} />,
      bgColor: colors.primary + '15'
    },
    {
      id: 'life_advice',
      title: 'Life Advice & Wisdom',
      description: 'Document your personal values, life lessons, and wisdom for future generations.',
      icon: <CompassIcon size={22} color={colors.secondary} />,
      bgColor: colors.secondary + '15'
    },
    {
      id: 'family',
      title: 'Family & Roots',
      description: 'Record your childhood memories, ancestral history, and family relationships.',
      icon: <UsersIcon size={22} color="#6ea3c1" />,
      bgColor: '#6ea3c115'
    },
    {
      id: 'health',
      title: 'Health & Wellness',
      description: 'Share your personal health philosophy, active routines, and general well-being tips.',
      icon: <ActivityIcon size={22} color="#10b981" />,
      bgColor: '#10b98115'
    }
  ];

  // Auto scroll to bottom when dialogue updates
  useEffect(() => {
    if (dialogue.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [dialogue]);

  const handleSelectCategory = (id: string) => {
    setSelectedCategory(id);
    startVoiceSession(id);
  };

  const getStatusText = () => {
    if (wsStatus === 'connecting') return 'NEGOTIATING HANDSHAKE...';
    if (wsStatus === 'connected') {
      return isSpeaking ? 'GEMINI TALKING...' : 'STREAMING VOICE INPUT • TAP TO PAUSE';
    }
    return 'CONSOLE PAUSED • TAP MIC TO RESUME';
  };

  // Render Track Selection Grid if no category has been chosen
  if (selectedCategory === null) {
    return (
      <View style={[styles.categoryContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.mainTitle, { color: colors.foreground }]}>Select Interview Track</Text>
        <Text style={[styles.mainSubtitle, { color: colors.mutedForeground }]}>
          Choose a focus area for your voice session to start archiving your legacy.
        </Text>

        <View style={styles.grid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleSelectCategory(cat.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: cat.bgColor }]}>
                {cat.icon}
              </View>
              <View style={styles.infoBox}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{cat.title}</Text>
                <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>{cat.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  // Active chat session interface
  return (
    <View style={[styles.chatContainer, { backgroundColor: colors.background }]}>
      
      {/* Dialogue List */}
      <FlatList
        ref={flatListRef}
        data={dialogue}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.dialogueList}
        onContentSizeChange={() => {
          if (dialogue.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={{ color: colors.mutedForeground, textAlign: 'center' }}>
              Connecting with your AI interviewer...
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isInterviewer = item.role === 'interviewer';
          return (
            <View
              style={[
                styles.bubbleWrapper,
                isInterviewer ? styles.bubbleInterviewerWrapper : styles.bubbleUserWrapper
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  isInterviewer
                    ? [styles.bubbleInterviewer, { backgroundColor: colors.card, borderColor: colors.border }]
                    : [styles.bubbleUser, { backgroundColor: colors.primary }]
                ]}
              >
                {renderMessageText(
                  item.text,
                  isInterviewer ? { color: colors.foreground } : { color: colors.primaryForeground }
                )}
              </View>
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {isInterviewer ? 'Gemini AI' : user?.name || 'User'} •{' '}
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
      />

      {/* Mic visualizer and Action panel */}
      <View style={[styles.controlPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <VoiceChat
          isListening={isVoiceActive && wsStatus === 'connected' && !isSpeaking}
          isProcessing={wsStatus === 'connecting'}
          isSpeaking={isSpeaking}
          onClick={isVoiceActive ? stopVoiceSession : () => startVoiceSession(selectedCategory)}
          statusText={getStatusText()}
          disabled={wsStatus === 'connecting'}
          colors={colors}
        />

        {/* End Session Button */}
        <TouchableOpacity
          style={[styles.endBtn, { borderColor: '#ef4444' }]}
          onPress={resetConversation}
          activeOpacity={0.7}
        >
          <PowerIcon size={14} color="#ef4444" style={{ marginRight: 6 }} />
          <Text style={styles.endBtnText}>End Session</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  categoryContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  mainSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  grid: {
    gap: 12,
  },
  categoryCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  chatContainer: {
    flex: 1,
  },
  dialogueList: {
    padding: 16,
    paddingBottom: 24,
    gap: 16,
  },
  emptyChat: {
    paddingVertical: 80,
  },
  bubbleWrapper: {
    width: '100%',
    marginBottom: 4,
  },
  bubbleInterviewerWrapper: {
    alignItems: 'flex-start',
  },
  bubbleUserWrapper: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  bubbleInterviewer: {
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
    borderWidth: 0,
  },
  metaText: {
    fontSize: 10,
    marginTop: 4,
    marginHorizontal: 8,
  },
  controlPanel: {
    borderTopWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 6,
  },
  endBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 38,
    paddingHorizontal: 24,
    marginTop: 4,
    backgroundColor: '#ef444410',
  },
  endBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
