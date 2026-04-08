import { ComponentType, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import JsDateTimePicker from 'react-native-ui-datepicker';

import { AppButton } from '@/components/primitives/app-button';
import { AppCard } from '@/components/primitives/app-card';
import { AppText } from '@/components/primitives/app-text';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { Locale } from '@/core/types/domain';
import { formatEventDate } from '@/core/utils/date';

type AppDateTimeFieldProps = {
  label: string;
  locale: Locale;
  valueISO: string;
  onChangeISO: (nextISO: string) => void;
};

type DateTimePickerEvent = {
  type: 'set' | 'dismissed' | 'neutralButtonPressed';
};

const dateTimePickerModule = (() => {
  try {
    // Some Android builds/dev clients can miss this native module.
    // We catch it and gracefully fallback to a JS picker.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-community/datetimepicker') as {
      default?: ComponentType<any>;
    };
  } catch {
    return null;
  }
})();

const DateTimePicker = dateTimePickerModule?.default ?? null;

const toValidDate = (valueISO: string) => {
  const parsed = new Date(valueISO);

  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
};

export function AppDateTimeField({ label, locale, valueISO, onChangeISO }: AppDateTimeFieldProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const [showPicker, setShowPicker] = useState(false);

  const currentDate = useMemo(() => toValidDate(valueISO), [valueISO]);
  const hasValue = !Number.isNaN(new Date(valueISO).getTime());
  const hasNativeDateTimePicker = DateTimePicker !== null;

  const onPickerChange = (event: DateTimePickerEvent, nextDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);

      if (event.type === 'set' && nextDate) {
        onChangeISO(nextDate.toISOString());
      }

      return;
    }

    if (nextDate) {
      onChangeISO(nextDate.toISOString());
    }
  };

  return (
    <View style={{ marginBottom: theme.tokens.spacing.md }}>
      <AppText variant="label" color="textMuted" style={{ marginBottom: theme.tokens.spacing.xs }}>
        {label}
      </AppText>

      {hasNativeDateTimePicker ? (
        <>
          <AppButton
            title={hasValue ? formatEventDate(valueISO, locale) : t('pickDateTime')}
            variant="secondary"
            onPress={() => setShowPicker((current) => !current)}
          />

          {showPicker && Platform.OS === 'android' ? (
            <DateTimePicker value={currentDate} mode="datetime" display="default" is24Hour={locale === 'hr'} onChange={onPickerChange} />
          ) : null}

          {showPicker && Platform.OS === 'ios' ? (
            <AppCard variant="glass" style={{ marginTop: theme.tokens.spacing.sm }}>
              <DateTimePicker value={currentDate} mode="datetime" display="spinner" onChange={onPickerChange} />
              <AppButton
                title={t('done')}
                variant="secondary"
                onPress={() => setShowPicker(false)}
                style={{ marginTop: theme.tokens.spacing.sm }}
              />
            </AppCard>
          ) : null}
        </>
      ) : (
        <>
          <AppButton
            title={hasValue ? formatEventDate(valueISO, locale) : t('pickDateTime')}
            variant="secondary"
            onPress={() => setShowPicker((current) => !current)}
          />
          {showPicker ? (
            <AppCard variant="glass" style={{ marginTop: theme.tokens.spacing.sm }}>
              <JsDateTimePicker
                mode="single"
                date={currentDate}
                timePicker
                use12Hours={locale !== 'hr'}
                onChange={({ date }) => {
                  if (!date) {
                    return;
                  }

                  const nextDate = date instanceof Date ? date : new Date(date as string | number);
                  if (!Number.isNaN(nextDate.getTime())) {
                    onChangeISO(nextDate.toISOString());
                  }
                }}
              />
              <AppButton
                title={t('done')}
                variant="secondary"
                onPress={() => setShowPicker(false)}
                style={{ marginTop: theme.tokens.spacing.sm }}
              />
            </AppCard>
          ) : null}
        </>
      )}
    </View>
  );
}
