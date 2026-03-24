import { AppEvent, Conversation, Friend } from '@/core/types/domain';

export const USER_LOCATION = {
  latitude: 45.815,
  longitude: 15.9819,
};

export const mockEvents: AppEvent[] = [
  {
    id: '1',
    title: { hr: 'Cosmo party dobrodoslice', en: "Cosmo's welcome party" },
    where: { hr: 'Cvjetni trg, Zagreb', en: 'Cvjetni Square, Zagreb' },
    about: {
      hr: 'Lezerno okupljanje uz DJ set i dobro drustvo.',
      en: 'Casual gathering with a DJ set and friends.',
    },
    whenISO: '2026-04-12T18:30:00.000Z',
    type: 'nearby',
    coordinates: { latitude: 45.8134, longitude: 15.9778 },
    participantCount: 32,
  },
  {
    id: '2',
    title: { hr: 'Fiesta ORLA', en: 'ORLA Fiesta' },
    where: { hr: 'Bundek, Zagreb', en: 'Bundek Lake, Zagreb' },
    about: {
      hr: 'Open-air event uz hranu, pice i live nastup.',
      en: 'Open-air event with food, drinks and live music.',
    },
    whenISO: '2026-04-25T17:00:00.000Z',
    type: 'joined',
    coordinates: { latitude: 45.7887, longitude: 15.9903 },
    participantCount: 88,
  },
  {
    id: '3',
    title: { hr: 'Aullidos Tour Zagreb', en: 'Aullidos Tour Zagreb' },
    where: { hr: 'Arena Zagreb', en: 'Zagreb Arena' },
    about: {
      hr: 'Vecernji koncert i after-event.',
      en: 'Evening concert with an after-event.',
    },
    whenISO: '2026-05-09T19:30:00.000Z',
    type: 'nearby',
    coordinates: { latitude: 45.7714, longitude: 15.9419 },
    participantCount: 350,
  },
  {
    id: '4',
    title: { hr: 'Iron Maiden Night', en: 'Iron Maiden Night' },
    where: { hr: 'Tvornica Kulture', en: 'Tvornica Kulture' },
    about: {
      hr: 'Tribute night s tematskim DJ-em.',
      en: 'Tribute night with themed DJ lineup.',
    },
    whenISO: '2026-06-18T20:00:00.000Z',
    type: 'created',
    coordinates: { latitude: 45.8067, longitude: 15.9661 },
    participantCount: 120,
  },
];

export const mockFriends: Friend[] = [
  {
    id: 'u1',
    name: 'Ana',
    status: { hr: 'Online i spremna za izlazak', en: 'Online and ready to go out' },
  },
  {
    id: 'u2',
    name: 'Marko',
    status: { hr: 'Dolazi na ORLA event', en: 'Joining ORLA event' },
  },
  {
    id: 'u3',
    name: 'Lana',
    status: { hr: 'Na putu prema centru', en: 'Heading downtown' },
  },
];

export const mockConversations: Conversation[] = [
  {
    id: 'c1',
    contact: 'Ana',
    lastMessage: { hr: 'Vidimo se u subotu!', en: 'See you on Saturday!' },
    timeLabel: '09:12',
  },
  {
    id: 'c2',
    contact: 'Marko',
    lastMessage: { hr: 'Stizem za 5 min', en: 'I will be there in 5 min' },
    timeLabel: '08:45',
  },
  {
    id: 'c3',
    contact: 'Lana',
    lastMessage: { hr: 'Super event jucer', en: 'Great event yesterday' },
    timeLabel: 'Yesterday',
  },
];
