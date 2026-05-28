import { Link } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppScreen, AppText } from '@/components/primitives';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { SocialAuthButton } from '@/features/auth/components/social-auth-button';
import { useAuthRestoreMessageAlert } from '@/features/auth/hooks/use-auth-restore-message-alert';
import { useSocialAuth } from '@/features/auth/hooks/use-social-auth';

export default function AuthWelcomeScreen() {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const { isSocialSubmitting, isAppleSignInAvailable, handleGoogleSignIn, handleAppleSignIn } = useSocialAuth();

  useAuthRestoreMessageAlert();

  return (
    <AppScreen scroll contentContainerStyle={styles.screenContent}>
      <View style={styles.brandBlock}>
        <Image source={require('../../assets/images/app-icon.png')} style={styles.appIcon} resizeMode="contain" />
        <AppText variant="headline" style={styles.appName}>
          {t('appName')}
        </AppText>
      </View>

      <AppCard variant="elevated" style={styles.actionPanel}>
        <View style={styles.copyBlock}>
          <AppText variant="headline" style={styles.panelTitle}>
            {t('authLandingTitle')}
          </AppText>
          <AppText variant="body" color="textMuted" style={styles.panelSubtitle}>
            {t('authLandingSubtitle')}
          </AppText>
        </View>

        <View style={styles.primaryActions}>
          <Link href="/(auth)/login" asChild>
            <AppButton title={t('signInTitle')} variant="glass" disabled={isSocialSubmitting} />
          </Link>
          <Link href="/(auth)/register" asChild>
            <AppButton title={t('signUpTitle')} variant="secondary" disabled={isSocialSubmitting} />
          </Link>
        </View>

        <View style={styles.separatorRow}>
          <View style={[styles.separatorLine, { backgroundColor: theme.colors.border }]} />
          <AppText variant="caption" color="textMuted">
            {t('orConnectUsing')}
          </AppText>
          <View style={[styles.separatorLine, { backgroundColor: theme.colors.border }]} />
        </View>

        <SocialAuthButton
          provider="google"
          title={t('signInGoogle')}
          disabled={isSocialSubmitting}
          onPress={() => void handleGoogleSignIn()}
        />
        {isAppleSignInAvailable ? (
          <SocialAuthButton
            provider="apple"
            title={t('signInApple')}
            disabled={isSocialSubmitting}
            onPress={() => void handleAppleSignIn()}
            style={styles.appleButton}
          />
        ) : null}
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    justifyContent: 'center',
    paddingTop: 40,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 34,
  },
  appIcon: {
    width: 92,
    height: 92,
    borderRadius: 24,
    marginBottom: 14,
  },
  appName: {
    textAlign: 'center',
  },
  actionPanel: {
    paddingVertical: 24,
  },
  copyBlock: {
    alignItems: 'center',
    marginBottom: 22,
  },
  panelTitle: {
    textAlign: 'center',
  },
  panelSubtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  primaryActions: {
    gap: 12,
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 22,
  },
  separatorLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  appleButton: {
    marginTop: 8,
  },
});
