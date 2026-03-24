import { useRouter } from 'expo-router';

import { AppHeader, AppIconButton, AppScreen } from '@/components/primitives';
import { useI18n } from '@/core/i18n/use-i18n';
import { EventsContent } from '@/features/events/components/events-content';
import { EventsHeaderControls } from '@/features/events/components/events-header-controls';
import { useEventsScreenModel } from '@/features/events/hooks/use-events-screen-model';

export default function EventsScreen() {
  const router = useRouter();
  const { t } = useI18n();

  const {
    eventFilter,
    eventsView,
    searchQuery,
    eventsForRender,
    userLocation,
    isLoading,
    isRefetching,
    refetch,
    setEventFilter,
    setEventsView,
    setSearchQuery,
    openEventDetails,
    locale,
  } = useEventsScreenModel();

  return (
    <AppScreen>
      <AppHeader
        title={t('appName')}
        subtitle={t('events')}
        right={<AppIconButton icon="add" accessibilityLabel={t('createEvent')} onPress={() => router.push('/create-event')} />}
      />

      <EventsHeaderControls
        eventFilter={eventFilter}
        eventsView={eventsView}
        searchQuery={searchQuery}
        onFilterChange={setEventFilter}
        onViewChange={setEventsView}
        onSearchChange={setSearchQuery}
      />

      <EventsContent
        view={eventsView}
        locale={locale}
        userLocation={userLocation}
        events={eventsForRender}
        showDistance={eventFilter === 'nearby'}
        isLoading={isLoading}
        isRefetching={isRefetching}
        onRefresh={refetch}
        onEventPress={openEventDetails}
      />
    </AppScreen>
  );
}
