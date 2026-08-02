import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('tr_sc_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {
      console.error('Failed reading theme preference', e);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('tr_sc_theme', next);
      } catch (e) {
        console.error('Failed saving theme preference', e);
      }
      return next;
    });
  };

  return { theme, toggleTheme };
}
