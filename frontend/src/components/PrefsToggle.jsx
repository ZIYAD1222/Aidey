import { usePrefs } from '../lib/PrefsContext';

const pillStyle = {
  height: 30,
  padding: '0 10px',
  borderRadius: 'var(--radius)',
  border: '0.5px solid var(--border)',
  background: 'var(--bg-card)',
  color: 'var(--text-secondary)',
  fontSize: 12.5,
};

export default function PrefsToggle() {
  const { lang, theme, t, toggleLang, toggleTheme } = usePrefs();

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={toggleLang} style={pillStyle} aria-label="Switch language">
        {lang === 'en' ? 'العربية' : 'English'}
      </button>
      <button onClick={toggleTheme} style={pillStyle} aria-label="Switch theme">
        {theme === 'light' ? `☾ ${t('darkMode')}` : `☀ ${t('lightMode')}`}
      </button>
    </div>
  );
}
