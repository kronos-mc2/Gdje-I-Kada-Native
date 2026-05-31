import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ChatRealtimeListener } from '@/core/api/chat-realtime-listener';
import { useVideoCacheLifecycle } from '@/core/cache/video-cache';
import { PushNotificationRegistrar } from '@/core/notifications/push-notification-registrar';
import { queryClient } from '@/core/query/query-client';
import { useAuthStore } from '@/core/store/auth-store';
import { AppThemeProvider, useAppTheme } from '@/core/theme';

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { theme } = useAppTheme();
  const [fontsLoaded] = useFonts({
    Lexend_400Regular: require('../assets/fonts/Lexend-Regular.ttf'),
    Lexend_500Medium: require('../assets/fonts/Lexend-Medium.ttf'),
    Lexend_600SemiBold: require('../assets/fonts/Lexend-SemiBold.ttf'),
    Lexend_700Bold: require('../assets/fonts/Lexend-Bold.ttf'),
    Lexend_800ExtraBold: require('../assets/fonts/Lexend-ExtraBold.ttf'),
  });
  const hydrated = useAuthStore((state) => state.hydrated);
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);
  const isAuthenticated = Boolean(useAuthStore((state) => state.accessToken));
  const rootSegment = segments[0];
  const isAuthRoute = rootSegment === '(auth)';
  const shouldRedirectToTabs = hydrated && isAuthenticated && (isAuthRoute || !rootSegment);
  const shouldRedirectToAuth = hydrated && !isAuthenticated && !isAuthRoute;
  useVideoCacheLifecycle();

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.colors.background);
    if (Platform.OS === 'android') {
      void Promise.all([import('expo-navigation-bar'), import('react-native-is-edge-to-edge')])
        .then(([NavigationBar, EdgeToEdge]) => {
          try {
            NavigationBar.setStyle(theme.isDark ? 'dark' : 'light');
          } catch {
            // Some Android emulator/system UI combinations do not expose edge-to-edge style changes.
          }
          void NavigationBar.setButtonStyleAsync(theme.isDark ? 'light' : 'dark').catch(() => undefined);
          if (!EdgeToEdge.isEdgeToEdge()) {
            void NavigationBar.setBackgroundColorAsync(theme.colors.background).catch(() => undefined);
            void NavigationBar.setBorderColorAsync(theme.colors.background).catch(() => undefined);
          }
        })
        .catch(() => undefined);
    }
  }, [theme.colors.background, theme.isDark]);

  useEffect(() => {
    if (shouldRedirectToTabs) {
      router.replace('/(tabs)');
      return;
    }

    if (shouldRedirectToAuth) {
      router.replace('/(auth)');
    }
  }, [router, shouldRedirectToAuth, shouldRedirectToTabs]);

  if (!fontsLoaded || !hydrated || shouldRedirectToTabs || shouldRedirectToAuth) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.textSecondary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="create-event" options={{ presentation: 'modal' }} />
        <Stack.Screen name="entrance-map-picker" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="event/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="saved/[section]" options={{ presentation: 'card' }} />
        <Stack.Screen name="chat/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="profile/settings" options={{ presentation: 'card' }} />
        <Stack.Screen name="profile/preferences" options={{ presentation: 'card' }} />
        <Stack.Screen name="profile/preferences/notifications" options={{ presentation: 'card' }} />
        <Stack.Screen name="profile/edit" options={{ presentation: 'card' }} />
        <Stack.Screen name="profile/account" options={{ presentation: 'card' }} />
        <Stack.Screen name="profile/change-password" options={{ presentation: 'card' }} />
        <Stack.Screen name="profile/delete-account" options={{ presentation: 'card' }} />
        <Stack.Screen name="profile/activity" options={{ presentation: 'card' }} />
        <Stack.Screen name="profile/created-events" options={{ presentation: 'card' }} />
        <Stack.Screen name="profile/event/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="profile/liked" options={{ presentation: 'card' }} />
        <Stack.Screen name="profile/transactions" options={{ presentation: 'card' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#111114' }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AppThemeProvider>
            <ChatRealtimeListener />
            <PushNotificationRegistrar />
            <RootNavigator />
          </AppThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
