import Ionicons from '@expo/vector-icons/Ionicons';
import { ComponentType, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
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
  onClear?: () => void;
  clearAccessibilityLabel?: string;
};

type DateTimePickerEvent = {
  type: 'set' | 'dismissed' | 'neutralButtonPressed';
};

type AndroidPickerMode = 'date' | 'time';

type AndroidPickerOptions = {
  value: Date;
  mode: AndroidPickerMode;
  display?: 'default' | 'spinner' | 'clock' | 'calendar';
  is24Hour?: boolean;
  onChange?: (event: DateTimePickerEvent, date?: Date) => void;
};

type DateTimePickerAndroidApi = {
  open: (options: AndroidPickerOptions) => void;
};

const dateTimePickerModule = (() => {
  try {
    // Some Android builds/dev clients can miss this native module.
    // We catch it and gracefully fallback to a JS picker.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-community/datetimepicker') as {
      default?: ComponentType<any>;
      DateTimePickerAndroid?: DateTimePickerAndroidApi;
    };
  } catch {
    return null;
  }
})();

const DateTimePicker = dateTimePickerModule?.default ?? null;
const DateTimePickerAndroid = dateTimePickerModule?.DateTimePickerAndroid ?? null;

const toValidDate = (valueISO: string) => {
  const parsed = new Date(valueISO);

  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
};

export function AppDateTimeField({ label, locale, valueISO, onChangeISO, onClear, clearAccessibilityLabel }: AppDateTimeFieldProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const [showPicker, setShowPicker] = useState(false);

  const currentDate = useMemo(() => toValidDate(valueISO), [valueISO]);
  const hasValue = !Number.isNaN(new Date(valueISO).getTime());
  const NativeDateTimePicker = DateTimePicker;
  const hasNativeDateTimePicker = Platform.OS === 'android' ? DateTimePickerAndroid !== null : DateTimePicker !== null;
  const canClear = hasValue && typeof onClear === 'function';

  const clearValue = () => {
    setShowPicker(false);
    onClear?.();
  };

  const openAndroidTimePicker = (datePart: Date) => {
    DateTimePickerAndroid?.open({
      value: datePart,
      mode: 'time',
      display: 'default',
      is24Hour: locale === 'hr',
      onChange: (event, selectedTime) => {
        if (event.type !== 'set' || !selectedTime) {
          return;
        }

        const nextDate = new Date(datePart);
        nextDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
        onChangeISO(nextDate.toISOString());
      },
    });
  };

  const openAndroidDatePicker = () => {
    DateTimePickerAndroid?.open({
      value: currentDate,
      mode: 'date',
      display: 'default',
      onChange: (event, selectedDate) => {
        if (event.type !== 'set' || !selectedDate) {
          return;
        }

        const nextDate = new Date(currentDate);
        nextDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        openAndroidTimePicker(nextDate);
      },
    });
  };

  const onPickerChange = (_event: DateTimePickerEvent, nextDate?: Date) => {
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
          <View style={styles.fieldButtonWrap}>
            <AppButton
              title={hasValue ? formatEventDate(valueISO, locale) : t('pickDateTime')}
              variant="secondary"
              onPress={() => {
                if (Platform.OS === 'android') {
                  openAndroidDatePicker();
                  return;
                }

                setShowPicker((current) => !current);
              }}
              style={canClear ? styles.clearableButton : undefined}
            />
            {canClear ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={clearAccessibilityLabel ?? t('clearDateTime')}
                onPress={clearValue}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.clearButton,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>

          {showPicker && Platform.OS === 'ios' && NativeDateTimePicker ? (
            <AppCard variant="glass" style={{ marginTop: theme.tokens.spacing.sm }}>
              <NativeDateTimePicker value={currentDate} mode="datetime" display="spinner" onChange={onPickerChange} />
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
          <View style={styles.fieldButtonWrap}>
            <AppButton
              title={hasValue ? formatEventDate(valueISO, locale) : t('pickDateTime')}
              variant="secondary"
              onPress={() => setShowPicker((current) => !current)}
              style={canClear ? styles.clearableButton : undefined}
            />
            {canClear ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={clearAccessibilityLabel ?? t('clearDateTime')}
                onPress={clearValue}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.clearButton,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>
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

const styles = StyleSheet.create({
  fieldButtonWrap: {
    position: 'relative',
  },
  clearableButton: {
    paddingRight: 52,
  },
  clearButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    top: 9,
    width: 28,
  },
});
