import { StyleSheet, View } from 'react-native';

import { AppButton, AppInput } from '@/components/primitives';
import { useI18n } from '@/core/i18n/use-i18n';
import { EventFilter, EventsView } from '@/core/types/domain';

const FILTERS: EventFilter[] = ['nearby', 'joined', 'created'];
const VIEWS: EventsView[] = ['list', 'map'];

type EventsHeaderControlsProps = {
  eventFilter: EventFilter;
  eventsView: EventsView;
  searchQuery: string;
  onFilterChange: (next: EventFilter) => void;
  onViewChange: (next: EventsView) => void;
  onSearchChange: (value: string) => void;
};

export function EventsHeaderControls({
  eventFilter,
  eventsView,
  searchQuery,
  onFilterChange,
  onViewChange,
  onSearchChange,
}: EventsHeaderControlsProps) {
  const { t } = useI18n();

  return (
    <View>
      <View style={styles.row}>
        {FILTERS.map((filter) => (
          <AppButton
            key={filter}
            title={t(filter)}
            variant={eventFilter === filter ? 'primary' : 'glass'}
            style={styles.compactButton}
            onPress={() => onFilterChange(filter)}
          />
        ))}
      </View>

      {eventsView === 'list' ? <AppInput value={searchQuery} onChangeText={onSearchChange} placeholder={t('searchPlaceholder')} /> : null}

      <View style={styles.row}>
        {VIEWS.map((view) => (
          <AppButton
            key={view}
            title={t(view === 'list' ? 'listView' : 'mapView')}
            variant={eventsView === view ? 'primary' : 'secondary'}
            style={styles.compactButton}
            onPress={() => onViewChange(view)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  compactButton: {
    flex: 1,
    minHeight: 40,
  },
});
