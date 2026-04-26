import { NominatimLocationSearchProvider } from '@/services/locationSearch/providers/nominatim-location-search-provider';

describe('NominatimLocationSearchProvider', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns an empty result set for queries shorter than two characters', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const provider = new NominatimLocationSearchProvider();

    await expect(provider.search({ query: 'z', locale: 'hr' })).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('maps the Nominatim payload into app search results', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            place_id: 123,
            display_name: 'Zagreb, Grad Zagreb, Hrvatska',
            lat: '45.8150',
            lon: '15.9819',
          },
        ]),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );
    const provider = new NominatimLocationSearchProvider({
      baseUrl: 'https://example.test',
      appId: 'gik-tests',
    });

    const results = await provider.search({
      query: 'Zagreb',
      locale: 'hr',
      limit: 1,
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.test/search?q=Zagreb&format=jsonv2&addressdetails=1&dedupe=1&limit=1&accept-language=hr',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
          'X-App-Id': 'gik-tests',
        }),
      }),
    );
    expect(results).toEqual([
      {
        id: '123',
        title: 'Zagreb',
        subtitle: 'Grad Zagreb, Hrvatska',
        coordinates: {
          latitude: 45.815,
          longitude: 15.9819,
        },
        provider: 'nominatim',
      },
    ]);
  });

  it('throws when the upstream API responds with a non-2xx status', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, {
        status: 503,
      }),
    );
    const provider = new NominatimLocationSearchProvider();

    await expect(provider.search({ query: 'zagreb', locale: 'hr' })).rejects.toThrow(
      'Location search failed (503)',
    );
  });
});
