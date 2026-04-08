import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { AppButton, AppDateTimeField, AppHeader, AppInput, AppScreen } from '@/components/primitives';
import { useCreateEventMutation } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';

const randomOffset = () => (Math.random() - 0.5) * 0.04;

type FormState = {
  titleHr: string;
  titleEn: string;
  whereHr: string;
  whereEn: string;
  aboutHr: string;
  aboutEn: string;
  whenISO: string;
};

type FieldConfig = {
  key: keyof FormState;
  label: string;
  placeholder: string;
  multiline?: boolean;
};

const INITIAL_FORM: FormState = {
  titleHr: '',
  titleEn: '',
  whereHr: '',
  whereEn: '',
  aboutHr: '',
  aboutEn: '',
  whenISO: '',
};

export default function CreateEventScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { mutateAsync: createEvent, isPending: isSubmitting } = useCreateEventMutation();

  const setEventFilter = useAppStore((state) => state.setEventFilter);
  const userLocation = useAppStore((state) => state.userLocation);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const fields = useMemo<FieldConfig[]>(
    () => [
      { key: 'titleHr', label: t('titleLabel') + ' (HR)', placeholder: 'Npr. Vecer elektronike' },
      { key: 'titleEn', label: t('titleLabel') + ' (EN)', placeholder: 'Example: Electronic Night' },
      { key: 'whereHr', label: t('locationLabel') + ' (HR)', placeholder: 'Npr. Dom sportova' },
      { key: 'whereEn', label: t('locationLabel') + ' (EN)', placeholder: 'Example: Sports Hall' },
      { key: 'aboutHr', label: t('aboutLabel') + ' (HR)', placeholder: 'Kratki opis eventa', multiline: true },
      { key: 'aboutEn', label: t('aboutLabel') + ' (EN)', placeholder: 'Short event description', multiline: true },
    ],
    [t],
  );

  const updateField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const onSubmit = async () => {
    const hasMissingField = Object.values(form).some((value) => value.length === 0);

    if (hasMissingField) {
      Alert.alert(t('validation'), t('fillAllFields'));
      return;
    }

    if (Number.isNaN(new Date(form.whenISO).getTime())) {
      Alert.alert(t('validation'), t('invalidDate'));
      return;
    }

    try {
      await createEvent({
        ...form,
        coordinates: {
          latitude: userLocation.latitude + randomOffset(),
          longitude: userLocation.longitude + randomOffset(),
        },
      });

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

      {fields.map((field) => (
        <AppInput
          key={field.key}
          label={field.label}
          value={form[field.key]}
          onChangeText={(value) => updateField(field.key, value)}
          placeholder={field.placeholder}
          multiline={field.multiline}
          style={field.multiline ? { minHeight: 96, textAlignVertical: 'top' } : undefined}
        />
      ))}

      <AppDateTimeField label={t('dateLabel')} locale={locale} valueISO={form.whenISO} onChangeISO={(value) => updateField('whenISO', value)} />

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
