import { AppEvent } from '@/core/types/domain';
import { selectEvents } from '@/core/events/select-events';

const buildEvent = (overrides: Partial<AppEvent>): AppEvent => ({
  id: 'evt_default',
  title: {
    hr: 'Default naslov',
    en: 'Default title',
  },
  where: {
    hr: 'Zagreb',
    en: 'Zagreb',
  },
  address: 'Ilica 1',
  about: {
    hr: 'Opis',
    en: 'Description',
  },
  whenISO: '2026-04-24T18:00:00Z',
  startAt: '2026-04-24T18:00:00Z',
  type: 'nearby',
  coordinates: {
    latitude: 45.815,
    longitude: 15.9819,
  },
  likeCount: 0,
  participantCount: 0,
  ...overrides,
});

describe('selectEvents', () => {
  it('returns only joined events when joined filter is selected', () => {
    const joined = buildEvent({
      id: 'evt_joined',
      type: 'nearby',
      joinedByMe: true,
    });
    const created = buildEvent({
      id: 'evt_created',
      type: 'created',
      joinedByMe: false,
    });

    const result = selectEvents({
      allEvents: [joined, created],
      filter: 'joined',
      searchQuery: '',
      locale: 'hr',
    });

    expect(result).toEqual([joined]);
  });

  it('matches localized title and location using a trimmed case-insensitive query', () => {
    const zagreb = buildEvent({
      id: 'evt_zagreb',
      title: {
        hr: 'Brunch na krovu',
        en: 'Rooftop brunch',
      },
      where: {
        hr: 'Donji grad',
        en: 'Lower Town',
      },
      type: 'nearby',
    });
    const split = buildEvent({
      id: 'evt_split',
      title: {
        hr: 'Koncert uz more',
        en: 'Seaside concert',
      },
      where: {
        hr: 'Split',
        en: 'Split',
      },
      type: 'nearby',
    });

    const result = selectEvents({
      allEvents: [zagreb, split],
      filter: 'nearby',
      searchQuery: '  LOWER  ',
      locale: 'en',
    });

    expect(result).toEqual([zagreb]);
  });
});
