import { create } from 'zustand';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: localStorage.getItem('admin-theme') !== 'light',
  toggleTheme: () => set((state) => {
    const nextMode = !state.isDarkMode;
    localStorage.setItem('admin-theme', nextMode ? 'dark' : 'light');
    return { isDarkMode: nextMode };
  }),
}));
