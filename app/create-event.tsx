import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppButton, AppDateTimeField, AppHeader, AppInput, AppScreen, AppText, SectionHeader } from '@/components/primitives';
import { useCreateEventMutation } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';
import { Coordinates, EventAttendanceMode, EventVisibility } from '@/core/types/domain';

type FormState = {
  titleHr: string;
  titleEn: string;
  whereHr: string;
  whereEn: string;
  address: string;
  aboutHr: string;
  aboutEn: string;
  whenISO: string;
  endAt: string;
  entryInstructionsHr: string;
  entryInstructionsEn: string;
  priceAmount: string;
  priceCurrency: string;
  capacity: string;
};

type FieldConfig = {
  key: keyof FormState;
  label: string;
  placeholder: string;
  multiline?: boolean;
  optional?: boolean;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
};

const INITIAL_FORM: FormState = {
  titleHr: '',
  titleEn: '',
  whereHr: '',
  whereEn: '',
  address: '',
  aboutHr: '',
  aboutEn: '',
  whenISO: '',
  endAt: '',
  entryInstructionsHr: '',
  entryInstructionsEn: '',
  priceAmount: '',
  priceCurrency: 'EUR',
  capacity: '',
};

const REQUIRED_FIELDS: (keyof FormState)[] = ['titleHr', 'titleEn', 'whereHr', 'whereEn', 'address', 'aboutHr', 'aboutEn', 'whenISO'];

