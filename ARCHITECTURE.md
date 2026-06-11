# Frontend Architecture

## Layers

- `app`: Expo Router screens and route groups. Route names and UX flows are contract-sensitive.
- `features`: screen models, hooks and feature-specific components.
- `components`: shared UI primitives and map/search/event building blocks.
- `core/api`: HTTP client, typed API services, React Query hooks and query keys.
- `core/store`: persisted auth/app state.
- `core/theme`, `core/i18n`, `core/cache`: shared theme, translations and local offline/cache utilities.

## API Layer

`core/api/http-client.ts` owns Axios configuration, base URL resolution and Bearer token injection. It also exposes typed `getData`, `postData`, `patchData` and `deleteData` helpers so service functions do not repeat Axios response unwrapping.

`core/api/services.ts` keeps endpoint paths and payloads unchanged. Query keys in `core/api/query-keys.ts` remain stable to avoid cache-breaking changes.

## Configuration

Runtime API URLs come from Expo config/env values:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_ANDROID_API_BASE_URL`
- `EXPO_PUBLIC_EAS_PROJECT_ID`
- Google sign-in client IDs and URL scheme values as documented in `.env.example`

Android `usesCleartextTraffic` is enabled only when the resolved API URL uses `http://`, which preserves local development while avoiding unnecessary production cleartext permission for HTTPS builds.

## Commands

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm start
```

For local backend development, keep `.env` based on `.env.example`. For test builds, use `.env.test` or EAS environment variables based on `.env.test.example`.
