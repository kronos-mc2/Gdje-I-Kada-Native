import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { deletePushToken, registerPushToken } from '@/core/api/services';

const ANDROID_MESSAGE_CHANNEL_ID = 'messages';

type PushRegistrationStatus = 'registered' | 'permission-denied' | 'project-id-missing' | 'unavailable' | 'error';
type NotificationPermissionStatus = Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>;

export type PushRegistrationResult = {
  status: PushRegistrationStatus;
  token?: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const registerForPushNotificationsAsync = async ({
  requestPermission,
}: {
  requestPermission: boolean;
}): Promise<PushRegistrationResult> => {
  if (Platform.OS === 'web' || !Constants.isDevice) {
    return { status: 'unavailable' };
  }

  try {
    await ensureAndroidNotificationChannel();

    const permission = await resolveNotificationPermission(requestPermission);
    if (!permission) {
      return { status: 'permission-denied' };
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId || typeof projectId !== 'string') {
      return { status: 'project-id-missing' };
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await registerPushToken({ token, platform: Platform.OS });

    return { status: 'registered', token };
  } catch {
    return { status: 'error' };
  }
};

export const unregisterCurrentPushTokenAsync = async () => {
  if (Platform.OS === 'web' || !Constants.isDevice) {
    return;
  }

  try {
    const permission = await Notifications.getPermissionsAsync();
    if (!isPermissionGranted(permission)) {
      return;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId || typeof projectId !== 'string') {
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await deletePushToken(token);
  } catch {
    // Logout should not be blocked by a best-effort token cleanup failure.
  }
};

export const addChatNotificationResponseListener = () => {
  const redirect = (notification: Notifications.Notification) => {
    const roomId = notification.request.content.data?.roomId;
    if (typeof roomId === 'string' && roomId.trim()) {
      router.push(`/chat/${roomId}`);
    }
  };

  const lastResponse = Notifications.getLastNotificationResponse();
  if (lastResponse?.notification) {
    redirect(lastResponse.notification);
  }

  return Notifications.addNotificationResponseReceivedListener((response) => {
    redirect(response.notification);
  });
};

const ensureAndroidNotificationChannel = async () => {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(ANDROID_MESSAGE_CHANNEL_ID, {
    name: 'Messages',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#8B5CF6',
  });
};

const resolveNotificationPermission = async (requestPermission: boolean) => {
  const existingPermission = await Notifications.getPermissionsAsync();
  if (isPermissionGranted(existingPermission)) {
    return true;
  }

  if (!requestPermission) {
    return false;
  }

  const requestedPermission = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return isPermissionGranted(requestedPermission);
};

const isPermissionGranted = (permission: NotificationPermissionStatus) => {
  if (permission.granted || permission.status === 'granted') {
    return true;
  }

  const iosStatus = permission.ios?.status;
  return (
    iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
};
