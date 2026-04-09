import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/core/query/query-client';
import { useAuthStore } from '@/core/store/auth-store';
import { AppThemeProvider, useAppTheme } from '@/core/theme';

function RootNavigator() {
  const { theme } = useAppTheme();
  const hydrated = useAuthStore((state) => state.hydrated);
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);
  const isAuthenticated = Boolean(useAuthStore((state) => state.accessToken));

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  if (!hydrated) {
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
        {isAuthenticated ? (
          <>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="create-event" options={{ presentation: 'modal' }} />
            <Stack.Screen name="entrance-map-picker" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="event/[id]" options={{ presentation: 'card' }} />
          </>
        ) : (
          <Stack.Screen name="(auth)" />
        )}
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AppThemeProvider>
            <RootNavigator />
          </AppThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
