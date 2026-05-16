import { AppEvent, EventMedia } from '@/core/types/domain';

export const getEventCoverUri = (eventId: string, width = 160, height = 160) =>
  `https://picsum.photos/seed/${encodeURIComponent('gdjeikada-' + eventId)}/${width}/${height}`;

export const getEventPrimaryMedia = (event?: Pick<AppEvent, 'media'> | null): EventMedia | undefined => event?.media?.[0];

export const getEventPosterUri = (event: Pick<AppEvent, 'id' | 'media'>, width = 160, height = 160) => {
  const primaryMedia = getEventPrimaryMedia(event);
  if (primaryMedia?.thumbnailUrl) {
    return primaryMedia.thumbnailUrl;
  }
  if (primaryMedia?.mediaType === 'image') {
    return primaryMedia.url;
  }
  return getEventCoverUri(event.id, width, height);
};

export const getEventVideoUri = (event?: Pick<AppEvent, 'media'> | null) => {
  const primaryMedia = getEventPrimaryMedia(event);
  return primaryMedia?.mediaType === 'video' ? primaryMedia.url : undefined;
};