const parseOptionalPositiveInteger = (value: string) => {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseOptionalMoneyAmount = (value: string) => {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export default function CreateEventScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { mutateAsync: createEvent, isPending: isSubmitting } = useCreateEventMutation();

  const setEventFilter = useAppStore((state) => state.setEventFilter);
  const userLocation = useAppStore((state) => state.userLocation);
  const entranceCoordinates = useAppStore((state) => state.fypEntranceCoordinates);
  const clearEntranceCoordinates = useAppStore((state) => state.clearFypEntranceCoordinates);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [visibility, setVisibility] = useState<EventVisibility>('public');
  const [attendanceMode, setAttendanceMode] = useState<EventAttendanceMode>('open');

  const fields = useMemo<FieldConfig[]>(
    () => [
      { key: 'titleHr', label: t('titleLabel') + ' (HR)', placeholder: 'Npr. Vecer elektronike' },
      { key: 'titleEn', label: t('titleLabel') + ' (EN)', placeholder: 'Example: Electronic Night' },
      { key: 'whereHr', label: t('locationLabel') + ' (HR)', placeholder: 'Npr. Dom sportova' },
      { key: 'whereEn', label: t('locationLabel') + ' (EN)', placeholder: 'Example: Sports Hall' },
      { key: 'address', label: t('addressLabel'), placeholder: 'Npr. Trg Kresimira Cosica 11, Zagreb' },
      { key: 'aboutHr', label: t('aboutLabel') + ' (HR)', placeholder: 'Kratki opis eventa', multiline: true },
      { key: 'aboutEn', label: t('aboutLabel') + ' (EN)', placeholder: 'Short event description', multiline: true },
      {
        key: 'entryInstructionsHr',
        label: t('entryInstructions') + ' (HR)',
        placeholder: 'Npr. Ulaz je s juzne strane zgrade',
        multiline: true,
        optional: true,
      },
      {
        key: 'entryInstructionsEn',
        label: t('entryInstructions') + ' (EN)',
        placeholder: 'Example: Entrance is on the south side',
        multiline: true,
        optional: true,
      },
      { key: 'capacity', label: t('capacityLabel'), placeholder: '150', optional: true, keyboardType: 'number-pad' },
    ],
    [t],
  );

  const paidFields = useMemo<FieldConfig[]>(
    () => [
      { key: 'priceAmount', label: t('priceAmountLabel'), placeholder: '10.00', keyboardType: 'decimal-pad' },
      { key: 'priceCurrency', label: t('priceCurrencyLabel'), placeholder: 'EUR' },
    ],
    [t],
  );

  const updateField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openEntrancePicker = () => {
    const pin = entranceCoordinates ?? userLocation;

    router.push({
      pathname: '/entrance-map-picker',
      params: {
        centerLat: String(userLocation.latitude),
        centerLng: String(userLocation.longitude),
        pinLat: String(pin.latitude),
        pinLng: String(pin.longitude),
      },
    });
  };

  const resolveEventCoordinates = (): Coordinates => entranceCoordinates ?? userLocation;

  const onSubmit = async () => {
    const hasMissingField = REQUIRED_FIELDS.some((key) => form[key].trim().length === 0);

    if (hasMissingField) {
      Alert.alert(t('validation'), t('fillAllFields'));
      return;
    }

    if (Number.isNaN(new Date(form.whenISO).getTime())) {
      Alert.alert(t('validation'), t('invalidDate'));
      return;
    }

    if (form.endAt.trim() && Number.isNaN(new Date(form.endAt).getTime())) {
      Alert.alert(t('validation'), t('invalidDate'));
      return;
    }

    if (form.endAt.trim() && new Date(form.endAt).getTime() < new Date(form.whenISO).getTime()) {
      Alert.alert(t('validation'), t('invalidEndDate'));
      return;
    }

    const capacity = parseOptionalPositiveInteger(form.capacity);
    if (capacity === null) {
      Alert.alert(t('validation'), t('invalidCapacity'));
      return;
    }

    const priceAmount = attendanceMode === 'paid' ? parseOptionalMoneyAmount(form.priceAmount) : undefined;
    if (attendanceMode === 'paid' && priceAmount === null) {
      Alert.alert(t('validation'), t('invalidPrice'));
      return;
    }

    const priceCurrency = form.priceCurrency.trim().toUpperCase();
    if (attendanceMode === 'paid' && priceCurrency.length !== 3) {
      Alert.alert(t('validation'), t('invalidCurrency'));
      return;
    }

    try {
      await createEvent({
        titleHr: form.titleHr.trim(),
        titleEn: form.titleEn.trim(),
        whereHr: form.whereHr.trim(),
        whereEn: form.whereEn.trim(),
        address: form.address.trim(),
        aboutHr: form.aboutHr.trim(),
        aboutEn: form.aboutEn.trim(),
        whenISO: form.whenISO,
        startAt: form.whenISO,
        endAt: form.endAt.trim() || undefined,
        coordinates: resolveEventCoordinates(),
        entranceCoordinates: entranceCoordinates ?? undefined,
        entryInstructionsHr: form.entryInstructionsHr.trim() || undefined,
        entryInstructionsEn: form.entryInstructionsEn.trim() || undefined,
        visibility,
        attendanceMode,
        priceAmount: typeof priceAmount === 'number' ? priceAmount : undefined,
        priceCurrency: attendanceMode === 'paid' ? priceCurrency : undefined,
        capacity,
      });

      clearEntranceCoordinates();
      setEventFilter('created');
      Alert.alert(t('addNewEvent'), t('eventCreated'));
      router.replace('/(tabs)');
    } catch {
      Alert.alert(t('validation'), t('eventCreateFailed'));
    }
  };

  return (
    <AppScreen scroll>
      <AppHeader title={t('addNewEvent')} subtitle={t('createEvent')} />

      <SectionHeader title={t('details')} />
      {fields.map((field) => (
        <AppInput
          key={field.key}
          label={field.optional ? `${field.label} (${t('optional')})` : field.label}
          value={form[field.key]}
          onChangeText={(value) => updateField(field.key, value)}
          placeholder={field.placeholder}
          multiline={field.multiline}
          keyboardType={field.keyboardType}
          autoCapitalize={field.key === 'priceCurrency' ? 'characters' : undefined}
          style={field.multiline ? { minHeight: 96, textAlignVertical: 'top' } : undefined}
        />
      ))}

      <AppDateTimeField label={t('startDateLabel')} locale={locale} valueISO={form.whenISO} onChangeISO={(value) => updateField('whenISO', value)} />
      <AppDateTimeField label={`${t('endDateLabel')} (${t('optional')})`} locale={locale} valueISO={form.endAt} onChangeISO={(value) => updateField('endAt', value)} />

      <SectionHeader title={t('eventVisibility')} />
      <View style={styles.segmentRow}>
        <SegmentButton active={visibility === 'public'} label={t('publicOption')} onPress={() => setVisibility('public')} />
        <SegmentButton active={visibility === 'friends'} label={t('friendsOption')} onPress={() => setVisibility('friends')} />
      </View>

      <SectionHeader title={t('attendanceMode')} />
      <View style={styles.segmentRow}>
        <SegmentButton active={attendanceMode === 'open'} label={t('openAttendance')} onPress={() => setAttendanceMode('open')} />
        <SegmentButton active={attendanceMode === 'waitlist'} label={t('waitlistAttendance')} onPress={() => setAttendanceMode('waitlist')} />
        <SegmentButton active={attendanceMode === 'paid'} label={t('paidAttendance')} onPress={() => setAttendanceMode('paid')} />
      </View>

      {attendanceMode === 'paid'
        ? paidFields.map((field) => (
            <AppInput
              key={field.key}
              label={field.label}
              value={form[field.key]}
              onChangeText={(value) => updateField(field.key, value)}
              placeholder={field.placeholder}
              keyboardType={field.keyboardType}
              autoCapitalize={field.key === 'priceCurrency' ? 'characters' : undefined}
            />
          ))
        : null}

      <SectionHeader title={t('entrancePin')} />
      <View style={styles.entranceBlock}>
        <AppText variant="body" color="textSecondary">
          {entranceCoordinates
            ? `${entranceCoordinates.latitude.toFixed(5)}, ${entranceCoordinates.longitude.toFixed(5)}`
            : t('noEntrancePin')}
        </AppText>
        <AppButton title={entranceCoordinates ? t('changeEntrancePin') : t('chooseEntrancePin')} variant="secondary" onPress={openEntrancePicker} />
      </View>

      <AppButton
        title={isSubmitting ? t('loading') : t('submit')}
        variant="glass"
        disabled={isSubmitting}
        onPress={() => void onSubmit()}
        style={{ marginTop: 8 }}
      />
    </AppScreen>
  );
}

type SegmentButtonProps = {
  active: boolean;
  label: string;
  onPress: () => void;
};

function SegmentButton({ active, label, onPress }: SegmentButtonProps) {
  return <AppButton title={label} variant={active ? 'primary' : 'secondary'} style={styles.segmentButton} onPress={onPress} />;
}

const styles = StyleSheet.create({
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
  },
  entranceBlock: {
    gap: 10,
    marginBottom: 16,
  },
});
