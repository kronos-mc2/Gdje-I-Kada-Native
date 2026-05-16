import { Platform } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

const ANDROID_NATIVE_TAB_BAR_HEIGHT = 84;
const ANDROID_VIEWPORT_OVERLAP = 8;
const IOS_CONTENT_LIFT = 64;
const ANDROID_CONTENT_LIFT = 18;

export function getFypViewportHeight(windowHeight: number, tabBarHeight: number) {
  if (Platform.OS !== 'android') {
    return Math.max(420, windowHeight);
  }

  return Math.max(420, windowHeight - tabBarHeight + ANDROID_VIEWPORT_OVERLAP);
}

export function getFypBottomContentInset(insets: EdgeInsets) {
  if (Platform.OS === 'android') {
    return ANDROID_CONTENT_LIFT;
  }

  return insets.bottom + IOS_CONTENT_LIFT;
}

export function getFypDetailBottomInset() {
  return 0;
}

export function getEstimatedFypTabBarHeight(insets: EdgeInsets) {
  return ANDROID_NATIVE_TAB_BAR_HEIGHT + insets.bottom;
}
