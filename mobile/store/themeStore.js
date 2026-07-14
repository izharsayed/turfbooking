"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useThemeStore = void 0;
const zustand_1 = require("zustand");
exports.useThemeStore = (0, zustand_1.create)((set) => ({
    isDarkMode: true, // Default to dark mode matching web
    toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));
