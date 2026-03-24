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
