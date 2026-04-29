# Test Android APK

Test APK targeta backend URL iz `.env.test` ili EAS environment variables.

Env file:

```bash
cp .env.test.example .env.test
```

U `.env.test` postavi stvarni test API URL i Google OAuth client ID-jeve. Ta datoteka je ignorirana i ne ide u git.

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

Za EAS build postavi `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_ANDROID_API_BASE_URL` i Google OAuth client ID-jeve kao EAS environment variables/secrets. `eas.json` namjerno ne sadrzi te vrijednosti.

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
