import * as SQLite from 'expo-sqlite';

import { useAuthStore } from '@/core/store/auth-store';
import { AppEvent, ChatMessage, ChatRoom, ChatRoomDetail } from '@/core/types/domain';

const DATABASE_NAME = 'gdje-i-kada-cache.db';
const DATABASE_VERSION = 1;
const DEFAULT_USER_KEY = 'anonymous';

type SQLiteDatabase = Awaited<ReturnType<typeof SQLite.openDatabaseAsync>>;

type PayloadRow = {
  payload: string;
};

type LatestMessageRow = {
  id: string;
};

let databasePromise: Promise<SQLiteDatabase> | null = null;

const getUserKey = () => useAuthStore.getState().user?.email?.trim().toLowerCase() || DEFAULT_USER_KEY;

const getDatabase = async () => {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (database) => {
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS event_cache (
          user_key TEXT NOT NULL,
          event_id TEXT NOT NULL,
          cache_version TEXT NOT NULL,
          updated_at TEXT,
          payload TEXT NOT NULL,
          cached_at TEXT NOT NULL,
          PRIMARY KEY (user_key, event_id)
        );
        CREATE TABLE IF NOT EXISTS chat_room_cache (
          user_key TEXT NOT NULL,
          room_id TEXT NOT NULL,
          payload TEXT NOT NULL,
          cached_at TEXT NOT NULL,
          PRIMARY KEY (user_key, room_id)
        );
        CREATE TABLE IF NOT EXISTS chat_message_cache (
          user_key TEXT NOT NULL,
          room_id TEXT NOT NULL,
          message_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          payload TEXT NOT NULL,
          cached_at TEXT NOT NULL,
          PRIMARY KEY (user_key, room_id, message_id)
        );
        CREATE INDEX IF NOT EXISTS idx_chat_message_cache_room_created
          ON chat_message_cache (user_key, room_id, created_at, message_id);
        PRAGMA user_version = ${DATABASE_VERSION};
      `);
      return database;
    });
  }

  return databasePromise;
};

export const localCache = {
  async getEvent(eventId: string): Promise<AppEvent | null> {
    const database = await getDatabase();
    const row = await database.getFirstAsync<PayloadRow>(
      'SELECT payload FROM event_cache WHERE user_key = ? AND event_id = ? LIMIT 1',
      getUserKey(),
      eventId,
    );
    return row ? parsePayload<AppEvent>(row.payload) : null;
  },

  async saveEvent(event: AppEvent): Promise<void> {
    await saveEvents([event]);
  },

  async saveEvents(events: AppEvent[]): Promise<void> {
    await saveEvents(events);
  },

  async getChatRoomDetail(roomId: string): Promise<ChatRoomDetail | null> {
    const [room, messages] = await Promise.all([getCachedChatRoom(roomId), getCachedChatMessages(roomId)]);
    return room ? { room, messages } : null;
  },

  async saveChatRoomDetail(detail: ChatRoomDetail): Promise<void> {
    const database = await getDatabase();
    const userKey = getUserKey();
    const cachedAt = new Date().toISOString();
    await database.withTransactionAsync(async () => {
      await database.runAsync(
        `INSERT INTO chat_room_cache (user_key, room_id, payload, cached_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_key, room_id)
         DO UPDATE SET payload = excluded.payload, cached_at = excluded.cached_at`,
        userKey,
        detail.room.id,
        JSON.stringify(detail.room),
        cachedAt,
      );
      await saveMessagesInTransaction(database, userKey, detail.room.id, detail.messages, cachedAt);
    });
  },

  async getLatestChatMessageId(roomId: string): Promise<string | null> {
    const database = await getDatabase();
    const row = await database.getFirstAsync<LatestMessageRow>(
      `SELECT message_id AS id
       FROM chat_message_cache
       WHERE user_key = ? AND room_id = ?
       ORDER BY created_at DESC, message_id DESC
       LIMIT 1`,
      getUserKey(),
      roomId,
    );
    return row?.id ?? null;
  },

  async saveChatMessages(roomId: string, messages: ChatMessage[]): Promise<void> {
    const database = await getDatabase();
    const userKey = getUserKey();
    const cachedAt = new Date().toISOString();
    await database.withTransactionAsync(async () => {
      await saveMessagesInTransaction(database, userKey, roomId, messages, cachedAt);
    });
  },
};

const saveEvents = async (events: AppEvent[]) => {
  if (events.length === 0) {
    return;
  }
  const database = await getDatabase();
  const userKey = getUserKey();
  const cachedAt = new Date().toISOString();
  await database.withTransactionAsync(async () => {
    for (const event of events) {
      await database.runAsync(
        `INSERT INTO event_cache (user_key, event_id, cache_version, updated_at, payload, cached_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_key, event_id)
         DO UPDATE SET
           cache_version = excluded.cache_version,
           updated_at = excluded.updated_at,
           payload = excluded.payload,
           cached_at = excluded.cached_at`,
        userKey,
        event.id,
        resolveEventCacheVersion(event),
        event.updatedAt ?? null,
        JSON.stringify(event),
        cachedAt,
      );
    }
  });
};

const getCachedChatRoom = async (roomId: string): Promise<ChatRoom | null> => {
  const database = await getDatabase();
  const row = await database.getFirstAsync<PayloadRow>(
    'SELECT payload FROM chat_room_cache WHERE user_key = ? AND room_id = ? LIMIT 1',
    getUserKey(),
    roomId,
  );
  return row ? parsePayload<ChatRoom>(row.payload) : null;
};

const getCachedChatMessages = async (roomId: string): Promise<ChatMessage[]> => {
  const database = await getDatabase();
  const rows = await database.getAllAsync<PayloadRow>(
    `SELECT payload
     FROM chat_message_cache
     WHERE user_key = ? AND room_id = ?
     ORDER BY created_at ASC, message_id ASC`,
    getUserKey(),
    roomId,
  );
  return rows.map((row) => parsePayload<ChatMessage>(row.payload)).filter((message): message is ChatMessage => Boolean(message));
};

const saveMessagesInTransaction = async (
  database: SQLiteDatabase,
  userKey: string,
  roomId: string,
  messages: ChatMessage[],
  cachedAt: string,
) => {
  for (const message of messages) {
    await database.runAsync(
      `INSERT INTO chat_message_cache (user_key, room_id, message_id, created_at, payload, cached_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_key, room_id, message_id)
       DO UPDATE SET
         created_at = excluded.created_at,
         payload = excluded.payload,
         cached_at = excluded.cached_at`,
      userKey,
      roomId,
      message.id,
      message.createdAt,
      JSON.stringify(message),
      cachedAt,
    );
  }
};

const resolveEventCacheVersion = (event: AppEvent) => event.cacheVersion ?? event.updatedAt ?? `${event.id}:${event.startAt}`;

const parsePayload = <T>(payload: string): T | null => {
  try {
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
};
