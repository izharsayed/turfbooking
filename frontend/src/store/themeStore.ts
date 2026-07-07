import { create } from 'zustand';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: localStorage.getItem('turfbook-theme') === 'dark' ||
    (!localStorage.getItem('turfbook-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches),
  toggleTheme: () =>
    set((state) => {
      const next = !state.isDarkMode;
      localStorage.setItem('turfbook-theme', next ? 'dark' : 'light');
      return { isDarkMode: next };
    }),
}));
