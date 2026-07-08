import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeStore } from '../store/themeStore';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { isDarkMode } = useThemeStore();

  const headerBg = isDarkMode ? '#020617' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#0f172a';

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: headerBg,
          },
          headerTintColor: textColor,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: isDarkMode ? '#030712' : '#f8fafc',
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
