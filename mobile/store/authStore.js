"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuthStore = void 0;
const zustand_1 = require("zustand");
const middleware_1 = require("zustand/middleware");
// In-memory fallback in case native storage fails (e.g., in some Expo Go versions/environments)
const memoryStorage = {};
const resilientStorage = {
    getItem: async (name) => {
        try {
            // Lazy load to prevent errors during module initialization
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            if (!AsyncStorage) {
                throw new Error('AsyncStorage is undefined');
            }
            return await AsyncStorage.getItem(name);
        }
        catch (e) {
            console.warn("⚠️ AsyncStorage.getItem failed, falling back to in-memory store", e);
            return memoryStorage[name] || null;
        }
    },
    setItem: async (name, value) => {
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            if (!AsyncStorage) {
                throw new Error('AsyncStorage is undefined');
            }
            await AsyncStorage.setItem(name, value);
        }
        catch (e) {
            console.warn("⚠️ AsyncStorage.setItem failed, falling back to in-memory store", e);
            memoryStorage[name] = value;
        }
    },
    removeItem: async (name) => {
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            if (!AsyncStorage) {
                throw new Error('AsyncStorage is undefined');
            }
            await AsyncStorage.removeItem(name);
        }
        catch (e) {
            console.warn("⚠️ AsyncStorage.removeItem failed, falling back to in-memory store", e);
            delete memoryStorage[name];
        }
    }
};
exports.useAuthStore = (0, zustand_1.create)()((0, middleware_1.persist)((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    login: (user, token) => {
        set({ user, token, isAuthenticated: true });
    },
    updateUser: (updates) => {
        set((state) => state.user ? { user: { ...state.user, ...updates } } : state);
    },
    logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
    },
}), {
    name: 'turfbook-auth',
    storage: (0, middleware_1.createJSONStorage)(() => resilientStorage),
    // Only persist identity fields
    partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
    }),
}));
