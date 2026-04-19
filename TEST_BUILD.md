# Test Android APK

Test APK targeta backend:

- `https://test-api-gik.nerizz.com/api`

Env file:

```bash
cp .env.test.example .env.test
```

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

When building the generated iOS workspace directly from Xcode, make sure `ios/.xcode.env.local` contains:

```bash
export APP_VARIANT=test
export EXPO_PUBLIC_API_BASE_URL=https://test-api-gik.nerizz.com/api
export EXPO_PUBLIC_ANDROID_API_BASE_URL=https://test-api-gik.nerizz.com/api
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
node ./scripts/with-env.js test npx expo run:ios --device
```
