import type { AuthenticatedImageSource } from '@/core/events/event-cover';
import { Coordinates } from '@/core/types/domain';

export type EventMapMarker = {
  id: string;
  coordinate: Coordinates;
  title: string;
  subtitle?: string;
  coverImageSource?: AuthenticatedImageSource;
  isSelected: boolean;
};

export type MapCameraState = {
  center: Coordinates;
  zoomLevel?: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
  isUserInteraction?: boolean;
};

export type EventMapSurfaceProps = {
  markers: EventMapMarker[];
  userLocation: Coordinates;
  initialCenter: Coordinates;
  initialZoomLevel?: number;
  focusCoordinate?: Coordinates | null;
  focusZoomLevel?: number;
  searchMarker?: Coordinates | null;
  showsUserLocation?: boolean;
  interactive?: boolean;
  onMarkerPress: (id: string) => void;
  onCameraStateChange?: (camera: MapCameraState) => void;
  onUserLocationUpdate?: (coordinates: Coordinates) => void;
};
