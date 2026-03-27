import { Coordinates, Locale } from '@/core/types/domain';

export type LocationSearchResult = {
  id: string;
  title: string;
  subtitle: string;
  coordinates: Coordinates;
  provider: 'nominatim' | 'mapbox';
};

export type LocationSearchRequest = {
  query: string;
  locale: Locale;
  limit?: number;
  proximity?: Coordinates;
  signal?: AbortSignal;
};

export interface LocationSearchProvider {
  search(request: LocationSearchRequest): Promise<LocationSearchResult[]>;
}
