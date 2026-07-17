import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  name: string;
  phone?: string;
  status?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: UserProfile, token: string, refreshToken?: string) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  logout: () => void;
}

const memoryStorage: Record<string, string> = {};

const resilientStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      if (!AsyncStorage) throw new Error('AsyncStorage is undefined');
      return await AsyncStorage.getItem(name);
    } catch {
      return memoryStorage[name] || null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      if (!AsyncStorage) throw new Error('AsyncStorage is undefined');
      await AsyncStorage.setItem(name, value);
    } catch {
      memoryStorage[name] = value;
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      if (!AsyncStorage) throw new Error('AsyncStorage is undefined');
      await AsyncStorage.removeItem(name);
    } catch {
      delete memoryStorage[name];
    }
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user, token, refreshToken) => {
        set({ user, token, refreshToken: refreshToken || null, isAuthenticated: true });
      },

      updateUser: (updates) => {
        set((state) =>
          state.user ? { user: { ...state.user, ...updates } } : state
        );
      },

      logout: () => {
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'turfbook-auth',
      storage: createJSONStorage(() => resilientStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
