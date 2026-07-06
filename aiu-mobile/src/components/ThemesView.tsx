import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions
} from 'react-native';
import { ThemeColors } from '../themes/themeColors';
import { ThemeRegistryItem } from '../hooks/useTheme';

interface ThemesViewProps {
  theme: 'light' | 'dark';
  setTheme: (mode: 'light' | 'dark') => void;
  activeTheme: string;
  setActiveTheme: (id: string) => void;
  availableThemes: ThemeRegistryItem[];
  colors: ThemeColors;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2 - 8; // responsive two-column grid math

export default function ThemesView({
  theme,
  setTheme,
  activeTheme,
  setActiveTheme,
  availableThemes,
  colors
}: ThemesViewProps) {
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
      
      {/* Light / Dark Mode Toggle */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Appearance Mode</Text>
      </View>
      <View style={[styles.modeToggleGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.modeBtn,
            theme === 'light' && [styles.activeModeBtn, { backgroundColor: colors.primary }]
          ]}
          onPress={() => setTheme('light')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.modeBtnText,
              theme === 'light' ? { color: colors.primaryForeground } : { color: colors.foreground }
            ]}
          >
            Light
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeBtn,
            theme === 'dark' && [styles.activeModeBtn, { backgroundColor: colors.primary }]
          ]}
          onPress={() => setTheme('dark')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.modeBtnText,
              theme === 'dark' ? { color: colors.primaryForeground } : { color: colors.foreground }
            ]}
          >
            Dark
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Color Palette List */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Color Palette</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
          Choose from 40 custom design theme profiles.
        </Text>
      </View>

      <View style={styles.grid}>
        {availableThemes.map((t) => {
          const isActive = activeTheme === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.themeCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                isActive && { borderColor: colors.primary, borderWidth: 2 }
              ]}
              onPress={() => setActiveTheme(t.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.colorPreview, { backgroundColor: t.previewColor }]} />
              <View style={styles.metaInfo}>
                <Text style={[styles.themeName, { color: colors.foreground }]} numberOfLines={1}>
                  {t.name}
                </Text>
                <Text style={[styles.themeDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {t.description}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  modeToggleGroup: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
  },
  modeBtn: {
    flex: 1,
    height: 38,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeModeBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeCard: {
    width: cardWidth,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    alignItems: 'flex-start',
    gap: 8,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  metaInfo: {
    width: '100%',
  },
  themeName: {
    fontSize: 13,
    fontWeight: '700',
  },
  themeDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
});
