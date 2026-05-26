import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppCard, AppIconButton, AppScreen, AppText, SectionHeader } from '@/components/primitives';
import { useDeleteFeedPreferenceMutation, useFeedPreferencesQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { FeedPreference, FeedPreferenceType } from '@/core/types/domain';

const GROUPS: FeedPreferenceType[] = ['event', 'creator', 'tag'];

export default function FeedPreferencesScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { data: preferences = [], isLoading } = useFeedPreferencesQuery();
  const deleteMutation = useDeleteFeedPreferenceMutation();

  return (
    <AppScreen scroll>
      <View style={styles.header}>
        <AppIconButton icon="arrow-back" onPress={() => router.back()} />
        <AppText variant="headline">{t('feedPreferences')}</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <SectionHeader title={t('feedPreferences')} subtitle={t('feedPreferencesSubtitle')} />
      {isLoading ? (
        <AppText variant="body" color="textMuted">
          {t('loading')}
        </AppText>
      ) : null}

      {GROUPS.map((type) => {
        const items = preferences.filter((preference) => preference.type === type);
        return (
          <AppCard key={type} variant="glass" style={styles.group}>
            <AppText variant="bodyStrong">{getGroupTitle(type, t)}</AppText>
            {items.length ? (
              items.map((preference) => (
                <PreferenceRow
                  key={preference.id}
                  preference={preference}
                  disabled={deleteMutation.isPending}
                  onRemove={() => deleteMutation.mutate(preference.id)}
                />
              ))
            ) : (
              <AppText variant="body" color="textMuted">
                {t('noFeedPreferences')}
              </AppText>
            )}
          </AppCard>
        );
      })}
    </AppScreen>
  );
}

function PreferenceRow({
  preference,
  disabled,
  onRemove,
}: {
  preference: FeedPreference;
  disabled: boolean;
  onRemove: () => void;
}) {
  const { theme } = useAppTheme();
  const { t } = useI18n();

  return (
    <View style={[styles.row, { borderColor: theme.colors.border }]}>
      <AppText variant="body" numberOfLines={1} style={styles.rowLabel}>
        {preference.type === 'tag' ? `${t('ignoreTag')} #${preference.label}` : preference.label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onRemove}
        style={({ pressed }) => [styles.removeButton, { opacity: pressed || disabled ? 0.55 : 1 }]}
      >
        <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
      </Pressable>
    </View>
  );
}

function getGroupTitle(type: FeedPreferenceType, t: ReturnType<typeof useI18n>['t']) {
  if (type === 'creator') {
    return t('blockedCreators');
  }
  if (type === 'tag') {
    return t('blockedTags');
  }
  return t('blockedEvents');
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
  group: {
    gap: 10,
    marginBottom: 12,
  },
  row: {
    minHeight: 46,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
  },
  rowLabel: {
    flex: 1,
  },
  removeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
