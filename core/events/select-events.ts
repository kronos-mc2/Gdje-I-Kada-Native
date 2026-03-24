import { AppEvent, EventFilter, Locale } from '@/core/types/domain';

type SelectionInput = {
  allEvents: AppEvent[];
  filter: EventFilter;
  searchQuery: string;
  locale: Locale;
  joinedEventIds: string[];
};

export const selectEvents = ({ allEvents, filter, searchQuery, locale, joinedEventIds }: SelectionInput) => {
  const loweredQuery = searchQuery.trim().toLowerCase();

  const filteredByType = allEvents.filter((event) => {
    if (filter === 'joined') {
      return joinedEventIds.includes(event.id);
    }

    return event.type === filter;
  });

  if (!loweredQuery) {
    return filteredByType;
  }

  return filteredByType.filter((event) => {
    const title = event.title[locale].toLowerCase();
    const location = event.where[locale].toLowerCase();

    return title.includes(loweredQuery) || location.includes(loweredQuery);
  });
};
