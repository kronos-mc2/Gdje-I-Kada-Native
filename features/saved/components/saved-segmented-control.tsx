import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives';
import { useAppTheme } from '@/core/theme';
import { useI18n } from '@/core/i18n/use-i18n';

export type SavedTab = 'collection' | 'schedule';

type SavedSegmentedControlProps = {
  activeTab: SavedTab;
  onChange: (tab: SavedTab) => void;
};

export function SavedSegmentedControl({ activeTab, onChange }: SavedSegmentedControlProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {(['collection', 'schedule'] as const).map((tab) => {
        const selected = activeTab === tab;
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab)}
            style={[
              styles.tab,
              {
                backgroundColor: selected ? theme.colors.mapAccent : 'transparent',
                borderColor: selected ? theme.colors.mapAccent : 'transparent',
              },
            ]}
          >
            <AppText
              variant="bodyStrong"
              color={selected ? 'textPrimary' : 'textSecondary'}
              numberOfLines={1}
              style={[
                styles.label,
                selected ? { color: theme.isDark ? theme.colors.textPrimary : theme.colors.background } : undefined,
              ]}
            >
              {tab === 'collection' ? t('savedCollection') : t('savedSchedule')}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 42,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 21,
    flexDirection: 'row',
    padding: 2,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
  },
});
