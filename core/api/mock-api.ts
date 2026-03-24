import { mockConversations, mockEvents, mockFriends } from '@/core/data/mock-data';
import { AppEvent, Conversation, Friend } from '@/core/types/domain';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getEvents = async (): Promise<AppEvent[]> => {
  await sleep(220);
  return mockEvents;
};

export const getFriends = async (): Promise<Friend[]> => {
  await sleep(180);
  return mockFriends;
};

export const getConversations = async (): Promise<Conversation[]> => {
  await sleep(180);
  return mockConversations;
};
