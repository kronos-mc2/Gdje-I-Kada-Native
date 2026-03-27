import { LocationSearchService } from '@/services/locationSearch/location-search-service';
import { NominatimLocationSearchProvider } from '@/services/locationSearch/providers/nominatim-location-search-provider';

export { LocationSearchService } from '@/services/locationSearch/location-search-service';
export type {
  LocationSearchProvider,
  LocationSearchRequest,
  LocationSearchResult,
} from '@/services/locationSearch/types';

export const locationSearchService = new LocationSearchService(
  new NominatimLocationSearchProvider({
    baseUrl: process.env.EXPO_PUBLIC_LOCATION_SEARCH_BASE_URL,
    appId: process.env.EXPO_PUBLIC_LOCATION_SEARCH_APP_ID,
  }),
);
