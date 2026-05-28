export type CreateEventStep = 'basics' | 'time' | 'location' | 'settings' | 'media';

export type CreateEventFormState = {
  title: string;
  locationName: string;
  address: string;
  about: string;
  startAt: string;
  endAt: string;
  entryInstructions: string;
  priceAmount: string;
  priceCurrency: string;
  capacity: string;
};

export const CREATE_EVENT_STEPS: CreateEventStep[] = ['basics', 'time', 'location', 'settings', 'media'];

export const INITIAL_CREATE_EVENT_FORM: CreateEventFormState = {
  title: '',
  locationName: '',
  address: '',
  about: '',
  startAt: '',
  endAt: '',
  entryInstructions: '',
  priceAmount: '',
  priceCurrency: 'EUR',
  capacity: '',
};

export const parseOptionalPositiveInteger = (value: string) => {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const parseOptionalMoneyAmount = (value: string) => {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};
