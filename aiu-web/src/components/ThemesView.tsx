
import { AVAILABLE_THEMES } from '../themes/registry';

interface ThemesViewProps {
  theme: 'light' | 'dark';
  setTheme: (mode: 'light' | 'dark') => void;
  activeTheme: string;
  setActiveTheme: (id: string) => void;
}

export default function ThemesView({
  theme,
  setTheme,
  activeTheme,
  setActiveTheme
}: ThemesViewProps) {
  return (
    <div className="themes-view-container">
      <div className="themes-content-wrapper">
        <div className="themes-header-section">
          <span className="themes-section-title">Appearance Mode</span>
          <div className="mode-toggle-group">
            <button 
              className={`mode-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
            >
              Light
            </button>
            <button 
              className={`mode-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              Dark
            </button>
          </div>
        </div>
        
        <div className="themes-divider"></div>
        
        <div className="themes-header-section">
          <span className="themes-section-title">Color Palette</span>
          <span className="themes-section-subtitle">Choose from 40 custom design theme profiles.</span>
        </div>

        <div className="themes-grid">
          {AVAILABLE_THEMES.map((t) => (
            <div 
              key={t.id}
              className={`theme-card ${activeTheme === t.id ? 'active' : ''}`}
              onClick={() => setActiveTheme(t.id)}
              style={{ fontFamily: t.fontFamily }}
            >
              <div 
                className="theme-color-preview" 
                style={{ backgroundColor: theme === 'dark' && t.previewColorDark ? t.previewColorDark : t.previewColor }}
              ></div>
              <div className="theme-meta-info">
                <div className="theme-name">{t.name}</div>
                <div className="theme-desc">{t.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
