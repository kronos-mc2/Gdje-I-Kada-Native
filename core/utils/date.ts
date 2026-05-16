import { Locale } from '@/core/types/domain';

const localeMap: Record<Locale, string> = {
  hr: 'hr-HR',
  en: 'en-US',
};

export const formatEventDate = (isoDate: string, locale: Locale) => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat(localeMap[locale], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatEventDay = (isoDate: string, locale: Locale) => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat(localeMap[locale], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatEventTime = (isoDate: string, locale: Locale) => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat(localeMap[locale], {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatEventDuration = (startIso: string, endIso: string | undefined, locale: Locale) => {
  if (!endIso) {
    return null;
  }

  const start = new Date(startIso);
  const end = new Date(endIso);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null;
  }

  const totalMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours} h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} min`);
  }

  return parts.length > 0 ? parts.join(' ') : locale === 'hr' ? 'manje od minute' : 'less than a minute';
};
