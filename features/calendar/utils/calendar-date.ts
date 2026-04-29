import { Locale } from '@/core/types/domain';

export const toDateKey = (input: string | Date) => {
  const value = input instanceof Date ? input : new Date(input);
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');

  return `${value.getFullYear()}-${month}-${day}`;
};

export const todayDateKey = () => toDateKey(new Date());

export const monthDateKey = (input: string | Date) => {
  const value = input instanceof Date ? input : new Date(`${input}T00:00:00`);
  const month = `${value.getMonth() + 1}`.padStart(2, '0');

  return `${value.getFullYear()}-${month}-01`;
};

export const addMonthsToKey = (monthKey: string, amount: number) => {
  const value = new Date(`${monthKey}T00:00:00`);
  value.setMonth(value.getMonth() + amount);

  return monthDateKey(value);
};

export const formatCalendarMonth = (monthKey: string, locale: Locale) => {
  const value = new Date(`${monthKey}T00:00:00`);
  const month = new Intl.DateTimeFormat(locale === 'hr' ? 'hr-HR' : 'en-US', { month: 'short' })
    .format(value)
    .replace('.', '')
    .toUpperCase();

  return month;
};

export const formatSelectedDayLabel = (dayKey: string, locale: Locale) => {
  const value = new Date(`${dayKey}T00:00:00`);

  return new Intl.DateTimeFormat(locale === 'hr' ? 'hr-HR' : 'en-US', {
    day: 'numeric',
    month: 'short',
  }).format(value);
};
