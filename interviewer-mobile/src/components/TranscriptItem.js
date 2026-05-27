import React from 'react';
import { View as RNView, Text as RNText, StyleSheet as RNStyleSheet, TouchableOpacity as RNTouchableOpacity } from 'react-native';
import { colors, spacing } from '../theme/theme';

export default function TranscriptItem({ item, onRemove }) {
  const isUser = item.role === 'user';
  const theme = colors.light; // Assuming light theme for now

  return (
    <RNView style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      <RNText style={styles.role}>{isUser ? 'You' : 'AI Interviewer'}</RNText>
      <RNText style={styles.text}>{item.text}</RNText>
      
      {isUser && (
        <RNView style={styles.actions}>
          <RNTouchableOpacity style={styles.keepBtn} disabled>
            <RNText style={styles.keepText}>Keep</RNText>
          </RNTouchableOpacity>
          <RNTouchableOpacity style={styles.removeBtn} onPress={() => onRemove(item.id)}>
            <RNText style={styles.removeText}>Remove</RNText>
          </RNTouchableOpacity>
        </RNView>
      )}
    </RNView>
  );
}

const theme = colors.light;
const styles = RNStyleSheet.create({
  container: {
    marginVertical: spacing.sm,
    padding: spacing.md,
    borderRadius: spacing.radius,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    backgroundColor: theme.primary,
  },
  aiContainer: {
    alignSelf: 'flex-start',
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
  },
  role: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    color: theme.mutedForeground,
  },
  text: {
    fontSize: 16,
    color: theme.foreground,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  keepBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  keepText: {
    color: theme.mutedForeground,
    fontSize: 12,
  },
  removeBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    backgroundColor: theme.destructive,
  },
  removeText: {
    color: theme.destructiveForeground,
    fontSize: 12,
  },
});
