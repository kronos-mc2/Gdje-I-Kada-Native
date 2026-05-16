import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives/app-text';
import { useAppTheme } from '@/core/theme';
import { ThemePreference } from '@/core/theme/types';
import { useI18n } from '@/core/i18n/use-i18n';

const OPTIONS: ThemePreference[] = ['system', 'dark', 'light'];

type ThemeToggleProps = Readonly<{
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
}>;

export function ThemeToggle({ value, onChange }: ThemeToggleProps) {
  const { theme } = useAppTheme();
  const { t } = useI18n();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.tokens.radius.md,
        },
      ]}
    >
      {OPTIONS.map((option) => {
        const selected = option === value;

        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={({ pressed }) => [
              styles.option,
              {
                borderRadius: theme.tokens.radius.sm,
                backgroundColor: selected ? theme.colors.surfaceElevated : 'transparent',
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <AppText variant="label" style={{ color: selected ? theme.colors.textPrimary : theme.colors.textSecondary }}>
              {getThemeLabel(option, t)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
});

function getThemeLabel(option: ThemePreference, t: ReturnType<typeof useI18n>['t']) {
  if (option === 'system') {
    return t('themeSystem');
  }
  if (option === 'dark') {
    return t('themeDark');
  }
  return t('themeLight');
}
