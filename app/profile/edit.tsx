import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppIconButton, AppInput, AppScreen, AppText } from '@/components/primitives';
import { useUpdateProfileMutation } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAuthStore } from '@/core/store/auth-store';
import { ProfileAvatar } from '@/features/profile/components/profile-avatar';

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const user = useAuthStore((state) => state.user);
  const updateProfileMutation = useUpdateProfileMutation();
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      Alert.alert(t('validation'), t('invalidName'));
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        name: trimmedName,
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      router.back();
    } catch {
      Alert.alert(t('profileUpdateFailed'));
    }
  };

  return (
    <AppScreen scroll>
      <View style={styles.header}>
        <AppIconButton icon="arrow-back" onPress={() => router.back()} />
        <AppText variant="headline">{t('editProfile')}</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <AppCard variant="glass" style={styles.previewCard}>
        <ProfileAvatar name={name} avatarUrl={avatarUrl.trim() || undefined} size={100} />
        <AppText variant="headline" style={styles.previewName} numberOfLines={2}>
          {name || t('nameLabel')}
        </AppText>
        {bio ? (
          <AppText variant="body" color="textSecondary" style={styles.previewBio}>
            {bio}
          </AppText>
        ) : null}
      </AppCard>

      <AppInput label={t('nameLabel')} value={name} onChangeText={setName} autoCapitalize="words" />
      <AppInput
        label={t('bioLabel')}
        value={bio}
        onChangeText={setBio}
        multiline
        maxLength={280}
        style={styles.bioInput}
        textAlignVertical="top"
      />
      <AppInput label={t('avatarUrlLabel')} value={avatarUrl} onChangeText={setAvatarUrl} autoCapitalize="none" autoCorrect={false} />

      <AppButton title={updateProfileMutation.isPending ? t('loading') : t('saveProfile')} disabled={updateProfileMutation.isPending} onPress={() => void handleSave()} />
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
  previewCard: {
    alignItems: 'center',
    marginBottom: 18,
  },
  previewName: {
    marginTop: 12,
    textAlign: 'center',
  },
  previewBio: {
    marginTop: 6,
    textAlign: 'center',
  },
  bioInput: {
    minHeight: 92,
  },
});
