import { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives/app-text';
import { GlassSurface } from '@/components/primitives/glass-surface';
import { useAppTheme } from '@/core/theme';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  left?: ReactNode;
  floating?: boolean;
};

export function AppHeader({ title, subtitle, right, left, floating = true }: AppHeaderProps) {
  const { theme } = useAppTheme();
  const isIOS = Platform.OS === 'ios';
  const useGlass = isIOS && floating;

  return (
    <View
      style={[
        styles.container,
        {
          marginTop: theme.tokens.spacing.xs,
          marginBottom: theme.tokens.spacing.lg,
          borderRadius: theme.tokens.radius.xl,
          borderColor: theme.colors.border,
          backgroundColor: useGlass ? 'transparent' : theme.colors.surfaceElevated,
        },
      ]}
    >
      {useGlass ? <GlassSurface /> : null}

      <View style={styles.contentRow}>
        <View style={styles.sideSlot}>{left}</View>
        <View style={styles.centerSlot}>
          <AppText variant="title" numberOfLines={1} style={styles.title}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color="textMuted" numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <View style={[styles.sideSlot, styles.sideSlotRight]}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 78,
    justifyContent: 'center',
  },
  contentRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sideSlot: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideSlotRight: {
    alignItems: 'flex-end',
  },
  centerSlot: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 2,
  },
});
