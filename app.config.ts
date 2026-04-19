import 'dotenv/config';
import { ExpoConfig } from 'expo/config';
import { ConfigPlugin, withEntitlementsPlist } from 'expo/config-plugins';

const appVariant = process.env.APP_VARIANT === 'test' ? 'test' : 'prod';
const isTestVariant = appVariant === 'test';
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
  android: {
    package: isTestVariant ? 'com.anonymous.GdjeIKadaNative.test' : 'com.anonymous.GdjeIKadaNative',
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
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
        backgroundColor: '#ffffff',
        dark: {
          backgroundColor: '#000000',
        },
      },
    ],
  ] as unknown as ExpoConfig['plugins'],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
