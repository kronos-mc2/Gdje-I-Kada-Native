import { getApiBaseUrl } from '@/core/api/http-client';
import { useAuthStore } from '@/core/store/auth-store';
import { AppEvent, EventMedia } from '@/core/types/domain';

export type AuthenticatedImageSource = {
  uri: string;
  headers?: Record<string, string>;
};

export const getEventPrimaryMedia = (event?: Pick<AppEvent, 'media'> | null): EventMedia | undefined => event?.media?.[0];

export const getEventImageMedia = (event?: Pick<AppEvent, 'media'> | null): EventMedia[] =>
  event?.media?.filter((media) => media.mediaType === 'image') ?? [];

export const getEventImageUris = (event?: Pick<AppEvent, 'media'> | null): string[] =>
  getEventImageMedia(event)
    .map((media) => normalizeEventMediaUri(media.thumbnailUrl ?? media.url))
    .filter((uri): uri is string => Boolean(uri));

export const getEventImageSources = (event?: Pick<AppEvent, 'media'> | null): AuthenticatedImageSource[] =>
  getEventImageUris(event).map((uri) => getAuthenticatedImageSource(uri));

export const getEventVideoMedia = (event?: Pick<AppEvent, 'media'> | null): EventMedia | undefined =>
  event?.media?.find((media) => media.mediaType === 'video');

export const getEventPosterUri = (event: Pick<AppEvent, 'media'>) => {
  const firstImageUri = getEventImageUris(event)[0];
  if (firstImageUri) {
    return firstImageUri;
  }
  return undefined;
};

export const getEventPosterSource = (event: Pick<AppEvent, 'media'>) => {
  const uri = getEventPosterUri(event);
  return uri ? getAuthenticatedImageSource(uri) : undefined;
};

export const getEventVideoUri = (event?: Pick<AppEvent, 'media'> | null) => {
  const videoMedia = getEventVideoMedia(event);
  return videoMedia ? normalizeEventMediaUri(videoMedia.url) : undefined;
};

export const getEventVideoSource = (event?: Pick<AppEvent, 'media'> | null) => {
  const uri = getEventVideoUri(event);
  return uri ? getAuthenticatedImageSource(uri) : undefined;
};

export function getAuthenticatedImageSource(uri: string): AuthenticatedImageSource;
export function getAuthenticatedImageSource(uri?: string | null): AuthenticatedImageSource | undefined;
export function getAuthenticatedImageSource(uri?: string | null): AuthenticatedImageSource | undefined {
  const normalizedUri = normalizeEventMediaUri(uri);
  if (!normalizedUri) {
    return undefined;
  }

  const token = useAuthStore.getState().accessToken;
  if (!token || !isApiMediaUri(normalizedUri)) {
    return { uri: normalizedUri };
  }

  return {
    uri: normalizedUri,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export const isAuthenticatedImageSource = (source?: AuthenticatedImageSource) => Boolean(source?.headers?.Authorization);

export const normalizeEventMediaUri = (uri?: string | null) => {
  if (!uri) {
    return undefined;
  }

  try {
    if (uri.startsWith('/')) {
      return resolveApiPath(uri);
    }

    const mediaUrl = new URL(uri);
    if (mediaUrl.hostname !== 'localhost' && mediaUrl.hostname !== '127.0.0.1') {
      return uri;
    }

    const apiUrl = new URL(getApiBaseUrl());
    if (apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1') {
      return uri;
    }

    mediaUrl.hostname = apiUrl.hostname;
    return mediaUrl.toString();
  } catch {
    return uri;
  }
};

const resolveApiPath = (path: string) => {
  const apiUrl = new URL(getApiBaseUrl());
  const apiOrigin = apiUrl.origin;
  const normalizedPath = path.startsWith('/api/') ? path : `${apiUrl.pathname.replace(/\/+$/, '')}${path}`;
  return `${apiOrigin}${normalizedPath}`;
};

const isApiMediaUri = (uri: string) => {
  try {
    const apiUrl = new URL(getApiBaseUrl());
    const mediaUrl = new URL(uri);
    const apiPath = apiUrl.pathname.replace(/\/+$/, '');
    return mediaUrl.origin === apiUrl.origin && mediaUrl.pathname.startsWith(`${apiPath}/events/`) && mediaUrl.pathname.includes('/media/');
  } catch {
    return false;
  }
};
