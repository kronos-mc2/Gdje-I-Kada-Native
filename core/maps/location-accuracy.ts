import { Coordinates } from '@/core/types/domain';

const EARTH_RADIUS_METERS = 6378137;
const MIN_ACCURACY_RADIUS_METERS = 12;
const MAX_ACCURACY_RADIUS_METERS = 1000;

export function getLocationAccuracyRadiusMeters(coordinates: Coordinates) {
  const radius = coordinates.accuracyMeters;

  if (typeof radius !== 'number' || !Number.isFinite(radius)) {
    return null;
  }

  return Math.min(MAX_ACCURACY_RADIUS_METERS, Math.max(MIN_ACCURACY_RADIUS_METERS, radius));
}

export function createAccuracyCircleFeature(
  center: Coordinates,
  radiusMeters: number,
  steps = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const latitudeRadians = (center.latitude * Math.PI) / 180;
  const longitudeRadians = (center.longitude * Math.PI) / 180;
  const angularDistance = radiusMeters / EARTH_RADIUS_METERS;
  const coordinates: GeoJSON.Position[] = [];

  for (let step = 0; step <= steps; step += 1) {
    const bearing = (2 * Math.PI * step) / steps;
    const pointLatitude = Math.asin(
      Math.sin(latitudeRadians) * Math.cos(angularDistance) +
        Math.cos(latitudeRadians) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    const pointLongitude =
      longitudeRadians +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitudeRadians),
        Math.cos(angularDistance) - Math.sin(latitudeRadians) * Math.sin(pointLatitude),
      );

    coordinates.push([(pointLongitude * 180) / Math.PI, (pointLatitude * 180) / Math.PI]);
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates],
    },
  };
}
