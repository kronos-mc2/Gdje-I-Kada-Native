import { getApiBaseUrl } from '@/core/api/http-client';
import { AppEvent, EventMedia } from '@/core/types/domain';

export const getEventPrimaryMedia = (event?: Pick<AppEvent, 'media'> | null): EventMedia | undefined => event?.media?.[0];

export const getEventImageMedia = (event?: Pick<AppEvent, 'media'> | null): EventMedia[] =>
  event?.media?.filter((media) => media.mediaType === 'image') ?? [];

export const getEventImageUris = (event?: Pick<AppEvent, 'media'> | null): string[] =>
  getEventImageMedia(event)
    .map((media) => normalizeEventMediaUri(media.thumbnailUrl ?? media.url))
    .filter(Boolean);

export const getEventPosterUri = (event: Pick<AppEvent, 'media'>) => {
  const firstImageUri = getEventImageUris(event)[0];
  if (firstImageUri) {
    return firstImageUri;
  }
  return undefined;
};

export const getEventVideoUri = (event?: Pick<AppEvent, 'media'> | null) => {
  const primaryMedia = getEventPrimaryMedia(event);
  return primaryMedia?.mediaType === 'video' ? normalizeEventMediaUri(primaryMedia.url) : undefined;
};

export const normalizeEventMediaUri = (uri?: string | null) => {
  if (!uri) {
    return undefined;
  }

  try {
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
