import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';

import { AppButton, AppCard, AppIconButton, AppScreen, AppText, SectionHeader } from '@/components/primitives';
import {
  useNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { registerForPushNotificationsAsync } from '@/core/notifications/push-notifications';
import { useAppTheme } from '@/core/theme';

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const { data: preferences, isLoading } = useNotificationPreferencesQuery();
  const updatePreferencesMutation = useUpdateNotificationPreferencesMutation();
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const directMessagesEnabled = preferences?.directMessagesEnabled ?? true;
  const groupMessagesEnabled = preferences?.groupMessagesEnabled ?? true;
  const switchDisabled = isLoading || updatePreferencesMutation.isPending;

  const updateDirectMessages = (directMessagesEnabledNext: boolean) => {
    updatePreferencesMutation.mutate({ directMessagesEnabled: directMessagesEnabledNext });
  };

  const updateGroupMessages = (groupMessagesEnabledNext: boolean) => {
    updatePreferencesMutation.mutate({ groupMessagesEnabled: groupMessagesEnabledNext });
  };

  const enableDeviceNotifications = async () => {
    const result = await registerForPushNotificationsAsync({ requestPermission: true });
    if (result.status === 'registered') {
      setRegistrationStatus(t('notificationsEnabled'));
      return;
    }

    const messageKey =
      result.status === 'permission-denied'
        ? 'notificationPermissionDenied'
        : result.status === 'project-id-missing'
          ? 'notificationProjectMissing'
          : result.status === 'unsupported-platform'
            ? 'notificationUnsupportedPlatform'
            : result.status === 'unsupported-runtime'
              ? 'notificationUnsupportedRuntime'
              : 'notificationRegistrationFailed';
    const message = result.debugMessage ? `${t(messageKey)} ${result.debugMessage}` : t(messageKey);
    setRegistrationStatus(message);
    Alert.alert(t('notifications'), message);
  };

  return (
    <AppScreen scroll>
      <View style={styles.header}>
        <AppIconButton icon="arrow-back" onPress={() => router.back()} />
        <AppText variant="headline">{t('notifications')}</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <SectionHeader title={t('devicePushNotifications')} subtitle={t('devicePushNotificationsSubtitle')} />
      <AppCard variant="glass" style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardCopy}>
            <AppText variant="bodyStrong">{t('devicePushNotifications')}</AppText>
            <AppText variant="body" color="textMuted">
              {registrationStatus ?? t('devicePushNotificationsHelp')}
            </AppText>
          </View>
        </View>
        <AppButton title={t('enableNotifications')} variant="secondary" onPress={() => void enableDeviceNotifications()} />
      </AppCard>

      <SectionHeader title={t('messageNotifications')} subtitle={t('messageNotificationsSubtitle')} />
      <AppCard variant="glass" style={styles.card}>
        <NotificationSwitchRow
          title={t('directMessageNotifications')}
          subtitle={t('directMessageNotificationsSubtitle')}
          value={directMessagesEnabled}
          disabled={switchDisabled}
          onValueChange={updateDirectMessages}
        />
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <NotificationSwitchRow
          title={t('groupMessageNotifications')}
          subtitle={t('groupMessageNotificationsSubtitle')}
          value={groupMessagesEnabled}
          disabled={switchDisabled}
          onValueChange={updateGroupMessages}
        />
      </AppCard>
    </AppScreen>
  );
}

function NotificationSwitchRow({
  title,
  subtitle,
  value,
  disabled,
  onValueChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  disabled: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchCopy}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" color="textMuted">
          {subtitle}
        </AppText>
      </View>
      <Switch value={value} disabled={disabled} onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerSpacer: {
    width: 36,
  },
  card: {
    gap: 14,
    marginBottom: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardCopy: {
    flex: 1,
  },
  switchRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchCopy: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
