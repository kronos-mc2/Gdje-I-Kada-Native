import type {
  LocationSearchProvider,
  LocationSearchRequest,
  LocationSearchResult,
  LocationSearchType,
} from '@/services/locationSearch/types';

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  category?: string;
  class?: string;
  type?: string;
  address?: Record<string, string | undefined>;
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

const firstValue = (address: Record<string, string | undefined> | undefined, keys: string[]) => {
  if (!address) {
    return undefined;
  }

  return keys.map((key) => address[key]?.trim()).find((value): value is string => Boolean(value));
};

const uniqueParts = (parts: Array<string | undefined>) =>
  parts.filter((part, index, values): part is string => Boolean(part) && values.indexOf(part) === index);

const isCityResult = (item: NominatimResult) => {
  if (firstValue(item.address, ['city', 'town', 'village', 'municipality'])) {
    return true;
  }

  return (
    (item.category ?? item.class) === 'place' &&
    Boolean(item.type && ['city', 'town', 'village', 'municipality'].includes(item.type))
  );
};

const isCountryResult = (item: NominatimResult) => {
  const category = item.category ?? item.class;
  return (category === 'boundary' && item.type === 'administrative') || item.type === 'country';
};

const matchesTypes = (item: NominatimResult, types?: LocationSearchType[]) => {
  if (!types?.length) {
    return true;
  }

  return (types.includes('city') && isCityResult(item)) || (types.includes('country') && isCountryResult(item));
};

const featureTypeForTypes = (types?: LocationSearchType[]) => {
  if (!types || types.length !== 1) {
    return undefined;
  }

  return types[0];
};

const composeCityDisplay = (item: NominatimResult) => {
  const title = firstValue(item.address, ['city', 'town', 'village', 'municipality']);
  if (!title) {
    return parseDisplayName(item.display_name);
  }

  return {
    title,
    subtitle: uniqueParts([
      firstValue(item.address, ['county', 'state_district']),
      firstValue(item.address, ['state']),
      firstValue(item.address, ['country']),
    ]).join(', '),
  };
};

const composeCountryDisplay = (item: NominatimResult) => {
  const title = firstValue(item.address, ['country']);
  if (!title) {
    return parseDisplayName(item.display_name);
  }

  return {
    title,
    subtitle: firstValue(item.address, ['country_code'])?.toUpperCase() ?? '',
  };
};

const composeDisplay = (item: NominatimResult, types?: LocationSearchType[]) => {
  if (types?.length === 1 && types[0] === 'city') {
    return composeCityDisplay(item);
  }
  if (types?.length === 1 && types[0] === 'country') {
    return composeCountryDisplay(item);
  }

  return composeAddressDisplay(item);
};

const composeAddressDisplay = (item: NominatimResult) => {
  const road = firstValue(item.address, ['road', 'pedestrian', 'footway', 'residential', 'path']);
  const houseNumber = firstValue(item.address, ['house_number']);
  const locality = firstValue(item.address, ['city', 'town', 'village', 'municipality', 'suburb', 'hamlet']);
  const county = firstValue(item.address, ['county', 'state_district']);
  const state = firstValue(item.address, ['state']);
  const postcode = firstValue(item.address, ['postcode']);
  const country = firstValue(item.address, ['country']);

  if (!road) {
    return parseDisplayName(item.display_name);
  }

  const title = houseNumber ? `${road} ${houseNumber}` : road;
  const subtitle = [locality, county, state, postcode, country]
    .filter((part, index, parts): part is string => Boolean(part) && parts.indexOf(part) === index)
    .join(', ');

  return {
    title,
    subtitle,
  };
};

export class NominatimLocationSearchProvider implements LocationSearchProvider {
  constructor(
    private readonly config: {
      baseUrl?: string;
      appId?: string;
    } = {},
  ) {}

  async search({
    query,
    locale,
    limit = 8,
    proximity,
    types,
    signal,
  }: LocationSearchRequest): Promise<LocationSearchResult[]> {
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

    const featureType = featureTypeForTypes(types);
    if (featureType) {
      params.set('featureType', featureType);
    }

    if (proximity && Number.isFinite(proximity.latitude) && Number.isFinite(proximity.longitude)) {
      const delta = 0.35;
      const minLng = Math.max(-180, proximity.longitude - delta);
      const minLat = Math.max(-90, proximity.latitude - delta);
      const maxLng = Math.min(180, proximity.longitude + delta);
      const maxLat = Math.min(90, proximity.latitude + delta);
      params.set('viewbox', `${minLng},${minLat},${maxLng},${maxLat}`);
      params.set('bounded', '0');
    }

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

    return payload.filter((item) => matchesTypes(item, types)).map((item) => {
      const display = composeDisplay(item, types);

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
