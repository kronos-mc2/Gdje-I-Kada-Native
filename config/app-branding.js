const { existsSync } = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

const BRAND_COLORS = {
  lightBackground: '#F0F0F0',
  darkBackground: '#111114',
  notificationAccent: '#8B5CF6',
};

const ICON_ASSETS = {
  appIcon: assetPath('assets/app-icons/app-icon.png', 'assets/images/icon.png'),
  iosLightIcon: assetPath('assets/app-icons/ios-light.png', 'assets/app-icons/app-icon.png', 'assets/images/icon.png'),
  iosDarkIcon: assetPath('assets/app-icons/ios-dark.png', 'assets/app-icons/app-icon.png', 'assets/images/icon.png'),
  iosTintedIcon: assetPath(
    'assets/app-icons/ios-tinted.png',
    'assets/app-icons/android-icon-monochrome.png',
    'assets/images/android-icon-monochrome.png',
    'assets/images/icon.png',
  ),
  androidLegacyIcon: assetPath('assets/app-icons/android-legacy.png', 'assets/app-icons/app-icon.png', 'assets/images/icon.png'),
  androidForegroundIcon: assetPath('assets/app-icons/android-icon-foreground.png', 'assets/images/android-icon-foreground.png'),
  androidBackgroundIcon: assetPath('assets/app-icons/android-icon-background.png', 'assets/images/android-icon-background.png'),
  androidMonochromeIcon: assetPath('assets/app-icons/android-icon-monochrome.png', 'assets/images/android-icon-monochrome.png'),
  androidNotificationIcon: assetPath(
    'assets/app-icons/android-notification.png',
    'assets/app-icons/android-icon-monochrome.png',
    'assets/images/android-icon-monochrome.png',
  ),
  splashLightIcon: assetPath('assets/app-icons/splash-light.png', 'assets/images/splash-icon.png'),
  splashDarkIcon: assetPath('assets/app-icons/splash-dark.png', 'assets/app-icons/splash-light.png', 'assets/images/splash-icon.png'),
  favicon: assetPath('assets/app-icons/favicon.png', 'assets/images/favicon.png'),
};

module.exports = {
  BRAND_COLORS,
  ICON_ASSETS,
};

function assetPath(...candidates) {
  const existing = candidates.find((candidate) => existsSync(path.join(projectRoot, candidate)));
  return `./${existing ?? candidates[candidates.length - 1]}`;
}
