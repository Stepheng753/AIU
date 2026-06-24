import { useState, useEffect } from 'react';
import { parseColorToRgb, getContrastMaskColor } from '../themes/registry';

export const useTheme = () => {
  // Theme mode state (light/dark) defaulting to system theme
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Active theme state (maps to the custom CSS theme stylesheet)
  const [activeTheme, setActiveTheme] = useState<string>(() => {
    const val = localStorage.getItem('activeTheme');
    if (val === 'default') return 'starry-night'; // Migrate legacy default value to starry-night
    return val || 'starry-night';
  });

  // Computed high-contrast mask color for InkReveal
  const [computedMaskColor, setComputedMaskColor] = useState<[number, number, number]>(
    theme === 'dark' ? [24, 26, 36] : [245, 247, 250]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      const bgVal = window.getComputedStyle(document.documentElement).getPropertyValue('--background');
      if (bgVal) {
        const rgb = parseColorToRgb(bgVal);
        if (rgb) {
          setComputedMaskColor(getContrastMaskColor(rgb));
          return;
        }
      }
      setComputedMaskColor(theme === 'dark' ? [24, 26, 36] : [245, 247, 250]);
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTheme, theme]);

  // Apply light/dark mode changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Apply custom theme stylesheet link loading
  useEffect(() => {
    let link = document.getElementById('dynamic-theme-stylesheet') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.id = 'dynamic-theme-stylesheet';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = `/themes/${activeTheme}.css`;
    localStorage.setItem('activeTheme', activeTheme);
  }, [activeTheme]);

  return {
    theme,
    setTheme,
    activeTheme,
    setActiveTheme,
    computedMaskColor
  };
};
