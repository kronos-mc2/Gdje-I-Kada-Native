import { LocationSearchProvider, LocationSearchRequest, LocationSearchResult } from '@/services/locationSearch/types';

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

const DEFAULT_BASE_URL = 'https://nominatim.openstreetmap.org';
const MIN_QUERY_LENGTH = 2;

const parseDisplayName = (value: string) => {
  const parts = value.split(',').map((part) => part.trim());
  const [title = value, ...rest] = parts;

  return {
    title,
    subtitle: rest.join(', '),
  };
};

export class NominatimLocationSearchProvider implements LocationSearchProvider {
  constructor(
    private readonly config: {
      baseUrl?: string;
      appId?: string;
    } = {},
  ) {}

  async search({ query, locale, limit = 8, signal }: LocationSearchRequest): Promise<LocationSearchResult[]> {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < MIN_QUERY_LENGTH) {
      return [];
    }

    const params = new URLSearchParams({
      q: normalizedQuery,
      format: 'jsonv2',
      addressdetails: '1',
      dedupe: '1',
      limit: String(limit),
      'accept-language': locale,
    });

    const endpoint = `${this.config.baseUrl ?? DEFAULT_BASE_URL}/search?${params.toString()}`;
    const response = await fetch(endpoint, {
      method: 'GET',
      signal,
      headers: {
        Accept: 'application/json',
        'X-App-Id': this.config.appId ?? 'gdjeikada-native',
      },
    });

    if (!response.ok) {
      throw new Error(`Location search failed (${response.status})`);
    }

    const payload = (await response.json()) as NominatimResult[];

    return payload.map((item) => {
      const display = parseDisplayName(item.display_name);

      return {
        id: String(item.place_id),
        title: display.title,
        subtitle: display.subtitle,
        coordinates: {
          latitude: Number(item.lat),
          longitude: Number(item.lon),
        },
        provider: 'nominatim',
      };
    });
  }
}
