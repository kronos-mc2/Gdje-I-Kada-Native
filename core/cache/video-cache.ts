import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useMemo, useRef, useState } from 'react';

import { AuthenticatedImageSource } from '@/core/events/event-cover';
import { useAuthStore } from '@/core/store/auth-store';
import { asyncStorage } from '@/core/utils/async-storage';

const VIDEO_CACHE_DIRECTORY = FileSystem.cacheDirectory ? `${FileSystem.cacheDirectory}gik-video-cache/` : null;
const VIDEO_CACHE_MAX_BYTES = 350 * 1024 * 1024;
const VIDEO_CACHE_INDEX_PREFIX = 'gik-video-cache-index';
const SUPPORTED_EXTENSIONS = new Set(['mp4', 'mov', 'm4v']);

type VideoCacheRecord = {
  cacheKey: string;
  fileUri: string;
  byteSize: number;
  createdAt: string;
  lastAccessedAt: string;
};

type VideoCacheSource = AuthenticatedImageSource & {
  localFile?: boolean;
};

type FileInfoLike = {
  size?: number | null;
};

const inFlightDownloads = new Map<string, Promise<VideoCacheSource | null>>();

export function useCachedVideoSource(source: AuthenticatedImageSource, enabled = true): VideoCacheSource {
  const stableSource = useMemo(() => source, [source.cacheKey, source.headers, source.uri]);
  const [cachedSource, setCachedSource] = useState<VideoCacheSource>(stableSource);

  useEffect(() => {
    let cancelled = false;
    setCachedSource(stableSource);

    if (!enabled || !stableSource.cacheKey || !VIDEO_CACHE_DIRECTORY) {
      return () => {
        cancelled = true;
      };
    }

    void getCachedVideoSource(stableSource).then((cached) => {
      if (!cancelled && cached) {
        setCachedSource(cached);
      }
    });

    void cacheVideoSource(stableSource).then((cached) => {
      if (!cancelled && cached) {
        setCachedSource(cached);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, stableSource]);

  return cachedSource;
}

export function useVideoCacheLifecycle() {
  const currentUserKey = useAuthStore((state) => userKeyFromEmail(state.user?.email));
  const previousUserKeyRef = useRef(currentUserKey);

  useEffect(() => {
    const previousUserKey = previousUserKeyRef.current;
    previousUserKeyRef.current = currentUserKey;
    if (previousUserKey && previousUserKey !== currentUserKey) {
      void clearVideoCacheForUser(previousUserKey).catch(() => undefined);
    }
  }, [currentUserKey]);
}

export async function clearVideoCacheForUser(userKey: string): Promise<void> {
  const records = await readIndex(userKey);
  await Promise.all(records.map((record) => deleteFile(record.fileUri)));
  await asyncStorage.removeItem(indexStorageKey(userKey));
}

async function getCachedVideoSource(source: AuthenticatedImageSource): Promise<VideoCacheSource | null> {
  if (!source.cacheKey || !VIDEO_CACHE_DIRECTORY) {
    return null;
  }

  const userKey = getCurrentUserKey();
  const records = await readIndex(userKey);
  const record = records.find((item) => item.cacheKey === source.cacheKey);
  if (!record) {
    return null;
  }

  const info = await FileSystem.getInfoAsync(record.fileUri);
  if (!info.exists) {
    await writeIndex(userKey, records.filter((item) => item.cacheKey !== source.cacheKey));
    return null;
  }

  const touchedRecord = { ...record, lastAccessedAt: new Date().toISOString(), byteSize: readFileSize(info, record.byteSize) };
  await writeIndex(userKey, records.map((item) => (item.cacheKey === source.cacheKey ? touchedRecord : item)));
  return { uri: touchedRecord.fileUri, cacheKey: source.cacheKey, localFile: true };
}

async function cacheVideoSource(source: AuthenticatedImageSource): Promise<VideoCacheSource | null> {
  if (!source.cacheKey || !VIDEO_CACHE_DIRECTORY || source.uri.startsWith('file://')) {
    return null;
  }

  const inFlightKey = `${getCurrentUserKey()}:${source.cacheKey}`;
  const existingDownload = inFlightDownloads.get(inFlightKey);
  if (existingDownload) {
    return existingDownload;
  }

  const downloadPromise = downloadAndIndexVideo(source).finally(() => {
    inFlightDownloads.delete(inFlightKey);
  });
  inFlightDownloads.set(inFlightKey, downloadPromise);
  return downloadPromise;
}

async function downloadAndIndexVideo(source: AuthenticatedImageSource): Promise<VideoCacheSource | null> {
  if (!source.cacheKey || !VIDEO_CACHE_DIRECTORY) {
    return null;
  }

  await ensureVideoCacheDirectory();
  const userKey = getCurrentUserKey();
  const extension = resolveVideoExtension(source.uri);
  const fileUri = `${VIDEO_CACHE_DIRECTORY}${safeFileName(`${userKey}-${source.cacheKey}`)}.${extension}`;
  const temporaryUri = `${fileUri}.download`;

  await deleteFile(temporaryUri);
  const result = await FileSystem.downloadAsync(source.uri, temporaryUri, {
    headers: source.headers,
    sessionType: FileSystem.FileSystemSessionType.FOREGROUND,
  });

  if (result.status < 200 || result.status >= 300) {
    await deleteFile(temporaryUri);
    return null;
  }

  await deleteFile(fileUri);
  await FileSystem.moveAsync({ from: temporaryUri, to: fileUri });
  const info = await FileSystem.getInfoAsync(fileUri);
  if (!info.exists) {
    return null;
  }

  const now = new Date().toISOString();
  const record: VideoCacheRecord = {
    cacheKey: source.cacheKey,
    fileUri,
    byteSize: readFileSize(info, 0),
    createdAt: now,
    lastAccessedAt: now,
  };
  const records = (await readIndex(userKey)).filter((item) => item.cacheKey !== source.cacheKey);
  await writeIndex(userKey, [...records, record]);
  await pruneVideoCache(userKey, source.cacheKey);
  return { uri: fileUri, cacheKey: source.cacheKey, localFile: true };
}

async function pruneVideoCache(userKey: string, protectedCacheKey?: string): Promise<void> {
  const records = await readIndex(userKey);
  let totalBytes = records.reduce((sum, record) => sum + record.byteSize, 0);
  if (totalBytes <= VIDEO_CACHE_MAX_BYTES) {
    return;
  }

  const recordsByLeastRecent = [...records].sort((left, right) => left.lastAccessedAt.localeCompare(right.lastAccessedAt));
  const remainingRecords = new Set(records.map((record) => record.cacheKey));
  for (const record of recordsByLeastRecent) {
    if (record.cacheKey === protectedCacheKey) {
      continue;
    }
    await deleteFile(record.fileUri);
    remainingRecords.delete(record.cacheKey);
    totalBytes -= record.byteSize;
    if (totalBytes <= VIDEO_CACHE_MAX_BYTES) {
      break;
    }
  }

  await writeIndex(userKey, records.filter((record) => remainingRecords.has(record.cacheKey)));
}

async function ensureVideoCacheDirectory() {
  if (!VIDEO_CACHE_DIRECTORY) {
    return;
  }
  await FileSystem.makeDirectoryAsync(VIDEO_CACHE_DIRECTORY, { intermediates: true }).catch(() => undefined);
}

async function readIndex(userKey: string): Promise<VideoCacheRecord[]> {
  const rawValue = await asyncStorage.getItem(indexStorageKey(userKey)).catch(() => null);
  if (!rawValue) {
    return [];
  }
  try {
    const parsedValue = JSON.parse(rawValue) as VideoCacheRecord[];
    return Array.isArray(parsedValue) ? parsedValue.filter(isVideoCacheRecord) : [];
  } catch {
    return [];
  }
}

async function writeIndex(userKey: string, records: VideoCacheRecord[]): Promise<void> {
  await asyncStorage.setItem(indexStorageKey(userKey), JSON.stringify(records));
}

async function deleteFile(fileUri: string): Promise<void> {
  await FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => undefined);
}

function getCurrentUserKey() {
  return userKeyFromEmail(useAuthStore.getState().user?.email);
}

function userKeyFromEmail(email?: string | null) {
  return safeFileName(email?.trim().toLowerCase() || 'anonymous');
}

function indexStorageKey(userKey: string) {
  return `${VIDEO_CACHE_INDEX_PREFIX}:${userKey}`;
}

function safeFileName(value: string) {
  return value.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 180);
}

function resolveVideoExtension(uri: string) {
  const cleanUri = uri.split('?')[0];
  const lastDotIndex = cleanUri.lastIndexOf('.');
  const extension = lastDotIndex >= 0 ? cleanUri.slice(lastDotIndex + 1).toLowerCase() : '';
  return SUPPORTED_EXTENSIONS.has(extension) ? extension : 'mp4';
}

function readFileSize(info: FileInfoLike, fallbackSize: number) {
  return typeof info.size === 'number' && Number.isFinite(info.size) ? info.size : fallbackSize;
}

function isVideoCacheRecord(value: unknown): value is VideoCacheRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Partial<VideoCacheRecord>;
  return (
    typeof record.cacheKey === 'string' &&
    typeof record.fileUri === 'string' &&
    typeof record.byteSize === 'number' &&
    typeof record.createdAt === 'string' &&
    typeof record.lastAccessedAt === 'string'
  );
}
