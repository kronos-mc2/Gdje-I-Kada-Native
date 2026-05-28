import { useMemo } from 'react';

import { AppEvent, Locale } from '@/core/types/domain';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 260;
const SEARCH_RESULT_LIMIT = 8;

export type EventMapSearchResult = {
  id: string;
  eventId: string;
  title: string;
  subtitle: string;
  score: number;
};

type UseEventMapSearchInput = {
  events: AppEvent[];
  query: string;
  locale: Locale;
};

const normalize = (value: string) => value.trim().toLowerCase();

const getSearchScore = (title: string, location: string, address: string, tags: string[], query: string) => {
  if (title === query) {
    return 0;
  }

  if (title.startsWith(query)) {
    return 1;
  }

  if (location.startsWith(query)) {
    return 2;
  }

  if (address.startsWith(query)) {
    return 3;
  }

  if (tags.some((tag) => tag.startsWith(query))) {
    return 4;
  }

  if (title.includes(query)) {
    return 5;
  }

  if (location.includes(query)) {
    return 6;
  }

  if (address.includes(query)) {
    return 7;
  }

  if (tags.some((tag) => tag.includes(query))) {
    return 8;
  }

  return Number.POSITIVE_INFINITY;
};

export function useEventMapSearch({ events, query, locale }: UseEventMapSearchInput) {
  const trimmedQuery = query.trim();
  const debouncedQuery = useDebouncedValue(trimmedQuery, SEARCH_DEBOUNCE_MS);
  const normalizedQuery = normalize(debouncedQuery);
  const isSearchEnabled = normalizedQuery.length >= MIN_QUERY_LENGTH;

  const results = useMemo(() => {
    if (!isSearchEnabled) {
      return [] as EventMapSearchResult[];
    }

    return events
      .map((event) => {
        const localizedTitle = event.title[locale];
        const localizedLocation = event.where[locale];
        const title = normalize(localizedTitle);
        const location = normalize(localizedLocation);
        const address = normalize(event.address ?? '');
        const tags = (event.tags ?? []).map(normalize);
        const score = getSearchScore(title, location, address, tags, normalizedQuery);

        if (!Number.isFinite(score)) {
          return null;
        }

        return {
          id: event.id,
          eventId: event.id,
          title: localizedTitle,
          subtitle: getSubtitle(localizedLocation, event.address, event.tags ?? [], normalizedQuery),
          score,
        };
      })
      .filter((result): result is EventMapSearchResult => Boolean(result))
      .sort((left, right) => {
        if (left.score !== right.score) {
          return left.score - right.score;
        }

        return left.title.localeCompare(right.title);
      })
      .slice(0, SEARCH_RESULT_LIMIT);
  }, [events, isSearchEnabled, locale, normalizedQuery]);

  return {
    results,
    isSearching: trimmedQuery.length >= MIN_QUERY_LENGTH && trimmedQuery !== debouncedQuery,
    isSearchEnabled,
  };
}

function getSubtitle(location: string, address: string | undefined, tags: string[], normalizedQuery: string) {
  const matchingTag = tags.find((tag) => normalize(tag).includes(normalizedQuery));
  if (matchingTag) {
    return matchingTag;
  }

  if (address && normalize(address).includes(normalizedQuery)) {
    return address;
  }

  return location;
}
