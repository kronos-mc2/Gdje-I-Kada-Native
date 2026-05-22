require('dotenv/config');

const { existsSync } = require('node:fs');
const { withEntitlementsPlist } = require('expo/config-plugins');

const appVariant = process.env.APP_VARIANT === 'test' ? 'test' : 'prod';
const isTestVariant = appVariant === 'test';
const localApiBaseUrl = 'http://localhost:8080/api';

const requireEnvForTest = (name) => {
  const value = process.env[name]?.trim();
  if (isTestVariant && !value) {
    throw new Error(`${name} must be configured for test builds. Use .env.test locally or EAS environment variables.`);
  }

  return value;
};

// EAS needs this available even for commands that do not load a build profile env,
// for example `eas build:run`. The project id is public metadata, not a secret.
const easProjectId = normalizeConfigValue(process.env.EXPO_PUBLIC_EAS_PROJECT_ID) || '132bf46c-0ba1-4050-8844-fdf9c7683518';
const apiBaseUrl = (requireEnvForTest('EXPO_PUBLIC_API_BASE_URL') ?? localApiBaseUrl).trim();
const androidApiBaseUrl = (
  requireEnvForTest('EXPO_PUBLIC_ANDROID_API_BASE_URL') ?? (isTestVariant ? apiBaseUrl : 'http://10.0.2.2:8080/api')
).trim();

if (isTestVariant && !easProjectId) {
  throw new Error('EXPO_PUBLIC_EAS_PROJECT_ID must be configured for test builds. Use .env.test locally or EAS environment variables.');
}

const googleServicesFile =
  process.env.GOOGLE_SERVICES_JSON_PATH?.trim() || (existsSync('./google-services.json') ? './google-services.json' : undefined);
const googleIosUrlScheme = resolveGoogleIosUrlScheme(process.env.GOOGLE_IOS_URL_SCHEME ?? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);
const googleSignInPlugin = googleIosUrlScheme
  ? [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme: googleIosUrlScheme,
      },
    ]
  : '@react-native-google-signin/google-signin';
const usesAppleSignIn =
  process.env.IOS_USES_APPLE_SIGN_IN === 'true' || (!isTestVariant && process.env.IOS_USES_APPLE_SIGN_IN !== 'false');

const withoutAppleSignInEntitlement = (config) =>
  withEntitlementsPlist(config, (configWithEntitlements) => {
    delete configWithEntitlements.modResults['com.apple.developer.applesignin'];
    return configWithEntitlements;
  });

const config = {
  name: isTestVariant ? 'GIK Test' : 'Gdje-I-Kada-Native',
  slug: 'Gdje-I-Kada-Native',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: isTestVariant ? 'gdjeikadanative-test' : 'gdjeikadanative',
  userInterfaceStyle: 'automatic',
  // Android dependencies (`react-native-reanimated` / `react-native-worklets`) require the new architecture.
  // iOS native folder is temporarily held on the old architecture through `ios/Podfile.properties.json`
  // until the strengthened `react-native-maps` patch is validated on-device.
  newArchEnabled: true,
  ios: {
    bundleIdentifier: isTestVariant ? 'com.anonymous.GdjeIKadaNative.test' : 'com.anonymous.GdjeIKadaNative',
    usesAppleSignIn,
    supportsTablet: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'Precizna lokacija se koristi za centriranje mape i prikaz događaja u tvojoj blizini.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'Lokacija se koristi za precizno centriranje mape i prikaz događaja u blizini.',
      NSLocationAlwaysUsageDescription: 'Lokacija se koristi za precizno centriranje mape i prikaz događaja u blizini.',
    },
  },
  androidNavigationBar: {
    backgroundColor: '#111114',
    barStyle: 'light-content',
    enforceContrast: false,
  },
  android: {
    package: isTestVariant ? 'com.anonymous.GdjeIKadaNative.test' : 'com.anonymous.GdjeIKadaNative',
    ...(googleServicesFile ? { googleServicesFile } : {}),
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION', 'POST_NOTIFICATIONS'],
    adaptiveIcon: {
      backgroundColor: '#F0F0F0',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    softwareKeyboardLayoutMode: 'resize',
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-video',
    [
      'expo-notifications',
      {
        color: '#8B5CF6',
        defaultChannel: 'messages',
        enableBackgroundRemoteNotifications: false,
      },
    ],
    [
      'expo-build-properties',
      {
        ios: {
          buildReactNativeFromSource: true,
        },
        android: {
          usesCleartextTraffic: true,
        },
      },
    ],
    '@maplibre/maplibre-react-native',
    '@react-native-community/datetimepicker',
    googleSignInPlugin,
    ...(usesAppleSignIn ? [] : [withoutAppleSignInEntitlement]),
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#F0F0F0',
        dark: {
          backgroundColor: '#111114',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    appVariant,
    apiBaseUrl,
    androidApiBaseUrl,
    appleSignInEnabled: usesAppleSignIn,
    eas: easProjectId
      ? {
          projectId: easProjectId,
        }
      : undefined,
  },
};

module.exports = config;

function resolveGoogleIosUrlScheme(value) {
  const normalized = normalizeConfigValue(value);
  if (!normalized) {
    return undefined;
  }

  if (normalized.startsWith('com.googleusercontent.apps.')) {
    return normalized;
  }

  const clientIdSuffix = '.apps.googleusercontent.com';
  if (normalized.endsWith(clientIdSuffix)) {
    return `com.googleusercontent.apps.${normalized.slice(0, -clientIdSuffix.length)}`;
  }

  return undefined;
}

function normalizeConfigValue(value) {
  const normalized = value?.trim();
  if (!normalized || normalized.startsWith('your-')) {
    return undefined;
  }

  return normalized;
}
