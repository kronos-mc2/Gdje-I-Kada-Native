import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { EventCard } from '@/components/events/event-card';
import { EventMap } from '@/components/map';
import { MapSearchResults } from '@/components/search';
import { AppButton, AppCard, AppDateTimeField, AppHeader, AppInput, AppScreen, AppText, SectionHeader } from '@/components/primitives';
import { useEventsQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';
import { useAppTheme } from '@/core/theme';
import { useLocationSearch } from '@/features/events/hooks/use-location-search';
import { AppEvent, Coordinates, EventVisibility } from '@/core/types/domain';

type FypSegment = 'joined' | 'created' | 'create';

type CreateFormState = {
  title: string;
  address: string;
  whenISO: string;
  about: string;
  steps: string;
  visibility: EventVisibility;
};

const INITIAL_FORM: CreateFormState = {
  title: '',
  address: '',
  whenISO: '',
  about: '',
  steps: '',
  visibility: 'public',
};
const ENTRANCE_PICKER_WIDTH = 300;
const ENTRANCE_PICKER_HEIGHT = 170;

function sortByDate(events: AppEvent[]) {
  return [...events].sort((a, b) => new Date(a.whenISO).getTime() - new Date(b.whenISO).getTime());
}

export default function FypScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { theme } = useAppTheme();

  const { data: fetchedEvents = [] } = useEventsQuery();

  const createdEvents = useAppStore((state) => state.createdEvents);
  const joinedEventIds = useAppStore((state) => state.joinedEventIds);
  const createEvent = useAppStore((state) => state.createEvent);
  const pickedEntranceCoordinates = useAppStore((state) => state.fypEntranceCoordinates);
  const clearFypEntranceCoordinates = useAppStore((state) => state.clearFypEntranceCoordinates);

  const [activeSegment, setActiveSegment] = useState<FypSegment>('joined');
  const [form, setForm] = useState<CreateFormState>(INITIAL_FORM);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [entranceCoordinate, setEntranceCoordinate] = useState<Coordinates | null>(null);
  const lastSyncedLocationId = useRef<string | null>(null);

  const { data: locationResults = [], isFetching: isSearchingLocations } = useLocationSearch(form.address, locale);

  const allEvents = useMemo(() => [...createdEvents, ...fetchedEvents], [createdEvents, fetchedEvents]);

  const joinedEvents = useMemo(
    () => sortByDate(allEvents.filter((event) => joinedEventIds.includes(event.id))),
    [allEvents, joinedEventIds],
  );

  const createdEventsForFyp = useMemo(() => sortByDate(allEvents.filter((event) => event.type === 'created')), [allEvents]);

  const selectedLocation =
    locationResults.find((result) => result.id === selectedLocationId) ??
    (locationResults.length > 0 ? locationResults[0] : null);

  useEffect(() => {
    if (locationResults.length === 0) {
      setSelectedLocationId(null);
      return;
    }

    if (!selectedLocationId || !locationResults.some((result) => result.id === selectedLocationId)) {
      setSelectedLocationId(locationResults[0].id);
    }
  }, [locationResults, selectedLocationId]);

  useEffect(() => {
    if (!selectedLocation) {
      setEntranceCoordinate(null);
      lastSyncedLocationId.current = null;
      return;
    }

    if (selectedLocation.id === lastSyncedLocationId.current) {
      return;
    }

    setEntranceCoordinate(selectedLocation.coordinates);
    lastSyncedLocationId.current = selectedLocation.id;
  }, [selectedLocation]);

  useEffect(() => {
    if (!pickedEntranceCoordinates) {
      return;
    }

    setEntranceCoordinate(pickedEntranceCoordinates);
    clearFypEntranceCoordinates();
  }, [pickedEntranceCoordinates, clearFypEntranceCoordinates]);

  const openEventDetails = (eventId: string) => {
    router.push({ pathname: '/event/[id]', params: { id: eventId } });
  };

  const updateForm = (key: keyof CreateFormState, value: string | EventVisibility) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const onCreateEvent = () => {
    if (!form.title.trim() || !form.address.trim() || !form.steps.trim() || !form.whenISO.trim()) {
      Alert.alert(t('validation'), t('fillAllFields'));
      return;
    }

    if (Number.isNaN(new Date(form.whenISO).getTime())) {
      Alert.alert(t('validation'), t('invalidDate'));
      return;
    }

    if (!selectedLocation) {
      Alert.alert(t('validation'), t('noLocationsFound'));
      return;
    }

    const baseCoordinates = selectedLocation.coordinates;

    createEvent({
      titleHr: form.title,
      titleEn: form.title,
      whereHr: form.address,
      whereEn: form.address,
      aboutHr: form.about || form.steps,
      aboutEn: form.about || form.steps,
      whenISO: form.whenISO,
      coordinates: baseCoordinates,
      entranceCoordinates: entranceCoordinate ?? baseCoordinates,
      entryInstructionsHr: form.steps,
      entryInstructionsEn: form.steps,
      visibility: form.visibility,
    });

    setForm(INITIAL_FORM);
    setEntranceCoordinate(null);
    setSelectedLocationId(null);
    setActiveSegment('created');

    Alert.alert(t('addNewEvent'), t('eventCreated'));
  };

  const renderEventSection = (events: AppEvent[], emptyLabel: string) => {
    if (events.length === 0) {
      return (
        <AppCard variant="glass" style={{ marginTop: 8 }}>
          <AppText variant="body" color="textMuted">
            {emptyLabel}
          </AppText>
        </AppCard>
      );
    }

    return events.map((event) => <EventCard key={event.id} event={event} locale={locale} onPress={() => openEventDetails(event.id)} />);
  };

  return (
    <AppScreen scroll>
      <AppHeader title={t('fyp')} subtitle={t('fypSubtitle')} />

      <View style={styles.segmentRow}>
        <AppButton
          title={t('joined')}
          variant={activeSegment === 'joined' ? 'primary' : 'glass'}
          style={styles.segmentButton}
          onPress={() => setActiveSegment('joined')}
        />
        <AppButton
          title={t('created')}
          variant={activeSegment === 'created' ? 'primary' : 'glass'}
          style={styles.segmentButton}
          onPress={() => setActiveSegment('created')}
        />
        <AppButton
          title={t('createEvent')}
          variant={activeSegment === 'create' ? 'primary' : 'glass'}
          style={styles.segmentButton}
          onPress={() => setActiveSegment('create')}
        />
      </View>

      {activeSegment === 'joined' ? (
        <>
          <SectionHeader title={t('joined')} subtitle={`${joinedEvents.length}`} />
          {renderEventSection(joinedEvents, t('noJoinedEvents'))}
        </>
      ) : null}

      {activeSegment === 'created' ? (
        <>
          <SectionHeader title={t('created')} subtitle={`${createdEventsForFyp.length}`} />
          {renderEventSection(createdEventsForFyp, t('noCreatedEvents'))}
        </>
      ) : null}

      {activeSegment === 'create' ? (
        <>
          <SectionHeader title={t('createOnFyp')} subtitle={t('createEvent')} />

          <AppCard variant="glass" style={styles.createCard}>
            <AppInput
              label={t('titleLabel')}
              value={form.title}
              onChangeText={(value) => updateForm('title', value)}
              placeholder={t('titleLabel')}
            />

            <AppInput
              label={t('addressLabel')}
              value={form.address}
              onChangeText={(value) => {
                updateForm('address', value);
                setSelectedLocationId(null);
                lastSyncedLocationId.current = null;
              }}
              placeholder={t('locationLabel')}
            />

            <MapSearchResults
              visible={form.address.trim().length > 0}
              loading={isSearchingLocations}
              query={form.address}
              results={locationResults}
              searchingLabel={t('searchingLocations')}
              noResultsLabel={t('noLocationsFound')}
              hintLabel={t('typeToSearchLocation')}
              providerLabel={t('mapSearchSource')}
              onSelectResult={(result) => {
                setSelectedLocationId(result.id);
                const fullAddress = result.subtitle ? `${result.title}, ${result.subtitle}` : result.title;
                updateForm('address', fullAddress);
              }}
            />

            <AppText variant="label" color="textMuted" style={styles.inlineLabel}>
              {t('dragDropEntrance')}
            </AppText>
            <View style={[styles.entrancePicker, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceElevated }]}>
              {selectedLocation ? (
                <EventMap
                  events={[]}
                  locale={locale}
                  userLocation={selectedLocation.coordinates}
                  selectedEventId={null}
                  focusCoordinate={selectedLocation.coordinates}
                  searchMarker={entranceCoordinate}
                  interactive={false}
                  onSelectEvent={() => undefined}
                />
              ) : null}
            </View>
            <AppButton
              title={t('openMapPicker')}
              variant="secondary"
              style={styles.openMapButton}
              disabled={!selectedLocation}
              onPress={() => {
                if (!selectedLocation) {
                  return;
                }

                router.push({
                  pathname: '/entrance-map-picker' as any,
                  params: {
                    centerLat: String(selectedLocation.coordinates.latitude),
                    centerLng: String(selectedLocation.coordinates.longitude),
                    pinLat: String((entranceCoordinate ?? selectedLocation.coordinates).latitude),
                    pinLng: String((entranceCoordinate ?? selectedLocation.coordinates).longitude),
                  },
                });
              }}
            />
            <AppText variant="caption" color="textMuted" style={styles.helpText}>
              {selectedLocation ? t('mapPinPreview') : t('typeToSearchLocation')}
            </AppText>

            <AppInput
              label={t('stepByStep')}
              value={form.steps}
              onChangeText={(value) => updateForm('steps', value)}
              multiline
              style={styles.multilineInput}
              placeholder={t('stepByStep')}
            />

            <AppDateTimeField label={t('dateLabel')} locale={locale} valueISO={form.whenISO} onChangeISO={(value) => updateForm('whenISO', value)} />

            <AppInput
              label={t('aboutLabel')}
              value={form.about}
              onChangeText={(value) => updateForm('about', value)}
              multiline
              style={styles.multilineInput}
              placeholder={t('aboutLabel')}
            />

            <AppText variant="label" color="textMuted" style={styles.inlineLabel}>
              {t('eventVisibility')}
            </AppText>
            <View style={styles.visibilityRow}>
              <AppButton
                title={t('publicOption')}
                variant={form.visibility === 'public' ? 'primary' : 'secondary'}
                style={styles.visibilityButton}
                onPress={() => updateForm('visibility', 'public')}
              />
              <AppButton
                title={t('privateOption')}
                variant={form.visibility === 'private' ? 'primary' : 'secondary'}
                style={styles.visibilityButton}
                onPress={() => updateForm('visibility', 'private')}
              />
            </View>

            <AppButton title={t('submit')} variant="glass" style={{ marginTop: 10 }} onPress={onCreateEvent} />
          </AppCard>
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  segmentButton: {
    flex: 1,
    minHeight: 42,
  },
  createCard: {
    marginTop: 6,
  },
  inlineLabel: {
    marginBottom: 6,
  },
  entrancePicker: {
    width: ENTRANCE_PICKER_WIDTH,
    maxWidth: '100%',
    alignSelf: 'center',
    height: ENTRANCE_PICKER_HEIGHT,
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 8,
    overflow: 'hidden',
  },
  openMapButton: {
    marginBottom: 8,
  },
  helpText: {
    marginBottom: 14,
  },
  multilineInput: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityButton: {
    flex: 1,
  },
});
