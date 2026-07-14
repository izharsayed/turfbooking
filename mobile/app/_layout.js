"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RootLayout;
const expo_router_1 = require("expo-router");
const expo_status_bar_1 = require("expo-status-bar");
const react_query_1 = require("@tanstack/react-query");
const themeStore_1 = require("../store/themeStore");
const authStore_1 = require("../store/authStore");
const react_1 = require("react");
const api_1 = require("../utils/api");
const queryClient = new react_query_1.QueryClient();
function AuthBootstrap() {
    const router = (0, expo_router_1.useRouter)();
    const { token, login, logout } = (0, authStore_1.useAuthStore)();
    (0, react_1.useEffect)(() => {
        if (!token || token === 'dev-token-bypass')
            return;
        // Silently validate saved token in background after app loads
        const validateToken = async () => {
            try {
                const res = await (0, api_1.apiFetch)('/profile');
                if (res.success && res.data?.user) {
                    const u = res.data.user;
                    const p = res.data.profile;
                    const profileName = (p ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : '') ||
                        u.name ||
                        u.email;
                    login({
                        id: u.id,
                        email: u.email,
                        name: profileName,
                        phone: u.phone,
                        role: u.role,
                        avatarUrl: u.avatarUrl,
                    }, token);
                }
            }
            catch (err) {
                if (err?.statusCode === 401) {
                    // Token expired — logout already called by apiFetch, redirect to login
                    setTimeout(() => {
                        try {
                            router.replace('/login');
                        }
                        catch (_) { }
                    }, 300);
                }
                // Network errors: keep session, don't force logout
            }
        };
        // Small delay so the root navigator has time to mount
        const timer = setTimeout(validateToken, 500);
        return () => clearTimeout(timer);
    }, [token]);
    return null;
}
function RootLayout() {
    const { isDarkMode } = (0, themeStore_1.useThemeStore)();
    const headerBg = isDarkMode ? '#020617' : '#ffffff';
    const textColor = isDarkMode ? '#ffffff' : '#0f172a';
    return (<react_query_1.QueryClientProvider client={queryClient}>
      <expo_status_bar_1.StatusBar style={isDarkMode ? 'light' : 'dark'}/>
      <AuthBootstrap />
      <expo_router_1.Stack screenOptions={{
            headerStyle: { backgroundColor: headerBg },
            headerTintColor: textColor,
            headerTitleStyle: { fontWeight: 'bold' },
            contentStyle: { backgroundColor: isDarkMode ? '#030712' : '#f8fafc' },
        }}>
        <expo_router_1.Stack.Screen name="index" options={{ headerShown: false }}/>
        <expo_router_1.Stack.Screen name="login" options={{ headerShown: false }}/>
        <expo_router_1.Stack.Screen name="signup" options={{ headerShown: false }}/>
        <expo_router_1.Stack.Screen name="profile" options={{ headerShown: false }}/>
        <expo_router_1.Stack.Screen name="owner" options={{ headerShown: false }}/>
      </expo_router_1.Stack>
    </react_query_1.QueryClientProvider>);
}
