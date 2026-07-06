import { create } from 'zustand';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: localStorage.getItem('theme') !== 'light',
  toggleTheme: () => set((state) => {
    const nextMode = !state.isDarkMode;
    localStorage.setItem('theme', nextMode ? 'dark' : 'light');
    return { isDarkMode: nextMode };
  }),
}));
