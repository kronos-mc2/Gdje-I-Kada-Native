import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { EventMap } from '@/components/map';
import { AppButton, AppCard, AppDateTimeField, AppInput, AppScreen, AppText } from '@/components/primitives';
import { useCreateEventMutation } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';
import { useAppTheme } from '@/core/theme';
import { Coordinates, EventAttendanceMode, EventVisibility } from '@/core/types/domain';
import {
  CREATE_EVENT_STEPS,
  CreateEventFormState,
  CreateEventStep,
  INITIAL_CREATE_EVENT_FORM,
  parseOptionalMoneyAmount,
  parseOptionalPositiveInteger,
} from '@/features/events/create/create-event-form';
import { CreateEventAddressField } from '@/features/events/create/create-event-address-field';
import { CreateEventSegmentedControl } from '@/features/events/create/create-event-segmented-control';
import { CreateEventStepShell } from '@/features/events/create/create-event-step-shell';
import { LocationSearchResult } from '@/services/locationSearch';

const getNextStep = (step: CreateEventStep) => CREATE_EVENT_STEPS[CREATE_EVENT_STEPS.indexOf(step) + 1];
const getPreviousStep = (step: CreateEventStep) => CREATE_EVENT_STEPS[CREATE_EVENT_STEPS.indexOf(step) - 1];

