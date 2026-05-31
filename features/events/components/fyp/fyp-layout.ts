import { Platform } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

const ANDROID_NATIVE_TAB_BAR_HEIGHT = 78;
const IOS_CONTENT_LIFT = 64;
const ANDROID_TAB_BAR_BOTTOM_GAP = 8;
const ANDROID_TAB_BAR_EXTRA_CLEARANCE = 8;
const ANDROID_TAB_BAR_MEASURED_TOLERANCE = 4;

export const FYP_HEADER_MAX_FONT_MULTIPLIER = 1.05;
export const FYP_CHIP_MAX_FONT_MULTIPLIER = 1;
export const FYP_REEL_TEXT_MAX_FONT_MULTIPLIER = 1.12;

export function getFypViewportHeight(windowHeight: number, _tabBarHeight: number) {
  if (Platform.OS !== 'android') {
    return Math.max(420, windowHeight);
  }

  return Math.max(420, windowHeight);
}

export function getFypBottomContentInset(insets: EdgeInsets, tabBarHeight: number) {
  if (Platform.OS === 'android') {
    const tabBarBottomOffset = Math.max(insets.bottom, 10) + ANDROID_TAB_BAR_BOTTOM_GAP;
    const visibleTabBarClearance = tabBarBottomOffset + ANDROID_NATIVE_TAB_BAR_HEIGHT;
    const measuredTabBarClearance = Number.isFinite(tabBarHeight) && tabBarHeight > 0 ? tabBarHeight : 0;
    const contextClearance = Math.min(measuredTabBarClearance, visibleTabBarClearance + ANDROID_TAB_BAR_MEASURED_TOLERANCE);

    return Math.max(visibleTabBarClearance, contextClearance) + ANDROID_TAB_BAR_EXTRA_CLEARANCE;
  }

  return insets.bottom + IOS_CONTENT_LIFT;
}

export function getFypDetailBottomInset() {
  return 0;
}

export function getEstimatedFypTabBarHeight(insets: EdgeInsets) {
  return ANDROID_NATIVE_TAB_BAR_HEIGHT + insets.bottom;
}
