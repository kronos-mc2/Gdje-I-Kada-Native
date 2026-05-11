import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives';
import { useAppTheme } from '@/core/theme';

type Option<T extends string> = {
  label: string;
  value: T;
};

type CreateEventSegmentedControlProps<T extends string> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function CreateEventSegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: CreateEventSegmentedControlProps<T>) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.wrap}>
      <AppText variant="label" color="textMuted" style={styles.label}>
        {label}
      </AppText>
      <View style={[styles.track, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[
                styles.option,
                {
                  backgroundColor: selected ? theme.colors.accent : 'transparent',
                  borderColor: selected ? theme.colors.accent : theme.colors.border,
                },
              ]}
            >
              <AppText variant="label" style={{ color: selected ? theme.colors.background : theme.colors.textSecondary }}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    paddingHorizontal: 2,
  },
  track: {
    borderWidth: 1,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 8,
    padding: 6,
  },
  option: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
});
