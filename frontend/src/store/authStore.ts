import { create } from 'zustand';

export type UserRole = 'customer' | 'owner' | 'admin';

interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: UserProfile, token: string, refreshToken?: string) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

const getStoredUser = (): UserProfile | null => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('token') && !!localStorage.getItem('user'),
  login: (user, token, refreshToken) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    set({ user, token, refreshToken: refreshToken ?? null, isAuthenticated: true });
  },
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
  },
}));
