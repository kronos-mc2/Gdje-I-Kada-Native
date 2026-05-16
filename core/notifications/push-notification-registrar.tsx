import { useEffect } from 'react';

import {
  addChatNotificationResponseListener,
  registerForPushNotificationsAsync,
} from '@/core/notifications/push-notifications';
import { useAuthStore } from '@/core/store/auth-store';

export function PushNotificationRegistrar() {
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    const subscription = addChatNotificationResponseListener();
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    void registerForPushNotificationsAsync({ requestPermission: false });
  }, [accessToken]);

  return null;
}
