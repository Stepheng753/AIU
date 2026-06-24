import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import './App.css';
import InkReveal from './components/ui/ink-reveal';
import UserSettings from './components/UserSettings';
import ThemesView from './components/ThemesView';
import AuthView from './components/AuthView';
import HistoryView from './components/HistoryView';
import ChatView from './components/ChatView';
import { parseUTCTimestamp, renderMessageText } from './utils/helpers';
import { useTheme } from './hooks/useTheme';
import { useVoiceSession } from './hooks/useVoiceSession';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

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

export type { ChatLogEntry } from './hooks/useVoiceSession';

function App() {
  const {
    theme,
    setTheme,
    activeTheme,
    setActiveTheme,
    computedMaskColor
  } = useTheme();

  // Auth State
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<UserProfile | null>(null);

  // Dashboard Sub-Views State
  const [dashboardView, setDashboardView] = useState<'chat' | 'history' | 'themes' | 'settings'>('chat');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Dashboard & History States
  const [history, setHistory] = useState<QAPair[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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
      } else {
        console.error('Failed to fetch QA history');
      }
    } catch (err) {
      console.error('Network error fetching history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const {
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
  } = useVoiceSession({
    token,
    apiUrl: API_URL,
    wsUrl: WS_URL,
    onSaveSuccess: fetchHistory
  });

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

  // Load user profile if token is present
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserProfile();
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  // Load history when user is authenticated
  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      if (!token) return;

      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        // Fallback to decode if API call is not successful
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          window.atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        setUser({
          id: decoded.id,
          email: decoded.email,
          name: decoded.name || 'Developer User'
        });
      }
    } catch (err) {
      console.error('Failed to retrieve user profile:', err);
      handleLogout();
    }
  };

  const handleLogout = () => {
    stopVoiceSession();
    setToken(null);
    setUser(null);
    setSelectedCategory(null);
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
    if (!token || !window.confirm('Are you sure you want to clear your entire interview history?')) return;
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

  if (!token) {
    return (
      <AuthView
        apiURL={API_URL}
        computedMaskColor={computedMaskColor}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <div className="app-viewport">
      <InkReveal maskColor={computedMaskColor} />
      <div className="app-card">
        {/* Top Header Bar */}
        <header className="app-header">
          <button
            className="menu-toggle-btn"
            onClick={toggleMenu}
            title={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <h1
            className="app-title clickable-title"
            onClick={() => { setDashboardView('chat'); setIsMenuOpen(false); }}
          >
            <img src="/logo.svg" className="app-logo" alt="Logo" />
            <span>AIU</span>
          </h1>

          <button className="logout-action-btn" onClick={handleLogout} title="Log Out">
            Logout
          </button>
        </header>

        {/* Bottom Section */}
        <div className="app-body">
          {isMenuOpen ? (
            /* Navigation Menu Overlay */
            <div className="nav-menu-container" key="menu">
              <div
                className={`nav-menu-item ${dashboardView === 'chat' ? 'active' : ''}`}
                onClick={() => { setDashboardView('chat'); setIsMenuOpen(false); }}
              >
                Current Convo
              </div>
              <div className="nav-menu-divider"></div>
              <div
                className={`nav-menu-item ${dashboardView === 'history' ? 'active' : ''}`}
                onClick={() => { setDashboardView('history'); setIsMenuOpen(false); }}
              >
                Past Convos
              </div>
              <div className="nav-menu-divider"></div>
              <div
                className={`nav-menu-item ${dashboardView === 'themes' ? 'active' : ''}`}
                onClick={() => { setDashboardView('themes'); setIsMenuOpen(false); }}
              >
                Themes
              </div>
              <div className="nav-menu-divider"></div>
              <div
                className={`nav-menu-item ${dashboardView === 'settings' ? 'active' : ''}`}
                onClick={() => { setDashboardView('settings'); setIsMenuOpen(false); }}
              >
                User Settings
              </div>
            </div>
          ) : (
            /* Active view content */
            <>
              {dashboardView === 'chat' && (
                <ChatView
                  dialogue={dialogue}
                  user={user}
                  isVoiceActive={isVoiceActive}
                  wsStatus={wsStatus}
                  isSpeaking={isSpeaking}
                  startVoiceSession={startVoiceSession}
                  stopVoiceSession={stopVoiceSession}
                  dialogueEndRef={dialogueEndRef}
                  renderMessageText={renderMessageText}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  resetConversation={resetConversation}
                />
              )}

              {dashboardView === 'history' && (
                <HistoryView
                  isLoadingHistory={isLoadingHistory}
                  history={history}
                  deletePair={deletePair}
                  parseUTCTimestamp={parseUTCTimestamp}
                />
              )}

              {dashboardView === 'themes' && (
                <ThemesView
                  theme={theme}
                  setTheme={setTheme}
                  activeTheme={activeTheme}
                  setActiveTheme={setActiveTheme}
                />
              )}

              {dashboardView === 'settings' && (
                <UserSettings
                  user={user}
                  token={token}
                  apiURL={API_URL}
                  onUpdateProfile={(updatedUser, newToken) => {
                    setUser(updatedUser);
                    if (newToken) {
                      setToken(newToken);
                    }
                  }}
                  onClearHistory={clearHistory}
                  hasHistory={history.length > 0}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
