import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppIconButton, AppInput, AppScreen, AppText } from '@/components/primitives';
import { useUpdateProfileMutation } from '@/core/api/query-hooks';
import { isEventImageTooLarge, normalizePickedEventImage } from '@/core/events/event-image-assets';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAuthStore } from '@/core/store/auth-store';
import { useAppTheme } from '@/core/theme';
import { LocalEventImage } from '@/core/types/domain';
import { ProfileAvatar } from '@/features/profile/components/profile-avatar';

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const updateProfileMutation = useUpdateProfileMutation();
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarImage, setAvatarImage] = useState<LocalEventImage | null>(null);
  const avatarPreviewUrl = avatarImage?.uri ?? user?.avatarUrl;

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
        avatarUrl: user?.avatarUrl,
        avatarImage: avatarImage ?? undefined,
      });
      router.back();
    } catch {
      Alert.alert(t('profileUpdateFailed'));
    }
  };

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('validation'), t('imagePermissionDenied'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: 'images',
      quality: 0.92,
      selectionLimit: 1,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    try {
      const image = await normalizePickedEventImage(result.assets[0], `profile-avatar-${Date.now()}.jpg`);
      if (isEventImageTooLarge(image)) {
        Alert.alert(t('validation'), t('profileImageTooLarge'));
        return;
      }
      setAvatarImage(image);
    } catch {
      Alert.alert(t('validation'), t('profileImageConversionFailed'));
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
        <Pressable onPress={() => void pickAvatar()} style={styles.avatarPicker}>
          <ProfileAvatar name={name} avatarUrl={avatarPreviewUrl} size={100} />
          <View style={[styles.avatarBadge, { backgroundColor: theme.colors.mapAccent, borderColor: theme.colors.background }]}>
            <AppText variant="caption" style={{ color: theme.colors.textPrimary }}>
              +
            </AppText>
          </View>
        </Pressable>
        <AppText variant="headline" style={styles.previewName} numberOfLines={2}>
          {name || t('nameLabel')}
        </AppText>
        {bio ? (
          <AppText variant="body" color="textSecondary" style={styles.previewBio}>
            {bio}
          </AppText>
        ) : null}
        <AppButton title={t('uploadProfileImage')} variant="glass" style={styles.avatarButton} onPress={() => void pickAvatar()} />
        <AppText variant="caption" color="textMuted" style={styles.avatarHint}>
          {t('profileImageHint')}
        </AppText>
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
  avatarPicker: {
    position: 'relative',
  },
  avatarBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    marginTop: 14,
  },
  avatarHint: {
    marginTop: 8,
    textAlign: 'center',
  },
  bioInput: {
    minHeight: 92,
  },
});
