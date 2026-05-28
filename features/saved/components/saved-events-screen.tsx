import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppScreen } from '@/components/primitives';
import { useMyEventsQuery, useSavedEventsOverviewQuery } from '@/core/api/query-hooks';
import { JoinedEventsCalendar } from '@/features/calendar/components/joined-events-calendar';
import { SavedCollectionTab } from '@/features/saved/components/saved-collection-tab';
import { SavedSegmentedControl, SavedTab } from '@/features/saved/components/saved-segmented-control';
import { SavedSection } from '@/features/saved/utils/saved-events';

export function SavedEventsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SavedTab>('collection');
  const { data: overview, isLoading: overviewLoading } = useSavedEventsOverviewQuery();
  const { data: joinedEvents = [] } = useMyEventsQuery('joined');

  const openEvent = (eventId: string) => {
    router.push({ pathname: '/event/[id]', params: { id: eventId } });
  };

  const openSection = (section: SavedSection) => {
    router.push({ pathname: '/saved/[section]', params: { section } });
  };

  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <SavedSegmentedControl activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'collection' ? (
        <SavedCollectionTab
          overview={overview}
          loading={overviewLoading}
          onOpenEvent={openEvent}
          onOpenSection={openSection}
        />
      ) : (
        <JoinedEventsCalendar events={joinedEvents} onOpenEvent={openEvent} />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: 6,
    gap: 18,
  },
});
