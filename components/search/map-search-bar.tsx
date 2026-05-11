import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useAppTheme } from '@/core/theme';

type MapSearchBarProps = {
  value: string;
  placeholder: string;
  loading?: boolean;
  onChangeText: (value: string) => void;
  onClear: () => void;
  onFocus: () => void;
  onBlur: () => void;
};

export function MapSearchBar({ value, placeholder, loading, onChangeText, onClear, onFocus, onBlur }: MapSearchBarProps) {
  const { theme } = useAppTheme();
  const isAndroid = Platform.OS === 'android';
  const wrapperBackground = theme.colors.surface;

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: wrapperBackground,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.background,
          shadowOpacity: isAndroid ? 0.22 : 0.14,
          shadowRadius: isAndroid ? 12 : 8,
          shadowOffset: { width: 0, height: isAndroid ? 6 : 4 },
          elevation: isAndroid ? 10 : 6,
        },
      ]}
    >
      <View style={styles.row}>
        <Ionicons name="search" size={18} color={theme.colors.textMuted} />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, { color: theme.colors.textPrimary, fontFamily: theme.tokens.typography.body.fontFamily }]}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.mapAccent} />
        ) : value ? (
          <Pressable
            onPress={onClear}
            style={({ pressed }) => [
              styles.clearButton,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceElevated,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close" size={14} color={theme.colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
