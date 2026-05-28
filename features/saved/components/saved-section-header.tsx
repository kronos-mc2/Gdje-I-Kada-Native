import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';

type SavedSectionHeaderProps = {
  title: string;
  onSeeAll?: () => void;
};

export function SavedSectionHeader({ title, onSeeAll }: SavedSectionHeaderProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();

  return (
    <View style={styles.header}>
      <AppText variant="headline">{title}</AppText>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} style={styles.seeAll}>
          <AppText variant="bodyStrong" style={{ color: theme.colors.mapAccent }}>
            {t('seeAll')}
          </AppText>
          <Ionicons name="chevron-forward" size={19} color={theme.colors.mapAccent} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  seeAll: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
