import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Menu, X, Mic } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

const MenuIcon = Menu as any;
const XIcon = X as any;
const MicIcon = Mic as any;

// Component and Hook imports
import AuthView from './src/components/AuthView';
import ChatView from './src/components/ChatView';
import HistoryView from './src/components/HistoryView';
import ThemesView from './src/components/ThemesView';
import UserSettings from './src/components/UserSettings';
import { useTheme } from './src/hooks/useTheme';
import { useVoiceSession } from './src/hooks/useVoiceSession';
import { renderMessageText, parseUTCTimestamp } from './src/utils/helpers';

// Local Tailscale Endpoint Config
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://stephen-windows:3001/api';
const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://stephen-windows:3001';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
}

export interface QAPair {
  id: number;
  question: string;
  answer: string;
  timestamp: string;
}

export type { ChatLogEntry } from './src/hooks/useVoiceSession';

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

function MainApp() {
  const {
    theme,
    setTheme,
    activeTheme,
    setActiveTheme,
    colors,
    availableThemes
  } = useTheme();

  // Auth States
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // App Layout States
  const [dashboardView, setDashboardView] = useState<'chat' | 'history' | 'themes' | 'settings'>('chat');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Data States
  const [history, setHistory] = useState<QAPair[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Voice Session Hook
  const {
    isVoiceActive,
    wsStatus,
    isSpeaking,
    dialogue,
    selectedCategory,
    setSelectedCategory,
    startVoiceSession,
    stopVoiceSession,
    resetConversation
  } = useVoiceSession({
    token,
    apiUrl: API_URL,
    wsUrl: WS_URL,
    onSaveSuccess: () => fetchHistory()
  });

  // Load JWT token from SecureStore on startup
  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('token');
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (err) {
        console.error('Failed to load secure token:', err);
      } finally {
        setIsInitializing(false);
      }
    };
    loadToken();
  }, []);

  // Sync token changes to store and retrieve profile details
  useEffect(() => {
    if (token) {
      SecureStore.setItemAsync('token', token);
      fetchUserProfile();
    } else {
      SecureStore.deleteItemAsync('token');
      setUser(null);
    }
  }, [token]);

  // Load conversation records when profile is parsed
  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        // Fallback decoded token logic if offline or api fails
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          // Decode base64 URL safe safely
          const cleanBase64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
          // Lightweight JS base64 decode
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
          const lookup = new Uint8Array(256);
          for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
          let bufferLength = cleanBase64.length * 0.75;
          if (cleanBase64.endsWith('=')) {
            bufferLength--;
            if (cleanBase64.endsWith('==')) bufferLength--;
          }
          const bytes = new Uint8Array(bufferLength);
          let p = 0;
          for (let i = 0; i < cleanBase64.length; i += 4) {
            const enc1 = lookup[cleanBase64.charCodeAt(i)];
            const enc2 = lookup[cleanBase64.charCodeAt(i + 1)];
            const enc3 = lookup[cleanBase64.charCodeAt(i + 2)];
            const enc4 = lookup[cleanBase64.charCodeAt(i + 3)];
            bytes[p++] = (enc1 << 2) | (enc2 >> 4);
            if (enc3 !== 64) bytes[p++] = ((enc2 & 15) << 4) | (enc3 >> 2);
            if (enc4 !== 64) bytes[p++] = ((enc3 & 3) << 6) | enc4;
          }
          let text = '';
          for (let i = 0; i < bytes.length; i++) text += String.fromCharCode(bytes[i]);
          const decoded = JSON.parse(text);
          setUser({
            id: decoded.id,
            email: decoded.email,
            name: decoded.name || 'Developer User'
          });
        }
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  };

  const fetchHistory = async () => {
    if (!token) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_URL}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Network error fetching history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const deletePair = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/pair/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setHistory(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete QA pair:', err);
    }
  };

  const clearHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/history`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setHistory([]);
      }
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const handleLogout = () => {
    stopVoiceSession();
    setToken(null);
    setUser(null);
    setSelectedCategory(null);
  };

  const toggleMenu = () => {
    if (!isMenuOpen) {
      stopVoiceSession();
      setIsMenuOpen(true);
    } else {
      setIsMenuOpen(false);
    }
  };

  const handleAuthSuccess = (newToken: string, activeUser: UserProfile) => {
    setToken(newToken);
    setUser(activeUser);
  };

  if (isInitializing) {
    return (
      <View style={[styles.loadingCenter, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!token) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        <AuthView apiURL={API_URL} colors={colors} onAuthSuccess={handleAuthSuccess} />
      </SafeAreaView>
    );
  }

  const renderActiveView = () => {
    switch (dashboardView) {
      case 'chat':
        return (
          <ChatView
            dialogue={dialogue}
            user={user}
            isVoiceActive={isVoiceActive}
            wsStatus={wsStatus}
            isSpeaking={isSpeaking}
            startVoiceSession={startVoiceSession}
            stopVoiceSession={stopVoiceSession}
            renderMessageText={(text, style) => renderMessageText(text, style)}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            resetConversation={resetConversation}
            colors={colors}
          />
        );
      case 'history':
        return (
          <HistoryView
            isLoadingHistory={isLoadingHistory}
            history={history}
            deletePair={deletePair}
            parseUTCTimestamp={parseUTCTimestamp}
            colors={colors}
          />
        );
      case 'themes':
        return (
          <ThemesView
            theme={theme}
            setTheme={setTheme}
            activeTheme={activeTheme}
            setActiveTheme={setActiveTheme}
            availableThemes={availableThemes}
            colors={colors}
          />
        );
      case 'settings':
        return (
          <UserSettings
            user={user}
            token={token}
            apiURL={API_URL}
            onUpdateProfile={(updatedUser, newToken) => {
              setUser(updatedUser);
              if (newToken) setToken(newToken);
            }}
            onClearHistory={clearHistory}
            hasHistory={history.length > 0}
            colors={colors}
          />
        );
    }
  };

  return (
    <SafeAreaView style={[styles.viewport, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Top Header Navigation */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity style={styles.menuToggle} onPress={toggleMenu}>
          {isMenuOpen ? (
            <XIcon size={20} color={colors.foreground} />
          ) : (
            <MenuIcon size={20} color={colors.foreground} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoAndTitle}
          onPress={() => {
            setDashboardView('chat');
            setIsMenuOpen(false);
          }}
        >
          <MicIcon size={16} color={colors.primary} style={{ marginRight: 6 } as any} />
          <Text style={[styles.title, { color: colors.foreground }]}>AIU</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={[styles.logoutText, { color: '#ef4444' }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Main Body */}
      <View style={styles.body}>
        {isMenuOpen ? (
          /* Hamburger Menu Overlay */
          <View style={[styles.menuOverlay, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.menuItem, dashboardView === 'chat' && [styles.activeMenuItem, { backgroundColor: colors.primary + '15' }]]}
              onPress={() => {
                setDashboardView('chat');
                setIsMenuOpen(false);
              }}
            >
              <Text style={[styles.menuItemText, { color: colors.foreground }, dashboardView === 'chat' && { color: colors.primary }]}>Current Convo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, dashboardView === 'history' && [styles.activeMenuItem, { backgroundColor: colors.primary + '15' }]]}
              onPress={() => {
                setDashboardView('history');
                setIsMenuOpen(false);
              }}
            >
              <Text style={[styles.menuItemText, { color: colors.foreground }, dashboardView === 'history' && { color: colors.primary }]}>Past Convos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, dashboardView === 'themes' && [styles.activeMenuItem, { backgroundColor: colors.primary + '15' }]]}
              onPress={() => {
                setDashboardView('themes');
                setIsMenuOpen(false);
              }}
            >
              <Text style={[styles.menuItemText, { color: colors.foreground }, dashboardView === 'themes' && { color: colors.primary }]}>Themes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, dashboardView === 'settings' && [styles.activeMenuItem, { backgroundColor: colors.primary + '15' }]]}
              onPress={() => {
                setDashboardView('settings');
                setIsMenuOpen(false);
              }}
            >
              <Text style={[styles.menuItemText, { color: colors.foreground }, dashboardView === 'settings' && { color: colors.primary }]}>User Settings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          renderActiveView()
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewport: {
    flex: 1,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  menuToggle: {
    padding: 6,
  },
  logoAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1.0,
  },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
  },
  body: {
    flex: 1,
  },
  menuOverlay: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  menuItem: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  activeMenuItem: {
    borderWidth: 0,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
