import type { AppEvent } from '@/core/types/domain';

type GroupableEvent = Pick<AppEvent, 'address' | 'coordinates' | 'where'>;

export function getEventVenueGroupKey(event: GroupableEvent) {
  const address = normalizeVenueAddress(event.address);
  if (address) {
    return `address:${address}`;
  }

  const locationName = normalizeVenueAddress(event.where.hr) || normalizeVenueAddress(event.where.en);
  return [
    'coordinate',
    locationName,
    event.coordinates.latitude.toFixed(6),
    event.coordinates.longitude.toFixed(6),
  ].join(':');
}

function normalizeVenueAddress(value?: string | null) {
  const normalized = (value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ',')
    .replace(/[.,;:\s]+$/g, '');

  if (!normalized) {
    return '';
  }

  const parts = normalized.split(',').map((part) => part.trim()).filter(Boolean);
  const street = normalizeStreetAddress(parts[0] ?? normalized);
  const city = findCityPart(parts);
  const postalCode = findPostalCode(parts);

  return [street, city, postalCode].filter(Boolean).join('|');
}

function normalizeStreetAddress(value: string) {
  return value
    .replace(/\b(ulica|ul|street|st)\b\.?/g, 'ulica')
    .replace(/\s+/g, ' ')
    .trim();
}

function findCityPart(parts: string[]) {
  for (const part of parts.slice(1)) {
    const city = normalizeCityPart(part);
    if (city) {
      return city;
    }
  }

  return '';
}

function normalizeCityPart(value: string) {
  const withoutPostalCode = value.replace(/\b\d{4,6}\b/g, '').trim();
  const normalized = withoutPostalCode
    .replace(/\b(city of|grad)\b/g, '')
    .replace(/\b(county|zupanija)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized || normalized === 'croatia' || normalized === 'hrvatska') {
    return '';
  }

  return normalized;
}

function findPostalCode(parts: string[]) {
  for (const part of parts) {
    const match = part.match(/\b\d{4,6}\b/);
    if (match?.[0]) {
      return match[0];
    }
  }

  return '';
}
