import { create } from 'zustand';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  name: string;
  phone?: string;
  status?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: UserProfile, token: string) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user, token) => {
    set({ user, token, isAuthenticated: true });
  },
  updateUser: (updates) => {
    set((state) => (state.user ? { user: { ...state.user, ...updates } } : state));
  },
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
