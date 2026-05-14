import 'dotenv/config';
import { ExpoConfig } from 'expo/config';
import { ConfigPlugin, withEntitlementsPlist } from 'expo/config-plugins';

const appVariant = process.env.APP_VARIANT === 'test' ? 'test' : 'prod';
const isTestVariant = appVariant === 'test';
const localApiBaseUrl = 'http://localhost:8080/api';
const requireEnvForTest = (name: string) => {
  const value = process.env[name]?.trim();
  if (isTestVariant && !value) {
    throw new Error(`${name} must be configured for test builds. Use .env.test locally or EAS environment variables.`);
  }

  return value;
};
const apiBaseUrl = (requireEnvForTest('EXPO_PUBLIC_API_BASE_URL') ?? localApiBaseUrl).trim();
const androidApiBaseUrl = (
  requireEnvForTest('EXPO_PUBLIC_ANDROID_API_BASE_URL') ?? (isTestVariant ? apiBaseUrl : 'http://10.0.2.2:8080/api')
).trim();
const usesAppleSignIn =
  process.env.IOS_USES_APPLE_SIGN_IN === 'true' || (!isTestVariant && process.env.IOS_USES_APPLE_SIGN_IN !== 'false');

const withoutAppleSignInEntitlement: ConfigPlugin = (config) =>
  withEntitlementsPlist(config, (configWithEntitlements) => {
    delete configWithEntitlements.modResults['com.apple.developer.applesignin'];
    return configWithEntitlements;
  });

const config: ExpoConfig = {
  name: isTestVariant ? 'GIK Test' : 'Gdje-I-Kada-Native',
  slug: isTestVariant ? 'Gdje-I-Kada-Native-Test' : 'Gdje-I-Kada-Native',
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
      NSLocationWhenInUseUsageDescription: 'Precizna lokacija se koristi za centriranje mape i prikaz dogadaja u tvojoj blizini.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'Lokacija se koristi za precizno centriranje mape i prikaz dogadaja u blizini.',
      NSLocationAlwaysUsageDescription: 'Lokacija se koristi za precizno centriranje mape i prikaz dogadaja u blizini.',
    },
  },
  androidNavigationBar: {
    backgroundColor: '#111114',
    barStyle: 'light-content',
    enforceContrast: false,
  },
  android: {
    package: isTestVariant ? 'com.anonymous.GdjeIKadaNative.test' : 'com.anonymous.GdjeIKadaNative',
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
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
  ] as unknown as ExpoConfig['plugins'],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    appVariant,
    apiBaseUrl,
    androidApiBaseUrl,
  },
};

export default config;
