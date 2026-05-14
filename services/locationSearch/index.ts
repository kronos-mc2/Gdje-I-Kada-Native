import { LocationSearchService } from '@/services/locationSearch/location-search-service';
import { BackendLocationSearchProvider } from '@/services/locationSearch/providers/backend-location-search-provider';
import { NominatimLocationSearchProvider } from '@/services/locationSearch/providers/nominatim-location-search-provider';

export { LocationSearchService } from '@/services/locationSearch/location-search-service';
export type {
  LocationSearchProvider,
  LocationSearchRequest,
  LocationSearchResult,
} from '@/services/locationSearch/types';

const directNominatimProvider = new NominatimLocationSearchProvider({
  baseUrl: process.env.EXPO_PUBLIC_LOCATION_SEARCH_BASE_URL,
  appId: process.env.EXPO_PUBLIC_LOCATION_SEARCH_APP_ID,
});

export const locationSearchService = new LocationSearchService(new BackendLocationSearchProvider(directNominatimProvider));
