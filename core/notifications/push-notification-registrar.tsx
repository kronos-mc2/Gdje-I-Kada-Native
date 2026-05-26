import { useEffect } from 'react';

import {
  addChatNotificationResponseListener,
  registerForPushNotificationsAsync,
} from '@/core/notifications/push-notifications';
import { useAppStore } from '@/core/store/app-store';
import { useAuthStore } from '@/core/store/auth-store';

export function PushNotificationRegistrar() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const notificationPermissionPrompted = useAppStore((state) => state.notificationPermissionPrompted);
  const setNotificationPermissionPrompted = useAppStore((state) => state.setNotificationPermissionPrompted);

  useEffect(() => {
    const subscription = addChatNotificationResponseListener();
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    if (!notificationPermissionPrompted) {
      setNotificationPermissionPrompted(true);
      void registerForPushNotificationsAsync({ requestPermission: true });
      return;
    }

    void registerForPushNotificationsAsync({ requestPermission: false });
  }, [accessToken, notificationPermissionPrompted, setNotificationPermissionPrompted]);

  return null;
}
