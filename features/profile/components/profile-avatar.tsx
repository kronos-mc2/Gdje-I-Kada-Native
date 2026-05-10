import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives';
import { useAppTheme } from '@/core/theme';

type ProfileAvatarProps = {
  name?: string;
  avatarUrl?: string;
  size?: number;
};

export function ProfileAvatar({ name, avatarUrl, size = 96 }: ProfileAvatarProps) {
  const { theme } = useAppTheme();
  const initial = name?.trim().charAt(0).toUpperCase() || '?';

  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} contentFit="cover" />;
  }

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.mapAccentSoft,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <AppText variant="title" style={{ color: theme.colors.mapAccent }}>
        {initial}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
});
