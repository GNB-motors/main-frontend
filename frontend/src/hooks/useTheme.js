import { useCallback, useEffect, useState } from 'react';
import { getUiTheme, setUiTheme } from '../utils/session.js';

function readInitialTheme() {
  const stored = getUiTheme();
  if (stored === 'dark' || stored === 'light') return stored;
  // Default light: the legacy pages are light-styled and must never break.
  return 'light';
}

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

/**
 * App-wide light/dark theme. `.dark` on <html> drives every cluster token.
 * Persisted via utils/session.js; default 'light' so legacy pages are unaffected.
 */
export function useTheme() {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    setUiTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme, isDark: theme === 'dark' };
}
