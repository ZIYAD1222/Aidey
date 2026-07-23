import { createContext, useContext, useEffect, useState } from 'react';
import { translations } from './translations';

const PrefsContext = createContext(null);

export function PrefsProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.body.dir = translations[lang].dir;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const t = (key) => translations[lang][key] || key;
  const toggleLang = () => setLang((prev) => (prev === 'en' ? 'ar' : 'en'));
  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <PrefsContext.Provider value={{ lang, theme, t, toggleLang, toggleTheme }}>
      {children}
    </PrefsContext.Provider>
  );
}

export function usePrefs() {
  return useContext(PrefsContext);
}
