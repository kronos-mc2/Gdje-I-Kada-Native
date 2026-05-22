# Test Android APK

Test APK targeta backend URL iz `.env.test` ili EAS environment variables.

Env file:

```bash
cp .env.test.example .env.test
```

U `.env.test` postavi stvarni test API URL i Google OAuth client ID-jeve. Ta datoteka je ignorirana i ne ide u git.

Google auth koristi dva razlicita ID-a:

- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` je obavezan u app envu i mora biti isti ID koji backend ima u `AUTH_GOOGLE_CLIENT_IDS`.
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` sluzi kao referenca za Android OAuth client u Google Cloud/Firebase projektu, package name i SHA-1 certifikat. Taj ID se ne salje backendu u trenutnom native Google Sign-In toku.

Lokalni debug install na uredaj/emulator:

```bash
npm run android:test
```

Ako je test development build vec instaliran i pokreces samo Metro:

```bash
npm run start:test
```

Nemoj koristiti `npm start` za test app jer on ucitava obicni `.env` i moze poslati auth request na lokalni backend.

Lokalni APK build:

```bash
npm run build:android:test
```

APK output:

```text
android/app/build/outputs/apk/qa/release/app-qa-release.apk
```

EAS internal APK build:

```bash
npm run build:android:test:eas
```

EAS `test` profile u `eas.json` vec postavlja javni test API URL i Expo projectId za standalone APK build. `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` drzi kao EAS environment variable/secret za test build; app config ce za test variant failati rano ako taj Web client ID nije postavljen.

Local iPhone development build:

```bash
npm run ios:test
```

This requires Metro to stay running and iOS Local Network access to be allowed for `GIK Test`.

Local iPhone release build:

```bash
npm run ios:test:release
```

This embeds the JS bundle in the app and does not require Metro to be running after install.

`npm run ios`, `npm run ios:dev`, `npm run ios:test` i `npm run ios:test:release` automatski prepisuju `ios/.xcode.env.local` na odgovarajuci variant prije builda. iOS workspace sada ima dva schemea/targeta: `GIKDev` za lokalni backend i `GIKTest` za test backend.

When building the generated iOS workspace directly from Xcode without ovih npm skripti, make sure `ios/.xcode.env.local` contains:

```bash
export NODE_BINARY=/putanja/do/node
export APP_VARIANT=test
export EXPO_PUBLIC_API_BASE_URL=https://your-test-api.example.com/api
export EXPO_PUBLIC_ANDROID_API_BASE_URL=https://your-test-api.example.com/api
export IOS_USES_APPLE_SIGN_IN=false
```

Xcode script phases read this file while bundling JavaScript.

Test variant koristi:

- Android package: `com.anonymous.GdjeIKadaNative.test`
- iOS bundle id: `com.anonymous.GdjeIKadaNative.test`
- App label: `GIK Test`
- Deep link scheme: `gdjeikadanative-test`
- `IOS_USES_APPLE_SIGN_IN=false` by default so a personal Apple team can install it on a local iPhone.

To omogucava da test APK bude instaliran paralelno s normalnim buildom.



## IOS

```bash
npm run ios:test
```
