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

Test variant koristi:

- Android package: `com.anonymous.GdjeIKadaNative.test`
- App label: `GIK Test`
- Deep link scheme: `gdjeikadanative-test`

To omogucava da test APK bude instaliran paralelno s normalnim buildom.



## IOS

```bash
node ./scripts/with-env.js test npx expo run:ios --device
```