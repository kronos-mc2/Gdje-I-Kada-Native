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
  const initialFontSize = Math.max(12, Math.round(size * 0.42));

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
      <AppText variant="title" style={{ color: theme.colors.mapAccent, fontSize: initialFontSize, lineHeight: initialFontSize + 4 }}>
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
