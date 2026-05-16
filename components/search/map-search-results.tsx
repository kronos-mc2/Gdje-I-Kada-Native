import { Pressable, StyleSheet, View } from 'react-native';

import { AppCard, AppText } from '@/components/primitives';
import { useAppTheme } from '@/core/theme';

export type MapSearchResultItem = {
  id: string;
  title: string;
  subtitle: string;
};

type MapSearchResultsProps<T extends MapSearchResultItem> = Readonly<{
  visible: boolean;
  loading: boolean;
  query: string;
  results: T[];
  searchingLabel: string;
  noResultsLabel: string;
  hintLabel: string;
  providerLabel?: string;
  onSelectResult: (result: T) => void;
}>;

export function MapSearchResults<T extends MapSearchResultItem>({
  visible,
  loading,
  query,
  results,
  searchingLabel,
  noResultsLabel,
  hintLabel,
  providerLabel,
  onSelectResult,
}: MapSearchResultsProps<T>) {
  const { theme } = useAppTheme();
  const trimmedQuery = query.trim();

  if (!visible) {
    return null;
  }

  return (
    <AppCard variant="glass" style={styles.container}>
      {loading ? (
        <AppText variant="caption" color="textMuted">
          {searchingLabel}
        </AppText>
      ) : null}

      {!loading && trimmedQuery.length < 2 ? (
        <AppText variant="caption" color="textMuted">
          {hintLabel}
        </AppText>
      ) : null}

      {!loading && trimmedQuery.length >= 2 && results.length === 0 ? (
        <AppText variant="caption" color="textMuted">
          {noResultsLabel}
        </AppText>
      ) : null}

      {!loading && results.length > 0 ? (
        <View>
          {results.map((result) => (
            <Pressable
              key={result.id}
              onPress={() => onSelectResult(result)}
              style={({ pressed }) => [
                styles.row,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  opacity: pressed ? 0.84 : 1,
                },
              ]}
            >
              <AppText variant="bodyStrong" numberOfLines={1}>
                {result.title}
              </AppText>
              <AppText variant="caption" color="textMuted" numberOfLines={1}>
                {result.subtitle}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}

      {providerLabel ? (
        <AppText variant="caption" color="textMuted" style={styles.provider}>
          {providerLabel}
        </AppText>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    maxHeight: 280,
    borderRadius: 16,
    paddingBottom: 10,
  },
  row: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 8,
  },
  provider: {
    marginTop: 4,
  },
});
