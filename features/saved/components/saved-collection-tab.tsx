import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives';
import { useI18n } from '@/core/i18n/use-i18n';
import { AppEvent, SavedEventsOverview } from '@/core/types/domain';
import { SavedSection } from '@/features/saved/utils/saved-events';
import { SavedEventCard } from '@/features/saved/components/saved-event-card';
import { SavedEventRow } from '@/features/saved/components/saved-event-row';
import { SavedSectionHeader } from '@/features/saved/components/saved-section-header';

type SavedCollectionTabProps = {
  overview?: SavedEventsOverview;
  loading: boolean;
  onOpenEvent: (eventId: string) => void;
  onOpenSection: (section: SavedSection) => void;
};

export function SavedCollectionTab({ overview, loading, onOpenEvent, onOpenSection }: SavedCollectionTabProps) {
  const { t } = useI18n();
  const savedEvents = overview?.savedEvents ?? [];
  const goingSoon = overview?.goingSoon ?? [];
  const pastEvents = overview?.pastEvents ?? [];

  if (loading && !overview) {
    return (
      <View style={styles.emptyWrap}>
        <AppText color="textMuted">{t('loading')}</AppText>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.section}>
        <SavedSectionHeader title={t('savedEvents')} onSeeAll={savedEvents.length > 0 ? () => onOpenSection('saved') : undefined} />
        {savedEvents.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedScroller}>
            {savedEvents.map((event) => (
              <SavedEventCard key={event.id} event={event} onPress={() => onOpenEvent(event.id)} />
            ))}
          </ScrollView>
        ) : (
          <EmptyState label={t('noSavedEvents')} />
        )}
      </View>

      <EventListSection
        title={t('goingSoon')}
        emptyLabel={t('noGoingSoonEvents')}
        events={goingSoon}
        onOpenEvent={onOpenEvent}
        onSeeAll={() => onOpenSection('going-soon')}
      />

      <EventListSection
        title={t('pastEvents')}
        emptyLabel={t('noPastEvents')}
        events={pastEvents}
        onOpenEvent={onOpenEvent}
        onSeeAll={() => onOpenSection('past')}
        compact
      />
    </View>
  );
}

function EventListSection({
  title,
  emptyLabel,
  events,
  onOpenEvent,
  onSeeAll,
  compact,
}: {
  title: string;
  emptyLabel: string;
  events: AppEvent[];
  onOpenEvent: (eventId: string) => void;
  onSeeAll: () => void;
  compact?: boolean;
}) {
  return (
    <View style={styles.section}>
      <SavedSectionHeader title={title} onSeeAll={events.length > 0 ? onSeeAll : undefined} />
      {events.length > 0 ? (
        <View style={styles.list}>
          {events.map((event) => (
            <SavedEventRow key={event.id} event={event} compact={compact} onPress={() => onOpenEvent(event.id)} />
          ))}
        </View>
      ) : (
        <EmptyState label={emptyLabel} />
      )}
    </View>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <View style={styles.emptyWrap}>
      <AppText color="textMuted">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 28,
  },
  section: {
    gap: 12,
  },
  savedScroller: {
    paddingRight: 16,
  },
  list: {
    gap: 12,
  },
  emptyWrap: {
    minHeight: 74,
    justifyContent: 'center',
  },
});
