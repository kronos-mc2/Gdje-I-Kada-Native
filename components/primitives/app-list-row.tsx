import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/primitives/app-card';
import { AppText } from '@/components/primitives/app-text';
import { useAppTheme } from '@/core/theme';

type AppListRowProps = Readonly<{
  title: string;
  subtitle?: string;
  right?: ReactNode;
  extra?: ReactNode;
  cardVariant?: 'default' | 'elevated' | 'glass';
}>;

export function AppListRow({ title, subtitle, right, extra, cardVariant = 'default' }: AppListRowProps) {
  const { theme } = useAppTheme();

  return (
    <AppCard variant={cardVariant} style={{ marginBottom: theme.tokens.spacing.sm }}>
      <View style={styles.row}>
        <View style={styles.content}>
          <AppText variant="bodyStrong">{title}</AppText>
          {subtitle ? (
            <AppText variant="body" color="textMuted" style={{ marginTop: 2 }}>
              {subtitle}
            </AppText>
          ) : null}
          {extra}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  content: {
    flex: 1,
  },
  right: {
    marginLeft: 8,
  },
});