export default function CreateEventScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { theme } = useAppTheme();
  const { mutateAsync: createEvent, isPending: isSubmitting } = useCreateEventMutation();

  const setEventFilter = useAppStore((state) => state.setEventFilter);
  const userLocation = useAppStore((state) => state.userLocation);
  const entranceCoordinates = useAppStore((state) => state.fypEntranceCoordinates);
  const clearEntranceCoordinates = useAppStore((state) => state.clearFypEntranceCoordinates);

  const [step, setStep] = useState<CreateEventStep>('basics');
  const [form, setForm] = useState<CreateEventFormState>(INITIAL_CREATE_EVENT_FORM);
  const [visibility, setVisibility] = useState<EventVisibility>('public');
  const [attendanceMode, setAttendanceMode] = useState<EventAttendanceMode>('open');
  const [eventCoordinates, setEventCoordinates] = useState<Coordinates | null>(null);
  const [createdTitle, setCreatedTitle] = useState<string | null>(null);

  const stepCopy = useMemo(
    () => ({
      basics: {
        eyebrow: t('createEventStepBasicsEyebrow'),
        title: t('createEventStepBasicsTitle'),
        subtitle: t('createEventStepBasicsSubtitle'),
      },
      time: {
        eyebrow: t('createEventStepTimeEyebrow'),
        title: t('createEventStepTimeTitle'),
        subtitle: t('createEventStepTimeSubtitle'),
      },
      location: {
        eyebrow: t('createEventStepLocationEyebrow'),
        title: t('createEventStepLocationTitle'),
        subtitle: t('createEventStepLocationSubtitle'),
      },
      settings: {
        eyebrow: t('createEventStepSettingsEyebrow'),
        title: t('createEventStepSettingsTitle'),
        subtitle: t('createEventStepSettingsSubtitle'),
      },
    }),
    [t],
  );

  const updateField = (key: keyof CreateEventFormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateAddress = (value: string) => {
    setForm((current) => ({ ...current, address: value }));
    setEventCoordinates(null);
    clearEntranceCoordinates();
  };

  const selectAddress = (result: LocationSearchResult) => {
    setEventCoordinates(result.coordinates);
    setForm((current) => ({
      ...current,
      locationName: current.locationName.trim() ? current.locationName : result.title,
    }));
  };

  const goBack = () => {
    const previousStep = getPreviousStep(step);
    if (previousStep) {
      setStep(previousStep);
      return;
    }

    router.back();
  };

  const openEntrancePicker = () => {
    if (!eventCoordinates) {
      return;
    }

    router.push({
      pathname: '/entrance-map-picker',
      params: {
        centerLat: String(eventCoordinates.latitude),
        centerLng: String(eventCoordinates.longitude),
      },
    });
  };

  const resolveEventCoordinates = (): Coordinates => eventCoordinates ?? userLocation;

  const validateCurrentStep = () => {
    if (step === 'basics') {
      if (!requireFields(['title', 'about'])) {
        return false;
      }
      if (parseEventTags(form.tags).length > 5) {
        Alert.alert(t('validation'), t('eventTagsMax'));
        return false;
      }
      return true;
    }

    if (step === 'time') {
      if (!requireFields(['startAt'])) {
        return false;
      }

      if (Number.isNaN(new Date(form.startAt).getTime())) {
        Alert.alert(t('validation'), t('invalidDate'));
        return false;
      }

      if (form.endAt.trim() && Number.isNaN(new Date(form.endAt).getTime())) {
        Alert.alert(t('validation'), t('invalidDate'));
        return false;
      }

      if (form.endAt.trim() && new Date(form.endAt).getTime() < new Date(form.startAt).getTime()) {
        Alert.alert(t('validation'), t('invalidEndDate'));
        return false;
      }
    }

    if (step === 'location') {
      if (!requireFields(['locationName', 'address'])) {
        return false;
      }

      if (!eventCoordinates) {
        Alert.alert(t('validation'), t('selectAddressFromSuggestions'));
        return false;
      }

      return true;
    }

    if (step === 'settings') {
      const capacity = parseOptionalPositiveInteger(form.capacity);
      if (capacity === null) {
        Alert.alert(t('validation'), t('invalidCapacity'));
        return false;
      }

      const priceAmount = attendanceMode === 'paid' ? parseOptionalMoneyAmount(form.priceAmount) : undefined;
      if (attendanceMode === 'paid' && priceAmount === null) {
        Alert.alert(t('validation'), t('invalidPrice'));
        return false;
      }

      if (attendanceMode === 'paid' && form.priceCurrency.trim().toUpperCase().length !== 3) {
        Alert.alert(t('validation'), t('invalidCurrency'));
        return false;
      }
    }

    return true;
  };

  const requireFields = (keys: (keyof CreateEventFormState)[]) => {
    const hasMissingField = keys.some((key) => form[key].trim().length === 0);
    if (hasMissingField) {
      Alert.alert(t('validation'), t('fillAllFields'));
      return false;
    }

    return true;
  };

  const onNext = () => {
    if (!validateCurrentStep()) {
      return;
    }

    const nextStep = getNextStep(step);
    if (nextStep) {
      setStep(nextStep);
      return;
    }

    void onSubmit();
  };

  const onSubmit = async () => {
    const capacity = parseOptionalPositiveInteger(form.capacity);
    const priceAmount = attendanceMode === 'paid' ? parseOptionalMoneyAmount(form.priceAmount) : undefined;
    const entryInstructions = form.entryInstructions.trim();
    const tags = parseEventTags(form.tags);

    try {
      await createEvent({
        title: form.title.trim(),
        where: form.locationName.trim(),
        address: form.address.trim(),
        about: form.about.trim(),
        whenISO: form.startAt,
        startAt: form.startAt,
        endAt: form.endAt.trim() || undefined,
        coordinates: resolveEventCoordinates(),
        entranceCoordinates: entranceCoordinates ?? undefined,
        entryInstructions: entryInstructions || undefined,
        visibility,
        attendanceMode,
        priceAmount: typeof priceAmount === 'number' ? priceAmount : undefined,
        priceCurrency: attendanceMode === 'paid' ? form.priceCurrency.trim().toUpperCase() : undefined,
        capacity: typeof capacity === 'number' ? capacity : undefined,
        tags,
      });

      clearEntranceCoordinates();
      setEventFilter('created');
      setCreatedTitle(form.title.trim());
    } catch {
      Alert.alert(t('validation'), t('eventCreateFailed'));
    }
  };

  if (createdTitle) {
    return (
      <AppScreen scroll contentContainerStyle={styles.successScreen}>
        <AppCard variant="glass" style={styles.successPanel}>
          <View style={[styles.successIcon, { backgroundColor: theme.colors.surfaceElevated }]}>
            <Ionicons name="checkmark" size={42} color={theme.colors.accent} />
          </View>
          <View style={styles.successCopy}>
            <AppText variant="label" color="textMuted">
              {t('eventCreated')}
            </AppText>
            <AppText variant="title" style={styles.successTitle}>
              {t('createEventSuccessTitle')}
            </AppText>
            <AppText variant="body" color="textSecondary" style={styles.successBody}>
              {t('createEventSuccessBody').replace('{eventName}', createdTitle)}
            </AppText>
          </View>
          <AppButton title={t('backToStart')} variant="glass" onPress={() => router.replace('/(tabs)')} style={styles.successButton} />
        </AppCard>
      </AppScreen>
    );
  }

  const copy = stepCopy[step];

  return (
    <AppScreen scroll contentContainerStyle={styles.screenContent}>
      <CreateEventStepShell step={step} backLabel={t('back')} eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle} onClose={goBack}>
        {step === 'basics' ? (
          <>
            <AppInput
              label={t('titleLabel')}
              value={form.title}
              onChangeText={(value) => updateField('title', value)}
              placeholder={t('createEventTitlePlaceholder')}
            />
            <AppInput
              label={t('aboutLabel')}
              value={form.about}
              onChangeText={(value) => updateField('about', value)}
              placeholder={t('createEventAboutPlaceholder')}
              multiline
              style={styles.textArea}
            />
            <AppInput
              label={`${t('eventTags')} (${t('optional')})`}
              value={form.tags}
              onChangeText={(value) => updateField('tags', value)}
              placeholder={t('eventTagsPlaceholder')}
            />
            <AppText variant="caption" color="textMuted">
              {t('eventTagsHint')}
            </AppText>
          </>
        ) : null}

        {step === 'time' ? (
          <>
            <AppDateTimeField label={t('startDateLabel')} locale={locale} valueISO={form.startAt} onChangeISO={(value) => updateField('startAt', value)} />
            <AppDateTimeField
              label={`${t('endDateLabel')} (${t('optional')})`}
              locale={locale}
              valueISO={form.endAt}
              onChangeISO={(value) => updateField('endAt', value)}
              onClear={() => updateField('endAt', '')}
              clearAccessibilityLabel={t('clearDateTime')}
            />
          </>
        ) : null}

        {step === 'location' ? (
          <>
            <AppInput
              label={t('locationLabel')}
              value={form.locationName}
              onChangeText={(value) => updateField('locationName', value)}
              placeholder={t('createEventLocationPlaceholder')}
            />
            <CreateEventAddressField
              label={t('addressLabel')}
              value={form.address}
              onChangeText={updateAddress}
              onSelectAddress={selectAddress}
              placeholder={t('createEventAddressPlaceholder')}
              locale={locale}
              proximity={userLocation}
              searchingLabel={t('searchingLocations')}
              noResultsLabel={t('noLocationsFound')}
              hintLabel={t('typeToSearchLocation')}
              providerLabel={t('mapSearchSource')}
            />
            <View style={[styles.mapPreview, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <EventMap
                key={eventCoordinates ? `${eventCoordinates.latitude}:${eventCoordinates.longitude}` : 'empty-address-map'}
                events={[]}
                locale={locale}
                userLocation={eventCoordinates ?? userLocation}
                selectedEventId={null}
                searchMarker={eventCoordinates}
                focusCoordinate={eventCoordinates}
                initialZoomLevel={eventCoordinates ? 16.8 : 13.2}
                interactive={false}
                onSelectEvent={() => undefined}
              />
              {!eventCoordinates ? (
                <View style={[styles.mapPlaceholder, { backgroundColor: theme.colors.overlay }]}>
                  <Ionicons name="location-outline" size={22} color={theme.colors.textPrimary} />
                  <AppText variant="caption" color="textSecondary" style={styles.mapPlaceholderText}>
                    {t('selectAddressForMapPreview')}
                  </AppText>
                </View>
              ) : null}
            </View>
            <AppInput
              label={`${t('entryInstructions')} (${t('optional')})`}
              value={form.entryInstructions}
              onChangeText={(value) => updateField('entryInstructions', value)}
              placeholder={t('createEventEntryInstructionsPlaceholder')}
              multiline
              style={styles.textAreaSmall}
            />
            <AppButton
              title={eventCoordinates && entranceCoordinates ? t('changeEntrancePin') : t('chooseEntrancePin')}
              variant="glass"
              disabled={!eventCoordinates}
              onPress={openEntrancePicker}
            />
            <AppText variant="caption" color="textMuted">
              {eventCoordinates && entranceCoordinates
                ? `${entranceCoordinates.latitude.toFixed(5)}, ${entranceCoordinates.longitude.toFixed(5)}`
                : eventCoordinates
                  ? t('noEntrancePin')
                  : t('chooseAddressBeforeEntrance')}
            </AppText>
          </>
        ) : null}

        {step === 'settings' ? (
          <>
            <View style={[styles.capacityRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <AppText variant="body" color="textSecondary">
                {t('capacityLabel')}
              </AppText>
              <AppInput
                value={form.capacity}
                onChangeText={(value) => updateField('capacity', value)}
                placeholder="-"
                keyboardType="number-pad"
                containerStyle={styles.capacityInputWrap}
                style={styles.capacityInput}
              />
            </View>

            <CreateEventSegmentedControl
              label={t('eventVisibility')}
              value={visibility}
              onChange={setVisibility}
              options={[
                { label: t('publicOption'), value: 'public' },
                { label: t('friendsOption'), value: 'friends' },
              ]}
            />
            <CreateEventSegmentedControl
              label={t('attendanceMode')}
              value={attendanceMode}
              onChange={setAttendanceMode}
              options={[
                { label: t('openAttendance'), value: 'open' },
                { label: t('waitlistAttendance'), value: 'waitlist' },
                { label: t('paidAttendance'), value: 'paid' },
              ]}
            />

            {attendanceMode === 'paid' ? (
              <View style={styles.paidFields}>
                <AppInput
                  label={t('priceAmountLabel')}
                  value={form.priceAmount}
                  onChangeText={(value) => updateField('priceAmount', value)}
                  placeholder="10.00"
                  keyboardType="decimal-pad"
                />
                <AppInput
                  label={t('priceCurrencyLabel')}
                  value={form.priceCurrency}
                  onChangeText={(value) => updateField('priceCurrency', value)}
                  placeholder="EUR"
                  autoCapitalize="characters"
                />
              </View>
            ) : null}
          </>
        ) : null}

        <View style={styles.actions}>
          <AppButton title={`← ${t('back')}`} variant="ghost" onPress={goBack} />
          <AppButton
            title={step === 'settings' ? (isSubmitting ? t('loading') : t('finish')) : `${t('next')} →`}
            variant="glass"
            disabled={isSubmitting}
            onPress={onNext}
            style={styles.nextButton}
          />
        </View>
      </CreateEventStepShell>
    </AppScreen>
  );
}

function parseEventTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[,\s]+/)
        .map((tag) => tag.replace(/^#+/, '').trim())
        .filter(Boolean),
    ),
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: 24,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  textAreaSmall: {
    minHeight: 78,
    textAlignVertical: 'top',
  },
  mapPreview: {
    alignItems: 'stretch',
    borderRadius: 16,
    borderWidth: 1,
    height: 172,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  mapPlaceholderText: {
    textAlign: 'center',
  },
  capacityRow: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 12,
  },
  capacityInputWrap: {
    flex: 1,
    marginBottom: 0,
  },
  capacityInput: {
    minHeight: 42,
    textAlign: 'right',
  },
  paidFields: {
    gap: 0,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 8,
  },
  nextButton: {
    minWidth: 116,
  },
  successScreen: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  successPanel: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 52,
  },
  successIcon: {
    alignItems: 'center',
    borderRadius: 999,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  successCopy: {
    alignItems: 'center',
    gap: 12,
  },
  successTitle: {
    maxWidth: 300,
    textAlign: 'center',
  },
  successBody: {
    maxWidth: 320,
    textAlign: 'center',
  },
  successButton: {
    minWidth: 200,
  },
});
