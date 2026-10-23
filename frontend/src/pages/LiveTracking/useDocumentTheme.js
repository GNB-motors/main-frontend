import { useEffect, useState } from 'react';

export default function useDocumentTheme() {
  const [theme, setTheme] = useState(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  useEffect(() => {
    const handleThemeChange = () => {
      const isDark = document.documentElement.classList.contains('dark');
      const nextTheme = isDark ? 'dark' : 'light';
      setTheme(nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
    };
    handleThemeChange();
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('themeColorChange', handleThemeChange);
    return () => {
      observer.disconnect();
      window.removeEventListener('themeColorChange', handleThemeChange);
    };
  }, []);
  return theme;
}
