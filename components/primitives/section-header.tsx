import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives/app-text';
import { useAppTheme } from '@/core/theme';

type SectionHeaderProps = Readonly<{
  title: string;
  subtitle?: string;
  right?: ReactNode;
}>;

export function SectionHeader({ title, subtitle, right }: SectionHeaderProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.row, { marginBottom: theme.tokens.spacing.sm }]}>
      <View style={styles.textWrap}>
        <AppText variant="headline">{title}</AppText>
        {subtitle ? (
          <AppText variant="body" color="textMuted" style={{ marginTop: 2 }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
  },
  right: {
    marginLeft: 12,
  },
});
