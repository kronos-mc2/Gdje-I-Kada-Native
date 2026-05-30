import { Coordinates, FeedQueryParams, FypFeedFilter } from '@/core/types/domain';

export const FYP_PRESET_KEYS = ['forYou', 'tonight', 'weekend', 'trending', 'friends'] as const;

export function createFypFeedParams(
  filter: FypFeedFilter,
  userLocation: Coordinates,
  nearbyRadiusKm: number,
): Omit<FeedQueryParams, 'cursor' | 'limit' | 'seed'> {
  const params: Omit<FeedQueryParams, 'cursor' | 'limit' | 'seed'> = {
    ...getPresetParams(filter.preset),
    ...getLocationParams(filter, userLocation, nearbyRadiusKm),
  };

  if (filter.attendanceModes.length > 0) {
    params.attendanceModes = filter.attendanceModes.join(',');
  }

  return pruneEmptyParams(params);
}

function getPresetParams(preset: FypFeedFilter['preset']): Omit<FeedQueryParams, 'cursor' | 'limit' | 'seed'> {
  if (preset === 'tonight') {
    const now = new Date();
    const tomorrowMorning = new Date(now);
    tomorrowMorning.setDate(now.getDate() + 1);
    tomorrowMorning.setHours(6, 0, 0, 0);
    return {
      from: now.toISOString(),
      to: tomorrowMorning.toISOString(),
    };
  }

  if (preset === 'weekend') {
    const now = new Date();
    const start = new Date(now);
    const day = start.getDay();
    const daysUntilSaturday = day === 0 ? -1 : (6 - day + 7) % 7;
    start.setDate(start.getDate() + daysUntilSaturday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    end.setHours(23, 59, 59, 999);

    return {
      from: start < now ? now.toISOString() : start.toISOString(),
      to: end.toISOString(),
    };
  }

  if (preset === 'trending') {
    return { sort: 'trending' };
  }

  if (preset === 'friends') {
    return { scope: 'friends' };
  }

  return {};
}

function getLocationParams(
  filter: FypFeedFilter,
  userLocation: Coordinates,
  nearbyRadiusKm: number,
): Omit<FeedQueryParams, 'cursor' | 'limit' | 'seed'> {
  if (filter.locationMode === 'city') {
    return filter.cityPlaceId ? { query: filter.city.trim() } : getCurrentLocationParams(userLocation, nearbyRadiusKm);
  }

  if (filter.locationMode === 'country') {
    return filter.countryPlaceId ? { query: filter.country.trim() } : getCurrentLocationParams(userLocation, nearbyRadiusKm);
  }

  return getCurrentLocationParams(userLocation, nearbyRadiusKm);
}

function getCurrentLocationParams(
  userLocation: Coordinates,
  nearbyRadiusKm: number,
): Omit<FeedQueryParams, 'cursor' | 'limit' | 'seed'> {
  return {
    lat: userLocation.latitude,
    lng: userLocation.longitude,
    radiusKm: nearbyRadiusKm,
  };
}

function pruneEmptyParams(params: Omit<FeedQueryParams, 'cursor' | 'limit' | 'seed'>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Omit<FeedQueryParams, 'cursor' | 'limit' | 'seed'>;
}
