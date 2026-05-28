import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIconButton, AppScreen, AppText } from '@/components/primitives';
import { useLikedEventsQuery, useMyEventsQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { AppEvent } from '@/core/types/domain';
import { SavedEventRow } from '@/features/saved/components/saved-event-row';
import { getGoingSoonEvents, getPastEvents, SavedSection } from '@/features/saved/utils/saved-events';

export default function SavedSectionScreen() {
  const router = useRouter();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const { t } = useI18n();
  const normalizedSection = normalizeSection(section);
  const { data: likedEvents = [], isLoading: likedLoading } = useLikedEventsQuery();
  const { data: joinedEvents = [], isLoading: joinedLoading } = useMyEventsQuery('joined');

  const events = useMemo(() => {
    if (normalizedSection === 'saved') {
      return likedEvents;
    }
    if (normalizedSection === 'going-soon') {
      return getGoingSoonEvents(joinedEvents);
    }
    return getPastEvents(joinedEvents);
  }, [joinedEvents, likedEvents, normalizedSection]);

  const loading = normalizedSection === 'saved' ? likedLoading : joinedLoading;

  return (
    <AppScreen scroll>
      <View style={styles.header}>
        <AppIconButton icon="arrow-back" onPress={() => router.back()} />
        <AppText variant="headline" numberOfLines={1} style={styles.headerTitle}>
          {sectionTitle(normalizedSection, t)}
        </AppText>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <AppText color="textMuted">{t('loading')}</AppText>
      ) : events.length === 0 ? (
        <AppText color="textMuted">{emptyLabel(normalizedSection, t)}</AppText>
      ) : (
        <View style={styles.list}>
          {events.map((event: AppEvent) => (
            <SavedEventRow
              key={event.id}
              event={event}
              compact={normalizedSection === 'past'}
              onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
            />
          ))}
        </View>
      )}
    </AppScreen>
  );
}

function normalizeSection(section?: string): SavedSection {
  if (section === 'going-soon' || section === 'past' || section === 'saved') {
    return section;
  }
  return 'saved';
}

function sectionTitle(section: SavedSection, t: ReturnType<typeof useI18n>['t']) {
  if (section === 'going-soon') {
    return t('goingSoon');
  }
  if (section === 'past') {
    return t('pastEvents');
  }
  return t('savedEvents');
}

function emptyLabel(section: SavedSection, t: ReturnType<typeof useI18n>['t']) {
  if (section === 'going-soon') {
    return t('noGoingSoonEvents');
  }
  if (section === 'past') {
    return t('noPastEvents');
  }
  return t('noSavedEvents');
}

const styles = StyleSheet.create({
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  list: {
    gap: 12,
  },
});
