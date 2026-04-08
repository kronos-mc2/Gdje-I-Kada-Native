export const getEventCoverUri = (eventId: string, width = 160, height = 160) =>
  `https://picsum.photos/seed/${encodeURIComponent(`gdjeikada-${eventId}`)}/${width}/${height}`;
