import type { Locale } from '@/core/types/domain';

export type EventTagCategoryId = 'musicGenres' | 'vibe' | 'eventType' | 'audience' | 'timeContext';

export type EventTagCategory = {
  id: EventTagCategoryId;
  title: Record<Locale, string>;
  tags: string[];
};

export const MAX_EVENT_TAGS_PER_CATEGORY = 2;

export const EVENT_TAG_CATEGORIES: EventTagCategory[] = [
  {
    id: 'musicGenres',
    title: { hr: 'Glazbeni žanrovi', en: 'Music genres' },
    tags: [
      'Rock',
      'Pop',
      'Jazz',
      'Blues',
      'Hip-Hop',
      'Rap',
      'Trap',
      'R&B',
      'Soul',
      'Funk',
      'Disco',
      'House',
      'Techno',
      'Trance',
      'Drum & Bass',
      'Dubstep',
      'EDM',
      'Punk',
      'Metal',
      'Hardcore',
      'Indie',
      'Alternative',
      'Reggae',
      'Ska',
      'Folk',
      'Acoustic',
      'Classical',
      'Opera',
      'Tamburica',
      'Balkan',
      'Ex-Yu',
      'Latin',
      'Afrobeat',
      'K-Pop',
      'J-Pop',
    ],
  },
  {
    id: 'vibe',
    title: { hr: 'Vibe / atmosfera eventa', en: 'Vibe / event atmosphere' },
    tags: [
      'Chill',
      'Cozy',
      'Relaxed',
      'Energetic',
      'Party',
      'Underground',
      'Classy',
      'Romantic',
      'Dark',
      'Loud',
      'Intimate',
      'Friendly',
      'Wild',
      'Nostalgic',
      'Retro',
      'Experimental',
      'Artsy',
      'Elegant',
      'Casual',
      'Hardcore',
      'Groovy',
      'Emotional',
      'Feel-good',
      'Family-friendly',
    ],
  },
  {
    id: 'eventType',
    title: { hr: 'Tip eventa', en: 'Event type' },
    tags: [
      'Concert',
      'Festival',
      'Club Night',
      'DJ Set',
      'Live Music',
      'Open Mic',
      'Karaoke',
      'Stand-up',
      'Theatre',
      'Movie Night',
      'Exhibition',
      'Workshop',
      'Lecture',
      'Meetup',
      'Networking',
      'Pub Quiz',
      'Game Night',
      'Tournament',
      'Market',
      'Fair',
      'Food Event',
      'Tasting',
      'Charity',
      'Sports',
      'Outdoor',
      'Indoor',
      'Afterparty',
      'Student Event',
    ],
  },
  {
    id: 'audience',
    title: { hr: 'Publika / zajednica', en: 'Audience / community' },
    tags: [
      'Students',
      'Families',
      'Kids',
      'Couples',
      'Singles',
      'Gamers',
      'Artists',
      'Developers',
      'Entrepreneurs',
      'LGBTQ+',
      'Pet-friendly',
      'International',
      'Locals',
      'Beginners',
      'Professionals',
      'Creatives',
    ],
  },
  {
    id: 'timeContext',
    title: { hr: 'Vrijeme / kontekst', en: 'Time / context' },
    tags: [
      'Weekend',
      'Weekday',
      'Tonight',
      'Late Night',
      'Morning',
      'Afternoon',
      'Sunset',
      'Summer',
      'Winter',
      'Holiday',
      'New Year',
      'Halloween',
      'Christmas',
      'Valentine’s',
      'Free Entry',
      'Tickets Required',
      'Reservation Needed',
    ],
  },
];

export const MAX_EVENT_TAGS_TOTAL = EVENT_TAG_CATEGORIES.length * MAX_EVENT_TAGS_PER_CATEGORY;

const normalizeComparableTag = (value: string) => value.trim().replace(/^#+/, '').replace(/'/g, '’').replace(/\s+/g, ' ').toLowerCase();

const tagByComparableValue = new Map(
  EVENT_TAG_CATEGORIES.flatMap((category) => category.tags).map((tag) => [normalizeComparableTag(tag), tag]),
);

export const normalizeEventTag = (value: string) => tagByComparableValue.get(normalizeComparableTag(value));

export const getEventTagCategory = (tag: string) => {
  const canonicalTag = normalizeEventTag(tag);
  if (!canonicalTag) {
    return undefined;
  }

  return EVENT_TAG_CATEGORIES.find((category) => category.tags.includes(canonicalTag));
};

export const countSelectedTagsInCategory = (selectedTags: string[], categoryId: EventTagCategoryId) => {
  const category = EVENT_TAG_CATEGORIES.find((candidate) => candidate.id === categoryId);
  if (!category) {
    return 0;
  }

  return selectedTags.filter((tag) => category.tags.includes(tag)).length;
};

export const canSelectEventTag = (selectedTags: string[], tag: string) => {
  if (selectedTags.includes(tag)) {
    return true;
  }

  const category = getEventTagCategory(tag);
  return category ? countSelectedTagsInCategory(selectedTags, category.id) < MAX_EVENT_TAGS_PER_CATEGORY : false;
};

export const filterEventTags = (query: string, tags: string[]) => {
  const normalizedQuery = normalizeComparableTag(query);
  if (!normalizedQuery) {
    return tags;
  }

  return tags.filter((tag) => normalizeComparableTag(tag).includes(normalizedQuery));
};
