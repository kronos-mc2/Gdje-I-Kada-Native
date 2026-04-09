import { Coordinates } from '@/core/types/domain';

export type EventMapMarker = {
  id: string;
  coordinate: Coordinates;
  title: string;
  subtitle?: string;
  coverImageUri?: string;
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
  focusCoordinate?: Coordinates | null;
  searchMarker?: Coordinates | null;
  interactive?: boolean;
  onMarkerPress: (id: string) => void;
  onCameraStateChange?: (camera: MapCameraState) => void;
};
