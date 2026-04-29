import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { queryKeys } from '@/core/api/query-keys';
import { queryClient } from '@/core/query/query-client';
import { useAuthStore } from '@/core/store/auth-store';

const CHAT_REFRESH_INTERVAL_MS = 2500;

export function ChatRealtimeListener() {
  const isAuthenticated = Boolean(useAuthStore((state) => state.accessToken));
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const refreshActiveChatQueries = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoomsRoot, refetchType: 'active' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoomRoot, refetchType: 'active' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatMessagesRoot, refetchType: 'active' });
    };

    refreshActiveChatQueries();

    const interval = setInterval(() => {
      if (appStateRef.current === 'active') {
        refreshActiveChatQueries();
      }
    }, CHAT_REFRESH_INTERVAL_MS);

    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'active' && previousState !== 'active') {
        refreshActiveChatQueries();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [isAuthenticated]);

  return null;
}
