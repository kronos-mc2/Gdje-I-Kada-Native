import { TextInput, TextInputProps, View } from 'react-native';

import { AppText } from '@/components/primitives/app-text';
import { useAppTheme } from '@/core/theme';

type AppInputProps = TextInputProps & {
  label?: string;
};

export function AppInput({ label, style, ...props }: AppInputProps) {
  const { theme } = useAppTheme();

  return (
    <View style={{ marginBottom: theme.tokens.spacing.md }}>
      {label ? (
        <AppText variant="label" color="textMuted" style={{ marginBottom: theme.tokens.spacing.xs }}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        {...props}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          {
            minHeight: 46,
            borderWidth: 1,
            borderRadius: theme.tokens.radius.md,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            color: theme.colors.textPrimary,
            paddingHorizontal: theme.tokens.spacing.md,
            paddingVertical: theme.tokens.spacing.sm,
          },
          style,
        ]}
      />
    </View>
  );
}
