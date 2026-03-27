import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/core/api/query-keys';
import { Locale } from '@/core/types/domain';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { locationSearchService } from '@/services/locationSearch';

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 320;
const SEARCH_RESULT_LIMIT = 6;

export function useLocationSearch(query: string, locale: Locale) {
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const isSearchEnabled = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const locationSearchQuery = useQuery({
    queryKey: queryKeys.locationSearch(debouncedQuery, locale),
    enabled: isSearchEnabled,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      locationSearchService.search({
        query: debouncedQuery,
        locale,
        limit: SEARCH_RESULT_LIMIT,
        signal,
      }),
  });

  return {
    ...locationSearchQuery,
    debouncedQuery,
    isSearchEnabled,
  };
}
