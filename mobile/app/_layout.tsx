import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';
import { apiFetch } from '../utils/api';

const queryClient = new QueryClient();

function AuthBootstrap() {
  const router = useRouter();
  const { token, login, logout } = useAuthStore();

  useEffect(() => {
    if (!token || token === 'dev-token-bypass') return;

    // Silently validate saved token in background after app loads
    const validateToken = async () => {
      try {
        const res = await apiFetch('/profile');
        if (res.success && res.data?.user) {
          const u = res.data.user;
          const p = res.data.profile;
          const profileName =
            (p ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : '') ||
            u.name ||
            u.email;
          login(
            {
              id: u.id,
              email: u.email,
              name: profileName,
              phone: u.phone,
              role: u.role,
              avatarUrl: u.avatarUrl,
            },
            token
          );
        }
      } catch (err: any) {
        if (err?.statusCode === 401) {
          // Token expired — logout already called by apiFetch, redirect to login
          setTimeout(() => {
            try { router.replace('/login'); } catch (_) {}
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

export default function RootLayout() {
  const { isDarkMode } = useThemeStore();

  const headerBg = isDarkMode ? '#020617' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#0f172a';

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <AuthBootstrap />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: headerBg },
          headerTintColor: textColor,
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: isDarkMode ? '#030712' : '#f8fafc' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="owner" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
