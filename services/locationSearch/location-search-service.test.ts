import { LocationSearchService } from '@/services/locationSearch/location-search-service';
import { LocationSearchRequest, LocationSearchResult } from '@/services/locationSearch/types';

const request: LocationSearchRequest = {
  query: '  Zagreb  ',
  locale: 'hr',
  limit: 5,
  proximity: {
    latitude: 45.815399,
    longitude: 15.981901,
  },
};

const results: LocationSearchResult[] = [
  {
    id: 'place_1',
    title: 'Zagreb',
    subtitle: 'Croatia',
    coordinates: {
      latitude: 45.815,
      longitude: 15.9819,
    },
    provider: 'nominatim',
  },
];

describe('LocationSearchService', () => {
  it('reuses cached results for equivalent requests within the TTL window', async () => {
    let nowMs = 1_000;
    const provider = {
      search: jest.fn().mockResolvedValue(results),
    };
    jest.spyOn(Date, 'now').mockImplementation(() => nowMs);

    const service = new LocationSearchService(provider);

    const first = await service.search(request);
    nowMs += 1_000;
    const second = await service.search({
      ...request,
      query: 'zagreb',
      proximity: {
        latitude: 45.815401,
        longitude: 15.981899,
      },
    });

    expect(first).toBe(results);
    expect(second).toBe(results);
    expect(provider.search).toHaveBeenCalledTimes(1);
  });

  it('refreshes the cache after the TTL expires', async () => {
    let nowMs = 1_000;
    const provider = {
      search: jest
        .fn()
        .mockResolvedValueOnce(results)
        .mockResolvedValueOnce([
          {
            ...results[0],
            id: 'place_2',
          },
        ]),
    };
    jest.spyOn(Date, 'now').mockImplementation(() => nowMs);

    const service = new LocationSearchService(provider);

    await service.search(request);
    nowMs += 1000 * 60 * 5 + 1;
    const refreshed = await service.search(request);

    expect(provider.search).toHaveBeenCalledTimes(2);
    expect(refreshed[0]?.id).toBe('place_2');
  });
});
