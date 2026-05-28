import * as ImagePicker from 'expo-image-picker';

import { LocalEventVideo } from '@/core/types/domain';

export const MAX_EVENT_VIDEOS = 1;
export const MAX_EVENT_VIDEO_BYTES = 10 * 1024 * 1024;

const SUPPORTED_VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'm4v']);
const SUPPORTED_VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/x-m4v']);

export async function normalizePickedEventVideo(asset: ImagePicker.ImagePickerAsset, fallbackName: string): Promise<LocalEventVideo> {
  const name = getAssetFileName(asset, fallbackName);
  const type = asset.mimeType ?? guessVideoMimeType(name);
  return {
    uri: asset.uri,
    name,
    type,
    size: asset.fileSize,
    width: asset.width,
    height: asset.height,
    duration: asset.duration,
  };
}

export function isEventVideoTooLarge(video: LocalEventVideo) {
  return (video.size ?? 0) > MAX_EVENT_VIDEO_BYTES;
}

export function isSupportedEventVideo(video: LocalEventVideo) {
  const mimeType = video.type.toLowerCase();
  const extension = getFileExtension(video.name);
  return SUPPORTED_VIDEO_MIME_TYPES.has(mimeType) || SUPPORTED_VIDEO_EXTENSIONS.has(extension);
}

export function isEventVideoUploadUriSupported(video: LocalEventVideo) {
  return !video.uri.startsWith('content://');
}

export function formatEventVideoSize(size?: number) {
  if (!size || size <= 0) {
    return undefined;
  }
  return `${(size / (1024 * 1024)).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function getAssetFileName(asset: ImagePicker.ImagePickerAsset, fallbackName: string) {
  return asset.fileName?.trim() || getUriFileName(asset.uri) || fallbackName;
}

function getUriFileName(uri: string) {
  const cleanUri = uri.split('?')[0];
  const slashIndex = cleanUri.lastIndexOf('/');
  return slashIndex >= 0 ? cleanUri.slice(slashIndex + 1) : cleanUri;
}

function getFileExtension(filename: string) {
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex >= 0 ? filename.slice(dotIndex + 1).toLowerCase() : '';
}

function guessVideoMimeType(name: string) {
  const extension = getFileExtension(name);
  if (extension === 'mov') {
    return 'video/quicktime';
  }
  if (extension === 'm4v') {
    return 'video/x-m4v';
  }
  return 'video/mp4';
}
