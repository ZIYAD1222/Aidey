import { motion, AnimatePresence } from 'framer-motion';
import { usePrefs } from '../lib/PrefsContext';

const THEMES = [
  { id: 'light', labelKey: 'themeLight', swatch: '#F8F9FA', accent: '#0F6E56' },
  { id: 'dark', labelKey: 'themeDark', swatch: '#17181C', accent: '#4FD9B0' },
  { id: 'midnight', labelKey: 'themeMidnight', swatch: '#0B1220', accent: '#5B8DEF' },
  { id: 'nordic', labelKey: 'themeNordic', swatch: '#E9ECEF', accent: '#5E81AC' },
  { id: 'forest', labelKey: 'themeForest', swatch: '#0F1D17', accent: '#4CAF7D' },
  { id: 'sunset', labelKey: 'themeSunset', swatch: '#FBF1E7', accent: '#E0703E' },
];

export default function SettingsDrawer({
  open,
  onClose,
  onLogout,
  showCompleted,
  onShowCompletedChange,
  timeframe,
  onTimeframeChange,
  onEnableNotifications,
  notificationsStatus,
}) {
  const { t, lang, theme, toggleLang, setTheme } = usePrefs();

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '0.5px solid var(--border)',
  };

  const pillStyle = {
    height: 30,
    padding: '0 10px',
    borderRadius: 'var(--radius)',
    border: '0.5px solid var(--border)',
    background: 'var(--bg-page)',
    color: 'var(--text-secondary)',
    fontSize: 12.5,
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 40 }}
          />
          <motion.div
            initial={{ x: lang === 'ar' ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: lang === 'ar' ? '-100%' : '100%' }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
              position: 'fixed',
              top: 0,
              bottom: 0,
              [lang === 'ar' ? 'left' : 'right']: 0,
              width: 300,
              maxWidth: '85vw',
              background: 'var(--bg-card)',
              zIndex: 50,
              padding: '20px 18px',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                {t('settings')}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: '0.5px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: 14,
                }}
              >
                ×
              </button>
            </div>

            <div style={rowStyle}>
              <span style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>
                {lang === 'en' ? 'Language' : 'اللغة'}
              </span>
              <button onClick={toggleLang} style={pillStyle}>
                {lang === 'en' ? 'العربية' : 'English'}
              </button>
            </div>

            <div style={{ ...rowStyle, flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>{t('theme')}</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}>
                {THEMES.map((th) => (
                  <button
                    key={th.id}
                    onClick={() => setTheme(th.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 'var(--radius)',
                      border: theme === th.id ? '2px solid var(--accent)' : '0.5px solid var(--border)',
                      background: 'var(--bg-page)',
                      fontSize: 11.5,
                      color: 'var(--text-primary)',
                      textAlign: 'start',
                    }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: th.swatch,
                        border: `2px solid ${th.accent}`,
                        flexShrink: 0,
                      }}
                    />
                    {t(th.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div style={rowStyle}>
              <span style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>{t('showCompleted')}</span>
              <button
                onClick={() => onShowCompletedChange(!showCompleted)}
                style={{
                  ...pillStyle,
                  background: showCompleted ? 'var(--accent)' : 'var(--bg-page)',
                  color: showCompleted ? '#fff' : 'var(--text-secondary)',
                  border: showCompleted ? 'none' : pillStyle.border,
                }}
              >
                {showCompleted ? '✓' : '—'}
              </button>
            </div>

            <div style={{ ...rowStyle, flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>{t('timeframe')}</span>
              <select
                value={timeframe}
                onChange={(e) => onTimeframeChange(e.target.value)}
                style={{ ...pillStyle, width: '100%' }}
              >
                <option value="all">{t('allTasks')}</option>
                <option value="week">{t('thisWeek')}</option>
                <option value="month">{t('thisMonth')}</option>
                <option value="year">{t('thisYear')}</option>
              </select>
            </div>

            <div style={{ ...rowStyle, flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>{t('enableNotifications')}</span>
              <button
                onClick={onEnableNotifications}
                style={{
                  ...pillStyle,
                  width: '100%',
                  background:
                    notificationsStatus === 'on' ? 'var(--accent)' : 'var(--bg-page)',
                  color: notificationsStatus === 'on' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {notificationsStatus === 'on'
                  ? `✓ ${t('notificationsOn')}`
                  : notificationsStatus === 'failed'
                    ? t('notificationsFailed')
                    : t('enableNotifications')}
              </button>
            </div>

            <button
              onClick={onLogout}
              style={{
                width: '100%',
                height: 40,
                marginTop: 20,
                borderRadius: 'var(--radius)',
                border: '0.5px solid var(--personal)',
                background: 'transparent',
                color: 'var(--personal)',
                fontSize: 13.5,
              }}
            >
              {t('signOut')}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
