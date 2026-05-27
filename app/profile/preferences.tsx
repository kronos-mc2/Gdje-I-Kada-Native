import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppCard, AppIconButton, AppScreen, AppText, SectionHeader } from '@/components/primitives';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';
import { useAppTheme } from '@/core/theme';
import { ProfileMenuRow } from '@/features/profile/components/profile-menu-row';

export default function PreferencesScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const nearbyRadiusKm = useAppStore((state) => state.nearbyRadiusKm);
  const setNearbyRadiusKm = useAppStore((state) => state.setNearbyRadiusKm);

  return (
    <AppScreen scroll>
      <View style={styles.header}>
        <AppIconButton icon="arrow-back" onPress={() => router.back()} />
        <AppText variant="headline">{t('preferences')}</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <SectionHeader title={t('preferences')} subtitle={t('preferencesSubtitle')} />
      <AppCard variant="glass" style={styles.radiusCard}>
        <View style={styles.radiusCopy}>
          <AppText variant="bodyStrong">{t('nearbyRadiusSetting')}</AppText>
          <AppText variant="caption" color="textMuted">
            {t('nearbyRadiusSettingSubtitle')}
          </AppText>
        </View>
        <View style={styles.radiusStepper}>
          <Pressable
            accessibilityRole="button"
            disabled={nearbyRadiusKm <= 1}
            onPress={() => setNearbyRadiusKm(nearbyRadiusKm - 1)}
            style={({ pressed }) => [
              styles.stepperButton,
              {
                borderColor: theme.colors.border,
                opacity: pressed || nearbyRadiusKm <= 1 ? 0.55 : 1,
              },
            ]}
          >
            <Ionicons name="remove" size={18} color={theme.colors.textPrimary} />
          </Pressable>
          <AppText variant="headline" style={styles.radiusValue}>
            {nearbyRadiusKm} km
          </AppText>
          <Pressable
            accessibilityRole="button"
            disabled={nearbyRadiusKm >= 20}
            onPress={() => setNearbyRadiusKm(nearbyRadiusKm + 1)}
            style={({ pressed }) => [
              styles.stepperButton,
              {
                borderColor: theme.colors.border,
                opacity: pressed || nearbyRadiusKm >= 20 ? 0.55 : 1,
              },
            ]}
          >
            <Ionicons name="add" size={18} color={theme.colors.textPrimary} />
          </Pressable>
        </View>
      </AppCard>
      <ProfileMenuRow
        icon="notifications-outline"
        title={t('notifications')}
        subtitle={t('notificationPreferencesSubtitle')}
        onPress={() => router.push('/profile/preferences/notifications')}
      />
      <ProfileMenuRow
        icon="remove-circle-outline"
        title={t('feedPreferences')}
        subtitle={t('feedPreferencesSubtitle')}
        onPress={() => router.push('/profile/preferences/feed')}
      />
    </AppScreen>
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
  radiusCard: {
    gap: 14,
    marginBottom: 12,
  },
  radiusCopy: {
    gap: 4,
  },
  radiusStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusValue: {
    minWidth: 96,
    textAlign: 'center',
  },
});
