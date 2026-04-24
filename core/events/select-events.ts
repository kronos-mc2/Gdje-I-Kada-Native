import { AppEvent, EventFilter, Locale } from '@/core/types/domain';

type SelectionInput = {
  allEvents: AppEvent[];
  filter: EventFilter;
  searchQuery: string;
  locale: Locale;
};

export const selectEvents = ({ allEvents, filter, searchQuery, locale }: SelectionInput) => {
  const loweredQuery = searchQuery.trim().toLowerCase();

  const filteredByType = allEvents.filter((event) => {
    if (filter === 'joined') {
      return event.joinedByMe === true;
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
