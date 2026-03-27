import { LocationSearchProvider, LocationSearchRequest, LocationSearchResult } from '@/services/locationSearch/types';

const CACHE_TTL_MS = 1000 * 60 * 5;
const MAX_CACHE_ENTRIES = 40;

type CacheEntry = {
  timestampMs: number;
  results: LocationSearchResult[];
};

const toCacheKey = (request: LocationSearchRequest) => {
  const normalizedQuery = request.query.trim().toLowerCase();
  const limit = request.limit ?? 8;
  const proximity =
    request.proximity && Number.isFinite(request.proximity.latitude) && Number.isFinite(request.proximity.longitude)
      ? `${request.proximity.latitude.toFixed(3)}:${request.proximity.longitude.toFixed(3)}`
      : 'none';

  return `${request.locale}:${limit}:${proximity}:${normalizedQuery}`;
};

export class LocationSearchService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly provider: LocationSearchProvider) {}

  async search(request: LocationSearchRequest): Promise<LocationSearchResult[]> {
    const key = toCacheKey(request);
    const nowMs = Date.now();
    const cached = this.cache.get(key);

    if (cached && nowMs - cached.timestampMs < CACHE_TTL_MS) {
      return cached.results;
    }

    const results = await this.provider.search(request);
    this.cache.set(key, {
      timestampMs: nowMs,
      results,
    });
    this.pruneCache();

    return results;
  }

  private pruneCache() {
    if (this.cache.size <= MAX_CACHE_ENTRIES) {
      return;
    }

    const staleEntries = [...this.cache.entries()].sort((a, b) => a[1].timestampMs - b[1].timestampMs);
    const deleteCount = this.cache.size - MAX_CACHE_ENTRIES;

    for (let index = 0; index < deleteCount; index += 1) {
      const key = staleEntries[index]?.[0];
      if (key) {
        this.cache.delete(key);
      }
    }
  }
}
