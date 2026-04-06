import { useMemo } from 'react';

import { EventMapSurface } from '@/components/map/event-map-surface';
import { MapCameraState } from '@/components/map/types';
import { getEventCoverUri } from '@/core/events/event-cover';
import { AppEvent, Coordinates, Locale } from '@/core/types/domain';

type EventMapProps = {
  events: AppEvent[];
  locale: Locale;
  userLocation: Coordinates;
  selectedEventId: string | null;
  searchMarker?: Coordinates | null;
  focusCoordinate?: Coordinates | null;
  interactive?: boolean;
  onSelectEvent: (eventId: string) => void;
  onCameraStateChange?: (camera: MapCameraState) => void;
};

export function EventMap({
  events,
  locale,
  userLocation,
  selectedEventId,
  searchMarker,
  focusCoordinate,
  interactive = true,
  onSelectEvent,
  onCameraStateChange,
}: EventMapProps) {
  const initialCenter = events[0]?.coordinates ?? userLocation;

  const markers = useMemo(
    () =>
      events.map((event) => ({
        id: event.id,
        coordinate: event.coordinates,
        title: event.title[locale],
        subtitle: event.where[locale],
        coverImageUri: getEventCoverUri(event.id),
        isSelected: selectedEventId === event.id,
      })),
    [events, locale, selectedEventId],
  );

  return (
    <EventMapSurface
      markers={markers}
      initialCenter={initialCenter}
      focusCoordinate={focusCoordinate}
      searchMarker={searchMarker}
      interactive={interactive}
      onMarkerPress={onSelectEvent}
      onCameraStateChange={onCameraStateChange}
    />
  );
}
