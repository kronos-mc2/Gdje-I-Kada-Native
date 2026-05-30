import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, AppCard, AppInput, AppText } from '@/components/primitives';
import { MapSearchResults } from '@/components/search/map-search-results';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { EventAttendanceMode, FypFeedFilter, FypFeedPreset, FypLocationMode } from '@/core/types/domain';
import { FYP_PRESET_KEYS } from '@/features/events/fyp/fyp-feed-filters';
import { useLocationSearch } from '@/features/events/hooks/use-location-search';
import { useKeyboardState } from '@/features/messages/hooks/use-keyboard-bottom-inset';
import type { LocationSearchResult } from '@/services/locationSearch/types';

type FypDiscoverHeaderProps = Readonly<{
  filter: FypFeedFilter;
  topInset: number;
  onFilterChange: (filter: FypFeedFilter) => void;
}>;

type ChipProps = Readonly<{
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}>;

export function FypDiscoverHeader({ filter, topInset, onFilterChange }: FypDiscoverHeaderProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const locationLabel = getLocationLabel(filter, t);

  return (
    <>
      <View pointerEvents="box-none" style={[styles.header, { paddingTop: topInset + 8 }]}>
        <View style={styles.titleRow}>
          <AppText variant="title" style={styles.titleText}>
            {t('fyp')}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('filters')}
            onPress={() => setModalVisible(true)}
            style={({ pressed }) => [
              styles.filterButton,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.overlay,
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            <Ionicons name="options-outline" size={19} color={theme.colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetContent}>
          {FYP_PRESET_KEYS.map((preset) => (
            <PresetChip
              key={preset}
              preset={preset}
              active={filter.preset === preset}
              onPress={() => onFilterChange({ ...filter, preset })}
            />
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          <Chip label={locationLabel} icon="location-outline" active onPress={() => setModalVisible(true)} />
          {filter.attendanceModes.length > 0 ? (
            filter.attendanceModes.map((mode) => (
              <Chip key={mode} label={getAttendanceModeLabel(mode, t)} active onPress={() => setModalVisible(true)} />
            ))
          ) : (
            <Chip label={t('fypAllEventTypes')} active={false} onPress={() => setModalVisible(true)} />
          )}
        </ScrollView>
      </View>

      <FypFilterModal
        visible={modalVisible}
        filter={filter}
        onClose={() => setModalVisible(false)}
        onSave={(nextFilter) => {
          onFilterChange(nextFilter);
          setModalVisible(false);
        }}
      />
    </>
  );
}

function PresetChip({ preset, active, onPress }: { preset: FypFeedPreset; active: boolean; onPress: () => void }) {
  const { t } = useI18n();
  const { theme } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.presetChip,
        {
          backgroundColor: active ? theme.colors.mapAccent : theme.colors.overlay,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <AppText variant="label" style={{ color: active ? '#FFFFFF' : theme.colors.textSecondary }}>
        {getPresetLabel(preset, t)}
      </AppText>
    </Pressable>
  );
}

function Chip({ label, icon, active, onPress }: ChipProps) {
  const { theme } = useAppTheme();
  const chipTextColor = active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        {
          borderColor: active ? theme.colors.mapAccent : 'rgba(255, 255, 255, 0.34)',
          backgroundColor: active ? 'rgba(139, 92, 246, 0.42)' : 'rgba(17, 17, 20, 0.64)',
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {icon ? <Ionicons name={icon} size={14} color={chipTextColor} /> : null}
      <AppText variant="label" numberOfLines={1} style={{ color: chipTextColor }}>
        {label}
      </AppText>
    </Pressable>
  );
}

function FypFilterModal({
  visible,
  filter,
  onClose,
  onSave,
}: {
  visible: boolean;
  filter: FypFeedFilter;
  onClose: () => void;
  onSave: (filter: FypFeedFilter) => void;
}) {
  const { locale, t } = useI18n();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const keyboardState = useKeyboardState({ bottomInset: insets.bottom, extraOffset: 18 });
  const [draft, setDraft] = useState(filter);
  const [focusedLocationInput, setFocusedLocationInput] = useState<FypLocationMode | null>(null);
  const locationModes = useMemo<FypLocationMode[]>(() => ['current', 'city', 'country'], []);
  const attendanceModes = useMemo<EventAttendanceMode[]>(() => ['open', 'paid', 'waitlist'], []);
  const citySearch = useLocationSearch(draft.locationMode === 'city' ? draft.city : '', locale, undefined, ['city']);
  const countrySearch = useLocationSearch(draft.locationMode === 'country' ? draft.country : '', locale, undefined, [
    'country',
  ]);
  const canSave = isFilterSaveEnabled(draft);

  useEffect(() => {
    if (visible) {
      setDraft(filter);
      setFocusedLocationInput(null);
    }
  }, [filter, visible]);

  const toggleAttendanceMode = (mode: EventAttendanceMode) => {
    setDraft((current) => ({
      ...current,
      attendanceModes: current.attendanceModes.includes(mode)
        ? current.attendanceModes.filter((item) => item !== mode)
        : [...current.attendanceModes, mode],
    }));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[
          styles.modalOverlay,
          {
            backgroundColor: theme.colors.overlay,
            paddingBottom: Math.max(insets.bottom, 18) + 34 + keyboardState.bottomInset,
          },
        ]}
        onPress={onClose}
      >
        <Pressable style={styles.modalPressable} onPress={() => {}}>
          <AppCard variant="glass" style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleBlock}>
                <AppText variant="headline">{t('fypFilters')}</AppText>
                <AppText variant="caption" color="textSecondary">
                  {t('fypFiltersSubtitle')}
                </AppText>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={t('cancel')} onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={theme.colors.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.modalSection}>
              <AppText variant="label" color="textMuted">
                {t('fypLocation')}
              </AppText>
              <View style={styles.segmentRow}>
                {locationModes.map((mode) => (
                  <Chip
                    key={mode}
                    label={getLocationModeLabel(mode, t)}
                    active={draft.locationMode === mode}
                    onPress={() => {
                      setFocusedLocationInput(mode === 'current' ? null : mode);
                      setDraft((current) => ({ ...current, locationMode: mode }));
                    }}
                  />
                ))}
              </View>
              {draft.locationMode === 'city' ? (
                <View>
                  <AppInput
                    label={t('city')}
                    value={draft.city}
                    onChangeText={(city) => setDraft((current) => ({ ...current, city, cityPlaceId: undefined }))}
                    onFocus={() => setFocusedLocationInput('city')}
                    placeholder={t('cityPlaceholder')}
                    containerStyle={styles.input}
                  />
                  <FypPlaceSearchResults
                    visible={focusedLocationInput === 'city'}
                    query={draft.city}
                    loading={citySearch.isFetching}
                    results={citySearch.data ?? []}
                    onSelectResult={(result) => {
                      setDraft((current) => ({ ...current, city: result.title, cityPlaceId: result.id }));
                      setFocusedLocationInput(null);
                    }}
                  />
                </View>
              ) : null}
              {draft.locationMode === 'country' ? (
                <View>
                  <AppInput
                    label={t('country')}
                    value={draft.country}
                    onChangeText={(country) =>
                      setDraft((current) => ({ ...current, country, countryPlaceId: undefined }))
                    }
                    onFocus={() => setFocusedLocationInput('country')}
                    placeholder={t('countryPlaceholder')}
                    containerStyle={styles.input}
                  />
                  <FypPlaceSearchResults
                    visible={focusedLocationInput === 'country'}
                    query={draft.country}
                    loading={countrySearch.isFetching}
                    results={countrySearch.data ?? []}
                    onSelectResult={(result) => {
                      setDraft((current) => ({ ...current, country: result.title, countryPlaceId: result.id }));
                      setFocusedLocationInput(null);
                    }}
                  />
                </View>
              ) : null}
            </View>

            <View style={styles.modalSection}>
              <AppText variant="label" color="textMuted">
                {t('fypEventTypes')}
              </AppText>
              <View style={styles.segmentRow}>
                {attendanceModes.map((mode) => (
                  <Chip
                    key={mode}
                    label={getAttendanceModeLabel(mode, t)}
                    active={draft.attendanceModes.includes(mode)}
                    onPress={() => toggleAttendanceMode(mode)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <AppButton
                title={t('clearFilters')}
                variant="secondary"
                style={styles.modalAction}
                onPress={() =>
                  setDraft({
                    preset: 'forYou',
                    locationMode: 'current',
                    city: '',
                    cityPlaceId: undefined,
                    country: '',
                    countryPlaceId: undefined,
                    attendanceModes: [],
                  })
                }
              />
              <AppButton
                title={t('saveFilters')}
                disabled={!canSave}
                style={[styles.modalAction, { backgroundColor: theme.colors.mapAccent }]}
                onPress={() => onSave(draft)}
              />
            </View>
          </AppCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function FypPlaceSearchResults({
  visible,
  query,
  loading,
  results,
  onSelectResult,
}: {
  visible: boolean;
  query: string;
  loading: boolean;
  results: LocationSearchResult[];
  onSelectResult: (result: LocationSearchResult) => void;
}) {
  const { t } = useI18n();

  return (
    <MapSearchResults
      visible={visible}
      loading={loading}
      query={query}
      results={results}
      searchingLabel={t('searchingLocations')}
      noResultsLabel={t('noLocationsFound')}
      hintLabel={t('typeToSearchLocation')}
      providerLabel={t('mapSearchSource')}
      onSelectResult={onSelectResult}
    />
  );
}

function getPresetLabel(preset: FypFeedPreset, t: ReturnType<typeof useI18n>['t']) {
  const labels: Record<FypFeedPreset, string> = {
    forYou: t('fypPresetForYou'),
    tonight: t('fypPresetTonight'),
    weekend: t('fypPresetWeekend'),
    trending: t('fypPresetTrending'),
    friends: t('fypPresetFriends'),
  };
  return labels[preset];
}

function getLocationModeLabel(mode: FypLocationMode, t: ReturnType<typeof useI18n>['t']) {
  const labels: Record<FypLocationMode, string> = {
    current: t('fypCurrentLocation'),
    city: t('city'),
    country: t('country'),
  };
  return labels[mode];
}

function getLocationLabel(filter: FypFeedFilter, t: ReturnType<typeof useI18n>['t']) {
  if (filter.locationMode === 'city' && filter.cityPlaceId && filter.city.trim()) {
    return filter.city.trim();
  }
  if (filter.locationMode === 'country' && filter.countryPlaceId && filter.country.trim()) {
    return filter.country.trim();
  }
  return t('fypCurrentLocation');
}

function isFilterSaveEnabled(filter: FypFeedFilter) {
  if (filter.locationMode === 'city') {
    return Boolean(filter.city.trim() && filter.cityPlaceId);
  }
  if (filter.locationMode === 'country') {
    return Boolean(filter.country.trim() && filter.countryPlaceId);
  }
  return true;
}

function getAttendanceModeLabel(mode: EventAttendanceMode, t: ReturnType<typeof useI18n>['t']) {
  const labels: Record<EventAttendanceMode, string> = {
    open: t('freeFilter'),
    paid: t('paidFilter'),
    waitlist: t('reservationFilter'),
  };
  return labels[mode];
}

const styles = StyleSheet.create({
  header: {
    left: 16,
    position: 'absolute',
    right: 16,
    top: 0,
    zIndex: 10,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleText: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(17, 17, 20, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  filterButton: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  presetContent: {
    gap: 8,
    paddingRight: 8,
    paddingTop: 12,
  },
  presetChip: {
    borderRadius: 999,
    minHeight: 34,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  filterContent: {
    gap: 8,
    paddingRight: 8,
    paddingTop: 12,
  },
  filterChip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 12,
    shadowColor: '#111114',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalPressable: {
    width: '100%',
  },
  modalPanel: {
    gap: 18,
  },
  modalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  modalTitleBlock: {
    flex: 1,
    gap: 4,
  },
  closeButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  modalSection: {
    gap: 10,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  input: {
    marginBottom: 0,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalAction: {
    flex: 1,
  },
});
