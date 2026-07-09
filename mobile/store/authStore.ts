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
  isAuthenticated: boolean;
  login: (user: UserProfile, token: string) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  logout: () => void;
}

// In-memory fallback in case native storage fails (e.g., in some Expo Go versions/environments)
const memoryStorage: Record<string, string> = {};

const resilientStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      // Lazy load to prevent errors during module initialization
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      if (!AsyncStorage) {
        throw new Error('AsyncStorage is undefined');
      }
      return await AsyncStorage.getItem(name);
    } catch (e) {
      console.warn("⚠️ AsyncStorage.getItem failed, falling back to in-memory store", e);
      return memoryStorage[name] || null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      if (!AsyncStorage) {
        throw new Error('AsyncStorage is undefined');
      }
      await AsyncStorage.setItem(name, value);
    } catch (e) {
      console.warn("⚠️ AsyncStorage.setItem failed, falling back to in-memory store", e);
      memoryStorage[name] = value;
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      if (!AsyncStorage) {
        throw new Error('AsyncStorage is undefined');
      }
      await AsyncStorage.removeItem(name);
    } catch (e) {
      console.warn("⚠️ AsyncStorage.removeItem failed, falling back to in-memory store", e);
      delete memoryStorage[name];
    }
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },

      updateUser: (updates) => {
        set((state) =>
          state.user ? { user: { ...state.user, ...updates } } : state
        );
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'turfbook-auth',
      storage: createJSONStorage(() => resilientStorage),
      // Only persist identity fields
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
