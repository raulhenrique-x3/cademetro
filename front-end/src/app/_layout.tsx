import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useEffect } from 'react';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { queryClient } from '@/lib/query-client';
import { ThemeContextProvider, useAppTheme } from '@/context/theme-context';
import { AuthProvider } from '@/features/auth/auth-context';
import { ToastProvider } from '@/context/toast-context';
import { ToastContainer } from '@/components/ui/toast';
import { RealtimeProvider } from '@/context/realtime-context';
import { initializeAds } from '@/features/ads';

WebBrowser.maybeCompleteAuthSession();

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { colorScheme } = useAppTheme();

  useEffect(() => {
    initializeAds().catch(() => {});
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AnimatedSplashOverlay />
      <ToastContainer />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="explore" />
        <Stack.Screen name="report" options={{ presentation: 'modal' }} />
        <Stack.Screen name="login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="register" options={{ presentation: 'modal' }} />
        <Stack.Screen name="auth/callback" options={{ presentation: 'modal' }} />
        <Stack.Screen name="profile" />
        <Stack.Screen name="line/[id]" />
        <Stack.Screen name="station/[id]" />
        <Stack.Screen name="admin/reports" />
        <Stack.Screen name="admin/lines" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <QueryClientProvider client={queryClient}>
        <ThemeContextProvider>
          <AuthProvider>
            <ToastProvider>
              <RealtimeProvider>
                <RootNavigator />
              </RealtimeProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeContextProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
