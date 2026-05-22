import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { LocalEventImage } from '@/core/types/domain';

export const MAX_EVENT_IMAGES = 5;
export const MAX_EVENT_IMAGE_BYTES = 5 * 1024 * 1024;
export const MIN_EVENT_IMAGE_WIDTH = 640;
export const MIN_EVENT_IMAGE_HEIGHT = 640;

const SUPPORTED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png']);
const SUPPORTED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png']);

export async function normalizePickedEventImage(asset: ImagePicker.ImagePickerAsset, fallbackName: string): Promise<LocalEventImage> {
  const originalName = getAssetFileName(asset, fallbackName);
  if (!shouldConvertToPng(asset, originalName)) {
    return {
      uri: asset.uri,
      name: originalName,
      type: asset.mimeType ?? guessImageMimeType(originalName),
      size: asset.fileSize,
      width: asset.width,
      height: asset.height,
    };
  }

  const converted = await ImageManipulator.manipulateAsync(
    asset.uri,
    [],
    {
      compress: 1,
      format: ImageManipulator.SaveFormat.PNG,
    },
  );
  const convertedName = `${stripImageExtension(originalName)}.png`;

  return {
    uri: converted.uri,
    name: convertedName,
    type: 'image/png',
    size: await getFileByteSize(converted.uri, asset.fileSize),
    width: converted.width,
    height: converted.height,
  };
}

export function isEventImageTooLarge(image: LocalEventImage) {
  return (image.size ?? 0) > MAX_EVENT_IMAGE_BYTES;
}

export function isEventImageResolutionTooSmall(image: LocalEventImage) {
  return (image.width ?? 0) < MIN_EVENT_IMAGE_WIDTH || (image.height ?? 0) < MIN_EVENT_IMAGE_HEIGHT;
}

function shouldConvertToPng(asset: ImagePicker.ImagePickerAsset, filename: string) {
  const extension = getFileExtension(filename);
  const mimeType = asset.mimeType?.toLowerCase();
  if (mimeType != null && SUPPORTED_IMAGE_MIME_TYPES.has(mimeType)) {
    return false;
  }
  if (mimeType?.startsWith('image/')) {
    return true;
  }
  return extension.length > 0 && !SUPPORTED_IMAGE_EXTENSIONS.has(extension);
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

function stripImageExtension(filename: string) {
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
}

function guessImageMimeType(name: string) {
  return name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
}

async function getFileByteSize(uri: string, fallbackSize?: number) {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob.size;
  } catch {
    return fallbackSize;
  }
}
