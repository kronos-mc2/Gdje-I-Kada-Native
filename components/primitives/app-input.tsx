import { StyleProp, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

import { AppText } from '@/components/primitives/app-text';
import { useAppTheme } from '@/core/theme';

type AppInputProps = TextInputProps & {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function AppInput({ label, style, containerStyle, ...props }: AppInputProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[{ marginBottom: theme.tokens.spacing.md }, containerStyle]}>
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
            fontFamily: theme.tokens.typography.body.fontFamily,
            paddingHorizontal: theme.tokens.spacing.md,
            paddingVertical: theme.tokens.spacing.sm,
          },
          style,
        ]}
      />
    </View>
  );
}
