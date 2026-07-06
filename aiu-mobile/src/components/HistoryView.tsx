import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Trash2, Calendar, MessageSquare } from 'lucide-react-native';
import { QAPair } from '../../App';
import { ThemeColors } from '../themes/themeColors';

const Trash2Icon = Trash2 as any;
const CalendarIcon = Calendar as any;
const MessageSquareIcon = MessageSquare as any;

interface HistoryViewProps {
  isLoadingHistory: boolean;
  history: QAPair[];
  deletePair: (id: number) => void;
  parseUTCTimestamp: (ts: string) => Date;
  colors: ThemeColors;
}

export default function HistoryView({
  isLoadingHistory,
  history,
  deletePair,
  parseUTCTimestamp,
  colors
}: HistoryViewProps) {
  const formatDateTime = (ts: string) => {
    const d = parseUTCTimestamp(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (isLoadingHistory) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Loading conversation history...
        </Text>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyIconContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MessageSquareIcon size={36} color={colors.mutedForeground} />
        </View>
        <Text style={[styles.emptyText, { color: colors.foreground }]}>No conversation records yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
          Start an interview to capture and preserve your knowledge!
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.historyBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.contentArea}>
              <Text style={[styles.questionText, { color: colors.foreground }]}>
                Q: {item.question}
              </Text>
              <Text style={[styles.answerText, { color: colors.foreground }]}>
                A: {item.answer}
              </Text>
              <View style={styles.footerRow}>
                <CalendarIcon size={12} color={colors.mutedForeground} style={{ marginRight: 4 } as any} />
                <Text style={[styles.timestampText, { color: colors.mutedForeground }]}>
                  {formatDateTime(item.timestamp)}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.trashBtn, { borderColor: colors.border }]}
              onPress={() => deletePair(item.id)}
              activeOpacity={0.7}
            >
              <Trash2Icon size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  historyBlock: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  contentArea: {
    flex: 1,
    gap: 8,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  answerText: {
    fontSize: 14,
    lineHeight: 18,
    opacity: 0.9,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timestampText: {
    fontSize: 11,
  },
  trashBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef444410',
  },
});
