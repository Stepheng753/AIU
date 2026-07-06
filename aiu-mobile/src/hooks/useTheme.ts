import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME_COLOR_MAP, ThemeColors } from '../themes/themeColors';

export interface ThemeRegistryItem {
  id: string;
  name: string;
  description: string;
  previewColor: string;
}

export const AVAILABLE_THEMES: ThemeRegistryItem[] = Object.keys(THEME_COLOR_MAP).map(key => {
  const name = key
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  return {
    id: key,
    name,
    description: `${name} color scheme`,
    previewColor: THEME_COLOR_MAP[key].light.primary
  };
});

export const useTheme = () => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const [activeTheme, setActiveThemeState] = useState<string>('starry-night');

  useEffect(() => {
    // Load persisted settings
    const loadSettings = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('themeMode');
        if (storedTheme === 'light' || storedTheme === 'dark') {
          setThemeMode(storedTheme);
        } else if (systemScheme === 'light' || systemScheme === 'dark') {
          setThemeMode(systemScheme);
        }

        const storedActiveTheme = await AsyncStorage.getItem('activeTheme');
        if (storedActiveTheme && THEME_COLOR_MAP[storedActiveTheme]) {
          setActiveThemeState(storedActiveTheme);
        }
      } catch (err) {
        console.error('Failed to load theme settings:', err);
      }
    };
    loadSettings();
  }, [systemScheme]);

  const setTheme = async (mode: 'light' | 'dark') => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (err) {
      console.error('Failed to persist theme mode:', err);
    }
  };

  const setActiveTheme = async (themeId: string) => {
    try {
      if (THEME_COLOR_MAP[themeId]) {
        setActiveThemeState(themeId);
        await AsyncStorage.setItem('activeTheme', themeId);
      }
    } catch (err) {
      console.error('Failed to persist active theme:', err);
    }
  };

  const colors: ThemeColors = THEME_COLOR_MAP[activeTheme] 
    ? THEME_COLOR_MAP[activeTheme][themeMode]
    : THEME_COLOR_MAP['starry-night'][themeMode];

  return {
    theme: themeMode,
    setTheme,
    activeTheme,
    setActiveTheme,
    colors,
    availableThemes: AVAILABLE_THEMES
  };
};
