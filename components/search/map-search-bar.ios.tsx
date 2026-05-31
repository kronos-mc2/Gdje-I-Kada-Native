import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useAppTheme } from '@/core/theme';

type MapSearchBarProps = Readonly<{
  value: string;
  placeholder: string;
  loading?: boolean;
  onChangeText: (value: string) => void;
  onClear: () => void;
  onFilterPress?: () => void;
  onFocus: () => void;
  onBlur: () => void;
  filterActive?: boolean;
  filterAccessibilityLabel?: string;
  clearAccessibilityLabel?: string;
}>;

export function MapSearchBar({
  value,
  placeholder,
  loading,
  onChangeText,
  onClear,
  onFilterPress,
  onFocus,
  onBlur,
  filterActive,
  filterAccessibilityLabel = 'Filter events',
  clearAccessibilityLabel = 'Clear search',
}: MapSearchBarProps) {
  const { theme } = useAppTheme();
  const canUseLiquidGlass = useMemo(() => isLiquidGlassAvailable() && isGlassEffectAPIAvailable(), []);
  const showClearButton = !loading && Boolean(value);

  return (
    <View style={styles.wrapper}>
      {canUseLiquidGlass ? (
        <GlassView
          style={StyleSheet.absoluteFill}
          glassEffectStyle="regular"
          colorScheme={theme.isDark ? 'dark' : 'light'}
          tintColor={theme.isDark ? 'rgba(14, 18, 26, 0.10)' : 'rgba(255, 255, 255, 0.12)'}
          isInteractive
        />
      ) : (
        <>
          <BlurView
            style={StyleSheet.absoluteFill}
            tint={theme.isDark ? 'systemThinMaterialDark' : 'systemThinMaterialLight'}
            intensity={62}
          />
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: theme.isDark ? 'rgba(15, 20, 30, 0.14)' : 'rgba(255, 255, 255, 0.16)' },
            ]}
          />
        </>
      )}

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
        ) : null}
        {showClearButton ? (
          <Pressable
            onPress={onClear}
            style={({ pressed }) => [
              styles.clearButton,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.isDark ? 'rgba(17, 22, 30, 0.45)' : 'rgba(255, 255, 255, 0.54)',
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={clearAccessibilityLabel}
          >
            <Ionicons name="close" size={14} color={theme.colors.textSecondary} />
          </Pressable>
        ) : null}
        {onFilterPress ? (
          <Pressable
            onPress={onFilterPress}
            style={({ pressed }) => [
              styles.filterButton,
              {
                borderColor: filterActive ? theme.colors.mapAccent : theme.colors.border,
                backgroundColor: filterActive ? theme.colors.mapAccent : theme.isDark ? 'rgba(17, 22, 30, 0.45)' : 'rgba(255, 255, 255, 0.54)',
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={filterAccessibilityLabel}
            accessibilityState={{ selected: Boolean(filterActive) }}
          >
            <Ionicons name="options-outline" size={18} color={filterActive ? '#FFFFFF' : theme.colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderRadius: 26,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
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
  filterButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
