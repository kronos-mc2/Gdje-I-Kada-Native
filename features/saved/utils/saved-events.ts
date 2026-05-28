import { AppEvent, Locale } from '@/core/types/domain';

const localeMap: Record<Locale, string> = {
  hr: 'hr-HR',
  en: 'en-US',
};

const ACTIVE_ATTENDANCE = new Set<AppEvent['attendanceStatus']>(['joined', 'approved']);

export type SavedSection = 'saved' | 'going-soon' | 'past';

export const getEventStartDate = (event: AppEvent) => new Date(event.startAt || event.whenISO);

export const sortUpcomingEvents = (events: AppEvent[]) =>
  [...events].sort((left, right) => getEventStartDate(left).getTime() - getEventStartDate(right).getTime());

export const sortPastEvents = (events: AppEvent[]) =>
  [...events].sort((left, right) => getEventStartDate(right).getTime() - getEventStartDate(left).getTime());

export const getGoingSoonEvents = (events: AppEvent[]) => {
  const now = Date.now();
  return sortUpcomingEvents(events.filter((event) => isActiveAttendance(event) && getEventStartDate(event).getTime() >= now));
};

export const getPastEvents = (events: AppEvent[]) => {
  const now = Date.now();
  return sortPastEvents(events.filter((event) => isActiveAttendance(event) && getEventStartDate(event).getTime() < now));
};

export const isActiveAttendance = (event: AppEvent) => ACTIVE_ATTENDANCE.has(event.attendanceStatus);

export const formatSavedDateChip = (event: AppEvent, locale: Locale) => {
  const start = getEventStartDate(event);
  if (Number.isNaN(start.getTime())) {
    return event.startAt || event.whenISO;
  }

  const monthDay = new Intl.DateTimeFormat(localeMap[locale], {
    month: 'short',
    day: 'numeric',
  }).format(start);
  const time = new Intl.DateTimeFormat(localeMap[locale], {
    hour: '2-digit',
    minute: '2-digit',
  }).format(start);

  return `${monthDay.toUpperCase()} · ${time}`;
};

export const formatSavedDayParts = (event: AppEvent, locale: Locale) => {
  const start = getEventStartDate(event);
  if (Number.isNaN(start.getTime())) {
    return { weekday: '', day: '', month: '' };
  }

  return {
    weekday: new Intl.DateTimeFormat(localeMap[locale], { weekday: 'short' }).format(start).toUpperCase(),
    day: new Intl.DateTimeFormat(localeMap[locale], { day: 'numeric' }).format(start),
    month: new Intl.DateTimeFormat(localeMap[locale], { month: 'short' }).format(start).toUpperCase(),
  };
};

export const formatStartsIn = (event: AppEvent, locale: Locale) => {
  const diffMs = getEventStartDate(event).getTime() - Date.now();
  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return null;
  }

  const hours = Math.round(diffMs / 3_600_000);
  if (hours < 48) {
    return `${Math.max(1, hours)} h`;
  }

  const days = Math.round(hours / 24);
  return locale === 'hr' ? `${days} d` : `${days} d`;
};
