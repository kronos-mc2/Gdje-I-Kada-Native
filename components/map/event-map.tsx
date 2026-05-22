import { useMemo, useRef } from 'react';

import { EventMapSurface } from '@/components/map/event-map-surface';
import { MapCameraState } from '@/components/map/types';
import { getEventPosterUri } from '@/core/events/event-cover';
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
  onSelectEvent: (eventId: string) => void;
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

  const markers = useMemo(
    () =>
      events.map((event) => ({
        id: event.id,
        coordinate: event.coordinates,
        title: event.title[locale],
        subtitle: event.where[locale],
        coverImageUri: getEventPosterUri(event),
        isSelected: selectedEventId === event.id,
      })),
    [events, locale, selectedEventId],
  );

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
      onMarkerPress={onSelectEvent}
      onCameraStateChange={onCameraStateChange}
      onUserLocationUpdate={onUserLocationUpdate}
    />
  );
}
