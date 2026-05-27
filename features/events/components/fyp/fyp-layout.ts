import { Platform } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

const ANDROID_NATIVE_TAB_BAR_HEIGHT = 84;
const IOS_CONTENT_LIFT = 64;
const ANDROID_CONTENT_LIFT = 116;

export function getFypViewportHeight(windowHeight: number, _tabBarHeight: number) {
  if (Platform.OS !== 'android') {
    return Math.max(420, windowHeight);
  }

  return Math.max(420, windowHeight);
}

export function getFypBottomContentInset(insets: EdgeInsets) {
  if (Platform.OS === 'android') {
    return insets.bottom + ANDROID_CONTENT_LIFT;
  }

  return insets.bottom + IOS_CONTENT_LIFT;
}

export function getFypDetailBottomInset() {
  return 0;
}

export function getEstimatedFypTabBarHeight(insets: EdgeInsets) {
  return ANDROID_NATIVE_TAB_BAR_HEIGHT + insets.bottom;
}
