import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/core/api/query-keys';
import { Coordinates, Locale } from '@/core/types/domain';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { locationSearchService } from '@/services/locationSearch';
import type { LocationSearchType } from '@/services/locationSearch/types';

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 320;
const SEARCH_RESULT_LIMIT = 6;

export function useLocationSearch(
  query: string,
  locale: Locale,
  proximity?: Coordinates | undefined,
  types?: LocationSearchType[],
) {
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const isSearchEnabled = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const locationSearchQuery = useQuery({
    queryKey: queryKeys.locationSearch(debouncedQuery, locale, proximity, types),
    enabled: isSearchEnabled,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      locationSearchService.search({
        query: debouncedQuery,
        locale,
        limit: SEARCH_RESULT_LIMIT,
        proximity,
        types,
        signal,
      }),
  });

  return {
    ...locationSearchQuery,
    debouncedQuery,
    isSearchEnabled,
  };
}
