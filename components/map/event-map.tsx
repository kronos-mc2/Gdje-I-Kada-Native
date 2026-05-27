import { useMemo, useRef } from 'react';

import { EventMapSurface } from '@/components/map/event-map-surface';
import { MapCameraState } from '@/components/map/types';
import { getEventPosterSource } from '@/core/events/event-cover';
import { AppEvent, Coordinates, Locale } from '@/core/types/domain';

type EventMapProps = Readonly<{
  events: AppEvent[];
  locale: Locale;
  userLocation: Coordinates;
  selectedEventId: string | null;
  searchMarker?: Coordinates | null;
  focusCoordinate?: Coordinates | null;
  focusZoomLevel?: number;
  showsUserLocation?: boolean;
  initialZoomLevel?: number;
  interactive?: boolean;
  onSelectEvent: (eventIds: string[]) => void;
  onCameraStateChange?: (camera: MapCameraState) => void;
  onUserLocationUpdate?: (coordinates: Coordinates) => void;
}>;

export function EventMap({
  events,
  locale,
  userLocation,
  selectedEventId,
  searchMarker,
  focusCoordinate,
  focusZoomLevel,
  showsUserLocation = true,
  initialZoomLevel,
  interactive = true,
  onSelectEvent,
  onCameraStateChange,
  onUserLocationUpdate,
}: EventMapProps) {
  const initialCenterRef = useRef<Coordinates>(userLocation);
  const initialCenter = initialCenterRef.current;

  const markers = useMemo(() => {
    const groups = new Map<string, AppEvent[]>();

    for (const event of events) {
      const key = getExactVenueKey(event);
      groups.set(key, [...(groups.get(key) ?? []), event]);
    }

    return Array.from(groups.entries()).flatMap(([key, group]) => {
      const firstEvent = group[0];
      if (!firstEvent) {
        return [];
      }
      const eventIds = group.map((event) => event.id);
      const coverImageSources = group
        .map((event) => getEventPosterSource(event))
        .filter((source): source is NonNullable<typeof source> => Boolean(source));

      return [{
        id: key,
        eventIds,
        coordinate: firstEvent.coordinates,
        title: group.length > 1 ? `${group.length} ${firstEvent.where[locale]}` : firstEvent.title[locale],
        subtitle: firstEvent.where[locale],
        coverImageSource: getEventPosterSource(firstEvent),
        coverImageSources,
        count: group.length,
        dateBadge: group.length === 1 ? getEventDateBadge(firstEvent.startAt, locale) : null,
        isSelected: group.some((event) => selectedEventId === event.id),
        isFriendsOnly: group.some((event) => event.visibility === 'friends'),
      }];
    });
  }, [events, locale, selectedEventId]);

  return (
    <EventMapSurface
      markers={markers}
      userLocation={userLocation}
      initialCenter={initialCenter}
      initialZoomLevel={initialZoomLevel}
      focusCoordinate={focusCoordinate}
      focusZoomLevel={focusZoomLevel}
      searchMarker={searchMarker}
      showsUserLocation={showsUserLocation}
      interactive={interactive}
      onMarkerPress={(markerId) => {
        const marker = markers.find((item) => item.id === markerId);
        onSelectEvent(marker?.eventIds?.length ? marker.eventIds : [markerId]);
      }}
      onCameraStateChange={onCameraStateChange}
      onUserLocationUpdate={onUserLocationUpdate}
    />
  );
}

function getExactVenueKey(event: AppEvent) {
  const address = event.address.trim().toLocaleLowerCase();
  return [
    address || event.where.hr.trim().toLocaleLowerCase() || event.where.en.trim().toLocaleLowerCase(),
    event.coordinates.latitude.toFixed(6),
    event.coordinates.longitude.toFixed(6),
  ].join(':');
}

function getEventDateBadge(startAt: string, locale: Locale) {
  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfEventDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const dayDelta = Math.round((startOfEventDay - startOfToday) / 86400000);

  if (dayDelta === 0) {
    return { label: locale === 'hr' ? 'DANAS' : 'TODAY', colorKey: 'todayAccent' as const };
  }
  if (dayDelta === 1) {
    return { label: locale === 'hr' ? 'SUTRA' : 'TOMORROW', colorKey: 'tomorrowAccent' as const };
  }
  return null;
}
