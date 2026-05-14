import { apiClient } from '@/core/api/http-client';
import { LocationSearchProvider, LocationSearchRequest, LocationSearchResult } from '@/services/locationSearch/types';

export class BackendLocationSearchProvider implements LocationSearchProvider {
  constructor(private readonly fallbackProvider?: LocationSearchProvider) {}

  async search({ query, locale, limit = 6, proximity, signal }: LocationSearchRequest): Promise<LocationSearchResult[]> {
    try {
      const response = await apiClient.get<LocationSearchResult[]>('/locations/search', {
        signal,
        params: {
          query: query.trim(),
          locale,
          limit,
          lat: proximity?.latitude,
          lng: proximity?.longitude,
        },
      });

      if (response.data.length > 0 || !this.fallbackProvider) {
        return response.data;
      }
    } catch (error) {
      if (signal?.aborted || !this.fallbackProvider) {
        throw error;
      }
    }

    return this.fallbackProvider.search({
      query,
      locale,
      limit,
      proximity,
      signal,
    });
  }
}
