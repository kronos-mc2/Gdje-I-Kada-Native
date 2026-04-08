import 'dotenv/config';
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Gdje-I-Kada-Native',
  slug: 'Gdje-I-Kada-Native',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'gdjeikadanative',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    bundleIdentifier: 'com.anonymous.GdjeIKadaNative',
    usesAppleSignIn: true,
    supportsTablet: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'Precizna lokacija se koristi za centriranje mape i prikaz dogadaja u tvojoj blizini.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'Lokacija se koristi za precizno centriranje mape i prikaz dogadaja u blizini.',
      NSLocationAlwaysUsageDescription: 'Lokacija se koristi za precizno centriranje mape i prikaz dogadaja u blizini.',
    },
  },
  android: {
    package: 'com.anonymous.GdjeIKadaNative',
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
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: true,
        },
      },
    ],
    '@maplibre/maplibre-react-native',
    '@react-native-community/datetimepicker',
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
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
