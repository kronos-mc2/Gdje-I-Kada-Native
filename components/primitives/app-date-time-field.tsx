import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import JsDateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker';

import { AppButton } from '@/components/primitives/app-button';
import { AppCard } from '@/components/primitives/app-card';
import { AppText } from '@/components/primitives/app-text';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { Locale } from '@/core/types/domain';
import { formatEventDate } from '@/core/utils/date';

type AppDateTimeFieldProps = Readonly<{
  label: string;
  locale: Locale;
  valueISO: string;
  onChangeISO: (nextISO: string) => void;
  onClear?: () => void;
  clearAccessibilityLabel?: string;
}>;

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
  const defaultCalendarStyles = useDefaultStyles(theme.isDark ? 'dark' : 'light');
  const bodyFontFamily = theme.tokens.typography.body.fontFamily;
  const captionFontFamily = theme.tokens.typography.caption.fontFamily;
  const labelFontFamily = theme.tokens.typography.label.fontFamily;
  const [showPicker, setShowPicker] = useState(false);

  const currentDate = useMemo(() => toValidDate(valueISO), [valueISO]);
  const hasValue = !Number.isNaN(new Date(valueISO).getTime());
  const canClear = hasValue && typeof onClear === 'function';
  const calendarStyles = useMemo(
    () => ({
      ...defaultCalendarStyles,
      month_selector_label: { ...defaultCalendarStyles.month_selector_label, fontFamily: labelFontFamily },
      year_selector_label: { ...defaultCalendarStyles.year_selector_label, fontFamily: labelFontFamily },
      month_label: { ...defaultCalendarStyles.month_label, fontFamily: bodyFontFamily },
      year_label: { ...defaultCalendarStyles.year_label, fontFamily: bodyFontFamily },
      time_selector_label: { ...defaultCalendarStyles.time_selector_label, fontFamily: labelFontFamily },
      time_label: { ...defaultCalendarStyles.time_label, fontFamily: labelFontFamily },
      weekday_label: { ...defaultCalendarStyles.weekday_label, fontFamily: captionFontFamily },
      day_label: { ...defaultCalendarStyles.day_label, fontFamily: bodyFontFamily },
      outside_label: { ...defaultCalendarStyles.outside_label, fontFamily: bodyFontFamily },
      today_label: { ...defaultCalendarStyles.today_label, fontFamily: labelFontFamily },
      selected_label: { ...defaultCalendarStyles.selected_label, fontFamily: labelFontFamily },
      range_start_label: { ...defaultCalendarStyles.range_start_label, fontFamily: labelFontFamily },
      range_end_label: { ...defaultCalendarStyles.range_end_label, fontFamily: labelFontFamily },
      range_middle_label: { ...defaultCalendarStyles.range_middle_label, fontFamily: labelFontFamily },
    }),
    [bodyFontFamily, captionFontFamily, defaultCalendarStyles, labelFontFamily],
  );

  const clearValue = () => {
    setShowPicker(false);
    onClear?.();
  };

  return (
    <View style={{ marginBottom: theme.tokens.spacing.md }}>
      <AppText variant="label" color="textMuted" style={{ marginBottom: theme.tokens.spacing.xs }}>
        {label}
      </AppText>

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
            styles={calendarStyles}
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
