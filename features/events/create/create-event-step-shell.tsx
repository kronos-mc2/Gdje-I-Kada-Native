import { PropsWithChildren } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard, AppIconButton, AppText } from '@/components/primitives';
import { useAppTheme } from '@/core/theme';
import { CREATE_EVENT_STEPS, CreateEventStep } from '@/features/events/create/create-event-form';

type CreateEventStepShellProps = PropsWithChildren<{
  step: CreateEventStep;
  eyebrow: string;
  title: string;
  subtitle: string;
  backLabel: string;
  onClose: () => void;
}>;

export function CreateEventStepShell({ step, eyebrow, title, subtitle, backLabel, onClose, children }: CreateEventStepShellProps) {
  const { theme } = useAppTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const activeIndex = CREATE_EVENT_STEPS.indexOf(step);
  const minScreenHeight = Math.max(620, height - insets.top - insets.bottom - 48);

  return (
    <View style={[styles.screen, { minHeight: minScreenHeight }]}>
      <View style={styles.topBar}>
        <AppIconButton icon="chevron-back" variant="glass" accessibilityLabel={backLabel} onPress={onClose} />
      </View>

      <AppCard variant="glass" style={[styles.panel, { borderColor: theme.colors.border }]}>
        <View style={styles.progressRow}>
          {CREATE_EVENT_STEPS.map((item, index) => (
            <View
              key={item}
              style={[
                styles.progressItem,
                {
                  backgroundColor: index <= activeIndex ? theme.colors.accent : theme.colors.border,
                  opacity: index === activeIndex ? 1 : 0.55,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.copy}>
          <AppText variant="label" color="textMuted">
            {eyebrow}
          </AppText>
          <AppText variant="headline">{title}</AppText>
          <AppText variant="body" color="textSecondary">
            {subtitle}
          </AppText>
        </View>

        <View style={styles.content}>{children}</View>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 12,
    paddingBottom: 24,
  },
  topBar: {
    alignItems: 'flex-start',
  },
  panel: {
    flex: 1,
    gap: 28,
    padding: 20,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
  },
  progressItem: {
    borderRadius: 999,
    flex: 1,
    height: 5,
  },
  copy: {
    gap: 8,
  },
  content: {
    flex: 1,
    gap: 16,
  },
});
