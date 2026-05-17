# Gdje i Kada - fazni plan rada

Status dokumenta: 2026-05-17
Lokacija master dokumentacije: `README.md`

## Pravilo rada po fazama

Prije svake vece promjene odaberi aktivnu fazu u ovom dokumentu i oznaci je kao `U tijeku`. Nakon zavrsenog rada azuriraj:

- status faze
- checklistu zavrsenih stavki
- poznate blokere ili odluke
- `README.md` ako se promijenio proizvod, API, baza, navigacija, arhitektura ili trenutno stanje aplikacije

Kad je faza rijesena, obavezno joj promijeni status u `Rijeseno` i dodaj kratku biljesku sto je tocno napravljeno. Rijesene faze se kasnije ne rade ponovno osim ako se u dokumentu eksplicitno otvori nova dopuna ili regresija.

Dokumentacija je dio zadatka, ne naknadni posao. Ako kod i dokumentacija nisu uskladeni, dokumentacija se smatra zastarjelom.

## Status faza

| Faza | Naziv | Status | Cilj |
| --- | --- | --- | --- |
| 0 | Dokumentacija i smjer | Rijeseno | README i FAZE definiraju sto se gradi i kojim redom. |
| 1 | Glavni tabovi i navigacija | Rijeseno | App ima tocnih 5 tabova: Mapa, FYP, Kalendar, Poruke, Profil. |
| 2 | Event domain i baza | Rijeseno | Event model pokriva creator, lokaciju, ulaz, visibility, join pravila i media. |
| 3 | Mapa MVP+ | Rijeseno | Mapa ima search, date filter, nearby logiku, detalje i join flow. |
| 4 | Join state i event details | Rijeseno | Join/leave i detalji su server-side i dijele se izmedu mape, FYP-a i kalendara. |
| 5 | Reels/FYP | Rijeseno | FYP radi kao reels feed s media preloadom, likeovima i shareom. |
| 6 | Kalendar | Rijeseno | Kalendar prikazuje joined evente u mjesecnom gridu. |
| 7 | Poruke i event chat | Rijeseno | Poruke imaju chat roomove, event grupe, event share card i pollove. |
| 8 | Profil i postavke | Rijeseno | Profil ima edit, history, liked history, transactions i settings screen. |
| 9 | Placanja, rating i polish | U tijeku | Paid eventi, transaction history, organizer rating i zavrsni UX polish. |
| 10 | FYP preference, tags, friends i message security | Rijeseno | Not interested preference, event tagovi, friend request flow, encryption-at-rest i map details sheet dorada. |

## Faza 0 - Dokumentacija i smjer

Status: Rijeseno

Cilj:

- Imati jasan master README koji opisuje aplikaciju, trenutni kod, bazu, API i sto fali.
- Imati operativni fazni plan u ovom dokumentu.
- Dogovoriti pravilo da se README i FAZE azuriraju nakon svake bitne promjene.

Gotovo:

- [x] README opisuje trenutni frontend i backend.
- [x] README opisuje planirane tabove i funkcionalnosti.
- [x] README opisuje trenutnu i ciljanu bazu.
- [x] FAZE dokument je dodan uz README.
- [x] U README je dodano pravilo o obaveznom updateu dokumentacije.

Zavrsna biljeska:

2026-04-18 - Napravljeno: README i FAZE su uspostavljeni kao obavezna projektna dokumentacija, s pravilom da se azuriraju nakon svake bitne promjene. Datoteke: `README.md`, `FAZE.md`. Testirano: dokumentacijska provjera.

Dopuna:

2026-04-26 - Napravljeno: uveden je osnovni automatizirani quality gate za oba odvojena repozitorija. Frontend repo `Gdje-I-Kada-Native` dobio je Jest (`jest-expo`) unit test setup za `selectEvents`, `formatEventDate`, `LocationSearchService` i `NominatimLocationSearchProvider`, plus GitHub Actions workflow koji na svaki `push` i `pull_request` vrti `npm ci`, `npm run lint`, `npm run typecheck` i `npm test`. Backend repo `backend` dobio je dodatne unit testove za `PasswordPolicy` i `JwtService`, plus zaseban GitHub Actions workflow koji na svaki `push` i `pull_request` vrti `./mvnw test`. Datoteke: frontend `package.json`, `jest.config.cjs`, `*.test.ts`, `.github/workflows/frontend-ci.yml`, `README.md`, `FAZE.md`; backend `src/test/java/hr/kronos/backend/auth/*.java`, `.github/workflows/backend-ci.yml`, `README.md`. Testirano: lokalno pokretanje frontend i backend CI komandi.

## Faza 1 - Glavni tabovi i navigacija

Status: Rijeseno

Cilj:

App mora imati tocno pet glavnih tabova:

1. Mapa
2. FYP
3. Kalendar
4. Poruke
5. Profil

Postojece stanje:

- `app/(tabs)/_layout.tsx` koristi `NativeTabs`.
- `index` ima label `map` i proizvodno se tretira kao `Mapa`.
- `fyp`, `calendar` i `profile` postoje.
- `messages.tsx` je glavni tab za `Poruke`.
- `social.tsx` trenutno kombinira conversations i friends, ali vise nije glavni tab; ostaje kao prototip/sekundarni ekran za kasniju odluku.

Zadaci:

- [x] Promijeniti label/translation za `index` u `Mapa`.
- [x] U tab layoutu zamijeniti `social` trigger s `messages`.
- [x] Odluciti sto s `social.tsx`: ostaje kao prototip/sekundarni ekran, ali vise nije dio glavnog tab bara.
- [x] Dodati/azurirati i18n kljuceve u `core/i18n/translations.ts`.
- [x] Provjeriti da auth routing i tab routing i dalje rade.
- [x] Azurirati README nakon promjene.

Definition of done:

- Donji tab bar pokazuje samo: Mapa, FYP, Kalendar, Poruke, Profil.
- Nema vidljivog `Social` taba.
- Postojeci screens se i dalje otvaraju bez crasha.

Zavrsna biljeska:

2026-04-18 - Napravljeno: `app/(tabs)/_layout.tsx` sada koristi tocnih pet glavnih tabova: `index`/Mapa, `fyp`, `calendar`, `messages`/Poruke i `profile`; `social` vise nije glavni tab. Dodani su i18n kljucevi `map` i `calendar`. Datoteke: `app/(tabs)/_layout.tsx`, `core/i18n/translations.ts`, `README.md`, `FAZE.md`. Testirano: `npm run lint` prolazi bez errora; postoje 2 ranija warninga u `app/(tabs)/fyp.tsx` za nekoristene varijable.

## Faza 2 - Event domain i baza

Status: Rijeseno

Cilj:

Event treba iz prototip modela prerasti u pravi domain model za public/friends evente, waitlist, paid/open attendance, media, creator i rating.

Postojece stanje:

- Baza ima `events`, `event_media`, `event_participants`, `event_likes`, `event_organizer_ratings`, `friends`, `conversations`, `app_users`.
- `events.event_type` je prototip filter (`nearby`, `joined`, `created`), ne pravi domain tip.
- `visibility` je normaliziran na `public` i `friends`.
- Frontend create flow salje `entranceCoordinates` i `entryInstructions`.

Zadaci backend:

- [x] Dodati Flyway migraciju za nova event polja:
  - `creator_user_id`
  - `address`
  - `start_at`
  - `end_at`
  - `attendance_mode`
  - `price_amount`
  - `price_currency`
  - `capacity`
  - `status`
  - `organizer_rating_average`
  - `organizer_rating_count`
  - `updated_at`
- [x] Normalizirati `visibility` prema `public` i `friends`.
- [x] Dodati `event_media`.
- [x] Dodati `event_participants`.
- [x] Dodati `event_likes`.
- [x] Dodati `event_organizer_ratings`.
- [x] Prosiriti `EventRow`, `AppEventDto`, `CreateEventRequest`.
- [x] Prosiriti `EventMapper.xml`.
- [x] Prosiriti `EventService` validaciju.

Zadaci frontend:

- [x] Prosiriti `AppEvent` i `CreateEventPayload`.
- [x] U create event flow dodati visibility, attendance mode, cijenu ako je paid, entrance pin i entry instructions.
- [x] Povezati `entrance-map-picker.tsx` s `create-event.tsx`.
- [x] Ukloniti random offset kao stalno ponasanje create flowa.

Definition of done:

- Novi event se sprema s creatorom, adresom, vremenima, visibilityjem, attendance modeom i entrance podacima.
- Frontend i backend dijele isti model.
- Flyway migracije prolaze na svjezoj bazi.

Zavrsna biljeska:

2026-04-18 - Napravljeno: dodana je Flyway migracija `V4__expand_event_domain.sql`, prosiren je backend event model (`AppEventDto`, `CreateEventRequest`, `EventRow`, `EventService`, `EventMapper.xml`) i `POST /api/events` sada sprema `creator_user_id`, address, start/end time, `public/friends` visibility, attendance mode, paid price/currency, capacity, status, organizer rating defaults i creator participant row. Frontend `AppEvent`/`CreateEventPayload` su prosireni, `create-event.tsx` sada salje nova polja, koristi `entrance-map-picker.tsx`, i vise ne koristi random coordinate offset. Datoteke: backend event DTO/service/mapper/migration, `core/types/domain.ts`, `app/create-event.tsx`, `app/event/[id].tsx`, `core/i18n/translations.ts`, `README.md`, `FAZE.md`. Testirano: backend `export JAVA_HOME=$(/usr/libexec/java_home) && ./mvnw test`, frontend `npx tsc --noEmit`, frontend `npm run lint`.

## Faza 3 - Mapa MVP+

Status: Rijeseno

Cilj:

Mapa postaje primarni discovery ekran: search gore, date filter ispod, mapa u fokusu, event pinovi oko korisnika, detalji i join flow.

Postojece stanje:

- `EventsMapExperience` vec rendera search, mapu, recenter button i `EventDetailSheet`.
- `useMapLocationBootstrap` vec rjesava precise location i fallback.
- Android ima MapLibre marker surface bez automatskog clusteriranja.
- iOS ima MapKit i Liquid Glass search/sheet.

Zadaci:

- [x] Dodati date filter UI odmah ispod search bara.
- [x] Prosiriti `useEventsQuery` da prima query parametre.
- [x] Backend `/api/events` dodati `from`, `to`, `lat`, `lng`, `radiusKm`, `query`.
- [x] Dodati nearby sortiranje ili radius filter.
- [x] U detaljima prikazati entrance pin i entry instructions.
- [x] U detaljima prikazati media preview.
- [x] U detaljima prikazati organizer rating.
- [x] Dodati join/leave CTA u map detail sheet.
- [x] Nakon joina pitati korisnika zeli li otvoriti event chat.
- [x] Zadrzati iOS Liquid Glass na search/filter/sheet povrsinama.

Definition of done:

- Korisnik vidi evente oko sebe i moze filtrirati po datumu.
- Klik na pin otvara detalje s korisnim informacijama.
- Join radi kroz backend, ne samo lokalni store.

Zavrsna biljeska:

2026-04-18 - Napravljeno: mapa sada salje backendu `from`, `to`, `lat`, `lng`, `radiusKm` i `query` kroz `useEventsQuery(params)`, prikazuje date filter ispod search bara i ima `+` floating gumb iznad recenter gumba za otvaranje create event flowa. Date filter podrzava strelice za dan po dan, native date picker modal, range mode i `Svi datumi`. Backend `GET /api/events` filtrira public/published evente po datumu, radiusu i search queryju te sortira po udaljenosti kad su poslane koordinate. `EventDetailSheet` prikazuje cover/media preview, attendance, entrance podatke, cijenu/kapacitet, organizer rating i join/leave CTA. Nakon uspjesnog joina korisnik dobiva prompt za otvaranje Poruka. Datoteke: `app/(tabs)/index.tsx`, `features/events/hooks/use-events-map-screen-model.ts`, `features/events/components/events-map-experience.tsx`, `features/events/components/map-date-filter-control.tsx`, `components/map/event-detail-sheet.tsx`, `core/api/query-hooks.ts`, `core/api/services.ts`, `core/types/domain.ts`, `core/i18n/translations.ts`, backend `EventController`, `EventService`, `EventMapper`, `EventMapper.xml`, `AppEventDto`, `EventRow`, `README.md`, `FAZE.md`. Testirano: backend `export JAVA_HOME=$(/usr/libexec/java_home) && ./mvnw test`, frontend `npx tsc --noEmit`, frontend `npm run lint`. Faza 3 je zatvorena i ne radi se ponovno bez nove dopune ili regresije.

Dopuna:

2026-04-29 - Maknuto je automatsko Android clusteriranje event pinova. `components/map/event-map-surface.android.tsx` sada rendera pojedinacne `PointAnnotation` markere iz validnih event coordinates, a `supercluster`, `@types/supercluster` i transitive `kdbush` su uklonjeni iz dependency zapisa. Test/build nije pokretan po dogovoru.

2026-05-16 - Rijesena je mobile regresija user lokacije na mapi. `locationSource` se vise ne persistira bez stvarne lokacije, location bootstrap odmah trazi native permission i prvo koristi last-known device fix pa ga rafinira svjezim fixom, iOS/Android vise ne crtaju korisnika kao custom marker nego koriste native MapKit/MapLibre user location layer. Dodan je accuracy krug oko korisnika kad SDK vrati preciznost, pocetni auto-center koristi blazi zoom od rucnog recenter gumba, a recenter gumb je zakljucan dok permission/location/focus akcija ne zavrsi. Datoteke: `core/store/app-store.ts`, `core/types/domain.ts`, `core/maps/location-accuracy.ts`, `core/maps/map-config.ts`, `features/events/hooks/use-map-location-bootstrap.ts`, `features/events/components/events-map-experience.tsx`, `components/map/event-map.tsx`, `components/map/types.ts`, `components/map/event-map-surface.ios.tsx`, `components/map/event-map-surface.android.tsx`, `app/entrance-map-picker.tsx`, `README.md`, `FAZE.md`. Test/build nije pokretan po dogovoru.

## Faza 4 - Join state i shared event details

Status: Rijeseno

Cilj:

Event details i join state trebaju biti isti kroz mapu, FYP, kalendar i direct details screen.

Zadaci backend:

- [x] `GET /api/events/{id}`.
- [x] `POST /api/events/{id}/join`.
- [x] `DELETE /api/events/{id}/join`.
- [x] `GET /api/users/me/events`.
- [x] Vracati `joinedByMe`, `attendanceStatus` i `canJoin` kroz `/api/events`.
- `likedByMe` ostaje za Fazu 5 kad se uvede server-side like model.

Zadaci frontend:

- [x] Napraviti shared event details komponentu koja se koristi na mapi, FYP-u i `event/[id]`.
- [x] Zamijeniti lokalni `joinedEventIds` server stateom gdje god je bitno.
- [x] Ostaviti lokalni optimistic update samo ako se odmah sinkronizira s backendom.
- [x] Nakon join responsea otvoriti prompt za event chat ako postoji.

Definition of done:

- Join/leave je per-user i prezivi restart aplikacije.
- Svi ekrani prikazuju isti status eventa.

Zavrsna biljeska:

2026-04-24 - Napravljeno: dodani su canonical endpointi `GET /api/events/{id}` i `GET /api/users/me/events?filter=all|joined|created`, mapa i `app/event/[id].tsx` sada dijele `EventDetailsContent` i `useEventJoinActions`, kalendar vise ne koristi lokalni `joinedEventIds`, a iOS marker je uskladen s Android custom badge izgledom. `GET /api/events/{id}` vraca entrance podatke, per-user join state i `event_media` listu kad postoji. Security hardening: detail/join vise ne otkrivaju ili dopustaju pristup private/friends eventu samo preko pogodjenog ID-a; pristup je sada ogranicen na creatora ili postojece aktivne sudionike dok se ne uvede pravi friends access layer. `JwtService` defaultni access token skracen je na 7 dana uz hard cap od 30 dana. Datoteke: backend `EventController`, `EventService`, `EventMapper`, `EventMapper.xml`, `AppEventDto`, novi `EventMediaDto`/`EventMediaRow`, frontend `core/api/*`, `app/event/[id].tsx`, `app/(tabs)/calendar.tsx`, `components/map/event-detail-sheet.tsx`, `features/events/components/event-details-content.tsx`, `features/events/hooks/use-event-join-actions.ts`, `components/map/map-marker-badge.tsx`, `README.md`, `FAZE.md`, `KANBAN-INDEX.md`. Testirano: backend `export JAVA_HOME=$(/usr/libexec/java_home) && ./mvnw test`, frontend `npx tsc --noEmit`, frontend `npm run lint`. Faza 4 je zatvorena i ne radi se ponovno bez nove dopune ili regresije.

Dopuna:

2026-04-19 - Rijesena auth persistence regresija prije nastavka Faze 4: `core/store/auth-store.ts` sada koristi stabilni SecureStore keychain service, iOS `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`, cita legacy SecureStore zapis i AsyncStorage mirror te migrira validnu fallback sesiju natrag u primarni SecureStore zapis. Auth snapshot se zapisuje u SecureStore i AsyncStorage na svim buildovima da login prezivi cold start lokalno, na test buildu i produkciji. Lokalni Android native projekt dobio je SecureStore backup exclusion pravila u manifestu i XML resursima. Testirano prije zadnje univerzalne dorade: `npx tsc --noEmit`, `npm run lint`, `env JAVA_HOME=$(/usr/libexec/java_home) ./android/gradlew -p android :app:processQaReleaseMainManifest`, `env JAVA_HOME=$(/usr/libexec/java_home) npm run build:android:test`. Nakon zadnje dorade build/test nije pokretan po dogovoru.

2026-04-20 - Dopuna dijagnostike: `auth-store.ts` sada pamti marker ranije uspjesne prijave i vraca poruku s razlogom ako se nijedan storage izvor ne moze ucitati nakon cold starta. Login ekran prikazuje taj modal jednom, a login flow odvojeno javlja kada API prijava prodje, ali spremanje sesije padne. Test/build nije pokretan po dogovoru.

2026-04-25 - Dopuna native stabilnosti: lokalni iOS crash report za `GdjeIKadaNative` pokazuje abort u `AIRMap.m` (`insertReactSubview:atIndex:`) pri launchu mape pod React Native New Architecture. `react-native-maps` postinstall patch je prosiren tako da uz `nil` child guard normalizira i `atIndex` prije rekurzivnih child insertova i `_reactSubviews` insert-a. Android `MainActivity` deep-link filter je ociscen od literalnog `${appAuthRedirectScheme}` placeholdera koji je zbunjivao Expo CLI pri `run:android`, a login screen sada koristi varijantno-ispravan redirect scheme (`gdjeikadanative` / `gdjeikadanative-test`). Android ostaje na `newArchEnabled=true` jer `react-native-reanimated` i `react-native-worklets` to zahtijevaju; iOS native projekt je privremeno zadrzan na `old architecture` kroz `ios/Podfile.properties.json` dok se patch ne potvrdi na uredaju/simulatoru. Testirano: `npm run lint`, `npx expo config --type introspect`, `env JAVA_HOME=/Users/dgulic/.jdks/amazon-corretto-21.jdk/Contents/Home ./gradlew app:assembleProdDebug -x lint -x test --configure-on-demand --build-cache -PreactNativeDevServerPort=8081 -PreactNativeArchitectures=arm64-v8a`.

2026-04-25 - Dopuna iOS env switchinga: dodan je `scripts/run-ios.js` koji prije `expo run:ios` automatski prepisuje `ios/.xcode.env.local` prema aktivnom variantu. `npm run ios` / `npm run ios:dev` sada uvijek pripreme lokalni `prod` env (`localhost` backend), a `npm run ios:test` / `npm run ios:test:release` test env. Time vise ne ostaje slucajno zalijepljen `APP_VARIANT=test` nakon zadnjeg test builda. Datoteke: `scripts/run-ios.js`, `package.json`, `README.md`, `TEST_BUILD.md`, `FAZE.md`. Testirano: `node ./scripts/run-ios.js --help` nije primjenjivo; validacija kroz citanje generiranog `ios/.xcode.env.local` i `npm run lint`.

2026-04-30 - Rijesena auth session cache regresija: `useAuthStore.setAuth()` i `clearAuth()` sada resetiraju React Query cache kroz novi `core/query/session-query-state.ts`, pa se per-user server state (`liked-events`, chatovi, join/like state u event/feed queryjima) vise ne zadrzava nakon odjave i automatske prijave novog korisnika kroz registraciju. Datoteke: `core/store/auth-store.ts`, `core/query/session-query-state.ts`, `README.md`, `FAZE.md`. Test/build nije pokretan po dogovoru.

## Faza 5 - Reels/FYP

Status: Rijeseno

Cilj:

FYP treba raditi kao pravi reels feed za event discovery.

Postojece stanje:

- `app/(tabs)/fyp.tsx` ima vertikalni paged `FlatList`.
- Koristi static cover image preko Picsum.
- Like/favorite/joined su lokalni.

Zadaci:

- [x] Ukloniti bookmark/favorite UI jer finalni zahtjev nema saveanje.
- [x] Dodati backend like/unlike.
- [x] Dodati feed pagination (`cursor`, `limit`).
- [x] Dodati media model za video/image.
- [x] Implementirati video player i preload nekoliko itema unaprijed.
- [x] Otvarati isti event details kao mapa.
- [x] Share ponuditi prema chatovima i native share kao fallback.
- [x] Liked history povezati s profilom.

Definition of done:

- Feed je paginiran, like je server-side, details su konzistentni, nema save/bookmark akcije.

Zavrsna biljeska:

2026-04-25 - Napravljeno: `FYP` je prebacen na paginirani reels feed preko `GET /api/feed?cursor=&limit=` i `useInfiniteQuery`, uklonjen je bookmark/save UI, like/unlike je server-side preko `POST/DELETE /api/events/{id}/like`, a `AppEvent` sada nosi `likeCount`, `likedByMe` i `media`. Frontend koristi `expo-video` za autoplay/preload video itema, FYP otvara isti `EventDetailSheet` kao mapa, share ide kroz picker koji nudi postojece razgovore i native share fallback, a profil prikazuje `liked events` history preko `GET /api/users/me/liked-events`. Backend feed je prosiren cursor paginacijom, batch media lookupom i like agregatima; dodan je i prijelazni `POST /api/messages/conversations/{id}/share-event` koji azurira conversation preview bez ulaska u puni chat domain iz Faze 7. Datoteke: frontend `app/(tabs)/fyp.tsx`, `app/(tabs)/profile.tsx`, `app/event/[id].tsx`, `components/map/event-detail-sheet.tsx`, `features/events/components/*`, `core/api/*`, `core/events/event-cover.ts`, `core/types/domain.ts`, `core/i18n/translations.ts`, `app.config.ts`, backend `EventController`, `EventService`, `EventMapper`, `EventMapper.xml`, `EventRow`, `AppEventDto`, `FeedPageDto`, `MessageController`, `MessageService`, `MessageMapper`, `DevEventSeedConfig`, `README.md`, `FAZE.md`, `backend/README.md`. Testirano: nije pokretano po dogovoru.

Dopuna:

2026-04-25 - Sanirana regresija za razvojne buildove bez `ExpoVideo` native modula: `features/events/components/fyp-reel-slide.tsx` vise ne radi staticki import `expo-video`, nego koristi sigurni runtime fallback na poster image kad native modul nije dostupan. Time `app/(tabs)/fyp.tsx` ponovno uredno registrira route i nestaju sekundarni router warningi o nedostajucem `fyp` tabu i `default exportu`. Dokumentacija azurirana u `README.md` i `FAZE.md`. Testirano: `npm run lint`.

2026-05-16 - Dopuna FYP polish: feed event DTO sada vraca `creatorName` i `creatorAvatarUrl` za organizer prikaz bez dodatnog requesta. FYP UI je razdvojen u `features/events/components/fyp/` na layout helper, video layer, summary card, action rail i FYP-specific details sheet. Donji overlay je kompaktniji, like/share su desno, Android viewport oduzima native tab bar visinu uz mali media overlap da ne ostane crni razmak iznad toolbara, dok card/action rail ostaju dignuti iznad taba; iOS zadrzava full-bleed media uz dignut overlay. Globalni tamni scrim preko slike je maknut i top badge vise ne prikazuje `PHOTO/VIDEO`, nego samo datum i joined status. Details iz FYP-a sada otvara bottom sheet unutar native modala preko native taba, s handle barom, drag-down zatvaranjem i scrollable shared `EventDetailsContent`; Android modal root je wrapan u `GestureHandlerRootView`, a Android background ne koristi `BlurView`. Summary card je tappable i ima chevron-up indikator. Shared details redovi sada odvojeno prikazuju datum, vrijeme i trajanje. `ProfileAvatar` fallback inicijal se skalira prema velicini avatara da mali FYP/chat avatari ne prelamaju tekst. Datoteke: frontend `app/(tabs)/fyp.tsx`, `features/events/components/fyp/*`, `features/events/components/fyp-reel-slide.tsx`, `features/events/components/event-details-content.tsx`, `features/profile/components/profile-avatar.tsx`, `core/types/domain.ts`, `core/utils/date.ts`, `core/i18n/translations.ts`; backend `AppEventDto`, `EventRow`, `EventService`, `EventMapper.xml`; `README.md`, `backend/README.md`, `FAZE.md`. Testirano: nisu pokretani testovi, typecheck ni build po dogovoru.

## Faza 6 - Kalendar

Status: Rijeseno

Cilj:

Kalendar prikazuje samo evente na koje se korisnik pridruzio, u mjesecnom gridu.

Postojece stanje:

- `calendar.tsx` koristi joined-only mjesecni grid kroz `features/calendar/components/joined-events-calendar.tsx`.
- Koristi backend `GET /api/users/me/events?filter=joined`.

Zadaci:

- [x] Maknuti `all` i `created` filtere iz glavnog kalendara ako ne trebaju finalnom zahtjevu.
- [x] Koristiti backend `GET /api/users/me/events`.
- [x] Napraviti monthly calendar grid.
- [x] Default je aktualni mjesec.
- [x] Dodati next/previous month.
- [x] Prikazati title eventa unutar dana.
- [x] Klik na event/dan otvara event details.

Definition of done:

- Kalendar prikazuje samo joined evente i radi kao mjesecni pregled.

Zavrsna biljeska:

2026-04-29 - Napravljeno: kalendar je prebacen na joined-only mjesecni prikaz preko `react-native-calendars`, s HR/EN localeom, aktualnim mjesecom po defaultu, prethodni/sljedeci mjesec navigacijom, searchom gore desno, gumbom za povratak na danas, Samsung-like oznakama eventova po danima i listom eventova za odabrani dan. Klik na dan s jednim eventom ili na event row otvara shared `event/[id]` details. Backend nije mijenjan jer `GET /api/users/me/events?filter=joined` vec vraca potreban model. Datoteke: `app/(tabs)/calendar.tsx`, `features/calendar/components/joined-events-calendar.tsx`, `features/calendar/utils/calendar-date.ts`, `core/i18n/translations.ts`, `package.json`, `package-lock.json`, `README.md`, `FAZE.md`. Testirano: `npm run typecheck`, `npm run lint` (prolazi uz postojeci warning u `components/map/event-detail-sheet.tsx` za `require()` import). Build/native run nije pokretan po dogovoru.

## Faza 7 - Poruke i event chat

Status: Rijeseno

Cilj:

Poruke pokrivaju privatne poruke, grupe, event grupe, pollove i admin-only chat mode.

Postojece stanje:

- Backend sada ima puni chat domain uz legacy `conversations` adapter.
- Frontend ima chat room listu, chat screen, details panel, pollove i event share card.

Zadaci backend:

- [x] Dodati `chat_rooms`.
- [x] Dodati `chat_members`.
- [x] Dodati `messages`.
- [x] Dodati `message_reads`.
- [x] Dodati `polls`, `poll_options`, `poll_votes`.
- [x] Dodati role: owner/admin/member.
- [x] Dodati admin-only permission rules.
- [x] Dodati event share message type.

Zadaci frontend:

- [x] Chat room list.
- [x] Chat room screen.
- [x] Slanje text messagea.
- [x] Event share card u chatu: slika, naslov, kratki opis, link na details.
- [x] Poll prikaz i glasanje.
- [x] UI za admin-only mode.
- [x] Event chat prompt nakon joina.

Realtime odluka:

- Chat realtime sada koristi WebSocket `/ws/messages`.
- Slanje poruka ostaje kroz REST endpoint, a WebSocket sluzi za server-push evente koji invalidiraju pogođene React Query cache zapise.

Definition of done:

- Korisnik moze otvoriti chat, poslati poruku, shareati event i glasati u pollu.

Zavrsna biljeska:

2026-04-29 - Napravljeno: backend je dobio puni chat domain kroz Flyway migraciju `V5__chat_rooms_messages_polls.sql`: `chat_rooms`, `chat_members`, `messages`, `message_reads`, `polls`, `poll_options` i `poll_votes`, s room tipovima `direct/group/event`, roleovima `owner/admin/member`, admin-only pravilima, event share message tipom i poll voting endpointima. Frontend `Poruke` tab sada ima search, listu chat roomova i `+` modal za start novog privatnog chata; dodan je `app/chat/[id].tsx` s headerom, details viewom na klik imena, sudionicima, admin-only switchom, message composerom, poll composerom, event share cardom i poll glasovanjem. Event join prompt sada pokusava otvoriti/kreirati event chat. Share iz event details/FYP-a salje event card u chat room. Datoteke: backend message DTO/row/service/controller/mapper/migration, frontend `core/api/*`, `core/types/domain.ts`, `app/(tabs)/messages.tsx`, `app/chat/[id].tsx`, `features/messages/components/*`, `features/events/*`, `core/i18n/translations.ts`, `README.md`, `FAZE.md`, `backend/README.md`. Test/build nije pokretan po dogovoru.

Dopuna:

2026-04-29 - Maknuti su legacy mock razgovori iz finalnog chat flowa. `GET /api/messages/chat-rooms` sada vraca samo sobe gdje je korisnik stvarni clan u `chat_members`, a migracija `V6__remove_legacy_mock_chats.sql` brise stare seedane `c1/c2/c3` conversations i njihove no-member chat room kopije ako su vec migrirane. Test/build nije pokretan po dogovoru.

2026-04-29 - Dodan je frontend chat realtime listener bez dodatnog native dependencyja. `ChatRealtimeListener` radi dok je korisnik prijavljen i app je aktivan, invalidira aktivne chat list/detail/message queryje svake 2.5 sekunde i odmah na povratku iz backgrounda; chat detail polling je spusten na 2.5 sekunde, a Poruke lista refetcha svakih 5 sekundi kad nema search queryja. Test/build nije pokretan po dogovoru.

2026-04-30 - Polling dopuna je zamijenjena WebSocket realtime slojem. Backend sada ima `spring-boot-starter-websocket`, `/ws/messages` endpoint, JWT handshake validaciju, registry aktivnih sesija po korisniku i `ChatRealtimeService` koji emitira `message.created`, `poll.updated` i `room.updated` clanovima chata nakon uspjesnih REST write akcija. Frontend `ChatRealtimeListener` otvara socket dok je app aktivan, koristi postojeći API base URL za izvedeni WS/WSS URL, radi exponential backoff reconnect i invalidira samo pogođene chat queryje. `refetchInterval` polling je maknut iz chat query hookova. Lokalni plan je zapisan u ignorirani file `.expo/local-docs/chat-websocket-readme.md`. Test/build nije pokretan po dogovoru.

2026-04-30 - Rijesena je keyboard regresija u porukama: `app/chat/[id].tsx` koristi iOS keyboard avoidance i Android-only keyboard bottom inset fallback s malim extra offsetom kad `adjustResize` ne pomakne layout dovoljno, a `Novi chat` modal i poll composer koriste zajednicki keyboard inset hook pa inputi ostaju iznad tipkovnice na iOS-u i Androidu. Pretraga osoba vise ne prikazuje sve korisnike na pocetku: frontend ne pokrece query prije minimalno 2 znaka, a backend `GET /api/messages/people?query=` vraca praznu listu za prazan ili prekratak query. Datoteke: frontend `app/chat/[id].tsx`, `app/(tabs)/messages.tsx`, `features/messages/hooks/use-keyboard-bottom-inset.ts`, `core/api/query-hooks.ts`, `core/api/services.ts`, `core/i18n/translations.ts`, backend `MessageService`, `MessageMapper.xml`, `README.md`, `FAZE.md`, `backend/README.md`. Test/build nije pokretan po dogovoru.

2026-04-30 - Doraden je poll composer UX: umjesto numeriranih option polja i rucnog gumba za dodavanje, forma uvijek krece s 2 option inputa, automatski otvara novo prazno `Dodaj/Add` polje kad su sva vidljiva polja popunjena, na blur uklanja prazna polja i pomice ostale gore, a popunjene opcije se mogu reorderati drag handleom. Payload pri spremanju i dalje salje samo neprazne opcije. Datoteke: `app/chat/[id].tsx`, `core/i18n/translations.ts`, `README.md`, `FAZE.md`. Test/build nije pokretan po dogovoru.

2026-04-30 - Dodan je inicijalni scroll u chat detailu. Pri ulasku u chat `app/chat/[id].tsx` koristi `room.unreadCount` iz detail responsea i scrolla na najstariju neprocitanu tuđu poruku; ako nema neprocitanih poruka, scrolla na zadnju poruku na dnu nakon sto `FlatList` izmjeri content. Chat lista sada prikazuje sticky date separatore (`Danas/Today`, `Jucer/Yesterday`, ili skraceni dan i datum za starije poruke) koji ujedno razdvajaju poruke u listi. Backend i dalje trenutno vraca cijeli message history za room; paginacija/cursor loading ostaje zasebna veca dorada. Test/build nije pokretan po dogovoru.

2026-05-10 - Rijesena je dodatna Android edge-to-edge regresija u chat inputu. `app.config.ts` sada eksplicitno drzi Android keyboard layout na `resize`, a shared `useKeyboardState` hook razlikuje uredaje gdje native `adjustResize` vec pomakne layout od uredaja gdje treba fallback inset. Chat composer sada ima bottom safe-area padding kad je tipkovnica zatvorena da Android navigation bar ne prekrije polje za poruku, a kad je tipkovnica otvorena dodaje se samo preostali nepokriveni inset. `Novi chat` modal i poll composer koriste isti hook. Datoteke: `app.config.ts`, `app/chat/[id].tsx`, `app/(tabs)/messages.tsx`, `features/messages/hooks/use-keyboard-bottom-inset.ts`, `README.md`, `FAZE.md`. Test/build nije pokretan po dogovoru.

## Faza 8 - Profil i postavke

Status: Rijeseno

Cilj:

Profil je korisnikov centar aktivnosti, a settings su odvojeni screen.

Postojece stanje:

- `profile.tsx` je activity/profile hub; jezik, tema i odjava su u `app/profile/settings.tsx`.

Zadaci:

- [x] Napraviti settings screen.
- [x] Premjestiti jezik i temu u settings screen.
- [x] Dodati edit profile screen.
- [x] Dodati avatar upload ili avatar URL model.
- [x] Dodati joined event history.
- [x] Dodati liked reels/events history.
- [x] Dodati transaction history.
- [x] Dodati organizer rating flow za prosle evente.
- [x] Backend profile update endpoint.
- [x] Backend transaction/history endpointi.

Definition of done:

- Profil vise nije settings ekran, nego activity/profile hub.
- Settings se otvara kao poseban ekran iz profila.

Zavrsna biljeska:

2026-05-10 - Napravljeno: profil je odvojen od postavki i prebacen u activity/profile hub s avatarom, imenom, bio tekstom, edit screenom, settings screenom, activity historyjem, liked historyjem i transaction historyjem. Backend je dobio `PATCH /api/users/me/profile`, `GET /api/users/me/activity`, `GET /api/users/me/transactions`, `POST /api/events/{id}/ratings`, `app_users.bio`, `app_users.avatar_url`, `transactions` tablicu i organizer rating upsert/agregaciju. Event leave sada server-side uklanja korisnika iz event chat grupe. Datoteke: frontend `app/(tabs)/profile.tsx`, `app/profile/*`, `features/profile/*`, `core/api/*`, `core/types/domain.ts`, `core/store/auth-store.ts`, `core/i18n/translations.ts`; backend `UserController`, `ProfileService`, profile mapper/DTO/migracija, `EventService`, `MessageService`, mapperi, `README.md`, `FAZE.md`, `backend/README.md`. Testirano: nije pokretano po dogovoru.

## Faza 9 - Placanja, rating i polish

Status: U tijeku

Cilj:

Zatvoriti proizvodne rupe: paid event, transaction history, organizer rating i stabilan UX.

Zadaci:

- [x] Definirati payment provider.
- [x] Dodati ticket product/order/payment/transaction model.
- [x] Dodati paid join flow.
- [x] Dodati transaction history u profil.
- [x] Nakon zavrsenog eventa traziti rating organizatora.
- [x] Dodati push notification strategiju.
- [x] Provjeriti accessibility labels.
- [x] Provjeriti dark/light theme.
- [ ] Provjeriti iOS i Android layout.
- [ ] Ocistiti prototip podatke i mock fallbacke gdje vise ne trebaju.

Definition of done:

- Paid event ima end-to-end flow ili jasno dokumentiran stub.
- Organizer rating je povezan s proslog eventa.
- App ima stabilno osnovno iskustvo na iOS i Android.

Biljeska:

2026-05-11 - Napravljeno: odabran je Stripe kao payment provider za buduci production mobile checkout, a implementiran je Stripe-named stub provider bez native Stripe dependencyja. Backend je dobio `event_ticket_products`, `ticket_orders`, `payments` i prosirene `transactions`, endpointove `POST /api/events/{eventId}/ticket-checkout` i `POST /api/ticket-orders/{orderId}/confirm`, te zastitu da direct join paid eventa trazi uspjesan ticket order. Frontend paid join sada iz event detaila otvara checkout potvrdu, potvrda zapisuje transaction i join-a event; transaction row prikazuje order/provider podatke. Organizer rating kandidati iz proslih eventova ostaju povezani kroz profil activity screen. Dodani su osnovni accessibility labeli na shared button/icon button i rating zvjezdice. Push strategija je dokumentirana kao kasniji Expo Notifications/WebSocket extension, bez implementacije native dependencyja u ovoj fazi. Datoteke: backend `payments/*`, `PaymentController`, `PaymentMapper.xml`, `V8__tickets_payments.sql`, `EventService`, `TransactionDto`, `ProfileService`; frontend `features/payments/*`, `use-event-join-actions.ts`, `EventDetailsContent`, event detail sheet/screen, API services/hooks, transaction row, i18n, README/FAZE/backend README. Testirano: nije pokretano po dogovoru; build/test i uredjajski dark/light layout ostaju za rucnu provjeru.

2026-05-11 - Dopuna: create event flow je prebacen iz duge forme u 4 koraka plus success ekran: osnovni podaci, vrijeme, lokacija/ulaz i postavke. Frontend vise ne prikazuje odvojena HR/EN polja za naziv, lokaciju, opis i upute, nego salje canonical `title`, `where`, `about` i `entryInstructions`; backend ih mirror-a u postojece HR/EN stupce radi kompatibilnosti sa starim DTO/modelom. Centralna paleta je uskladena na poslane boje (Rich Black, Off White, Gunmetal Gray, Charcoal Gray, Graphite, Cool Gray) uz postojeci purple accent, dodan je Lexend font, iOS back/icon button dobio je glass varijantu, a app/source ikone su generirane iz `.local/logos` za Expo assets i lokalne native iOS/Android resurse. Datoteke: `app/create-event.tsx`, `features/events/create/*`, `core/types/domain.ts`, `core/i18n/translations.ts`, `core/theme/*`, `components/primitives/*`, `assets/fonts/*`, `assets/images/*`, backend `CreateEventRequest`, `EventService`, README/FAZE. Testirano: nisu pokretani testovi, typecheck ni build po dogovoru; napravljena je ciljano staticka provjera importova/i18n kljuceva i dimenzija generiranih asseta.

2026-05-11 - Dopuna UX regresije: uklonjen je bijeli Android navigation/root background ispod ekrana i povecan je defaultni bottom padding za scrollable `AppScreen` kako profil i profile detail liste ne bi zavrsavale ispod tab/navigation bara. Dodani su `expo-navigation-bar` i `react-native-is-edge-to-edge` za runtime sync Android navigation bara s trenutnim dark/light themeom bez edge-to-edge warninga; Android `edgeToEdgeEnabled` je iskljucen jer three-button navigation bar mora imati stvarnu theme pozadinu umjesto bijelog system fallbacka. Native tab bar shadow/separator je uskladen s tab surface bojom. Datoteke: `components/primitives/app-screen.tsx`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app.config.ts`, `package.json`, `package-lock.json`, lokalni Android `styles.xml`. Testirano: samo `git diff --check`, bez build/test po dogovoru.

2026-05-14 - Dopuna frontend CI regresije: maknut je nevalidni `edgeToEdgeEnabled: false` iz Expo configa jer SDK 54 tipovi dopustaju samo eksplicitno ukljucivanje tog polja. Android edge-to-edge i dalje nije ukljucen; theme runtime nastavlja kontrolirati navigation bar. Datoteke: `app.config.ts`, `README.md`, `FAZE.md`. Testirano: `npm test`, `npm test -- --ci`, `npm run typecheck`.

2026-05-14 - Dopuna create event polish: dodan je backend `GET /api/locations/search` proxy za Nominatim autocomplete s locale/limit/proximity parametrima i kratkim cacheom, a frontend location search servis sada ide kroz backend. Create event korak lokacije sada trazi odabir adrese iz autocomplete prijedloga, sprema odabrane coordinates kao event lokaciju, prikazuje stvarnu mapu s pinom na adresi i enablea odabir ulaza tek nakon adrese. Entrance picker starta na adresi, koristi veci zoom i ima fiksni center pin umjesto markera koji se pomice po mapi. Opcionalni kraj eventa sada ima X akciju za uklanjanje odabranog datuma. Shared iOS glass primitive (`GlassSurface`) prebacuje `AppCard`, `AppButton`, `AppHeader` i `AppIconButton` na Liquid Glass kad je dostupan, uz tamniji themed fallback bez ruzne sistemske sive. Datoteke: backend `LocationController`, `LocationSearchService`, `LocationSearchResultDto`, `application.properties`, frontend `app/create-event.tsx`, `app/entrance-map-picker.tsx`, `features/events/create/create-event-address-field.tsx`, `services/locationSearch/*`, `components/map/*`, `components/primitives/*`, `core/i18n/translations.ts`, `README.md`, `backend/README.md`, `FAZE.md`. Testirano: nisu pokretani testovi, typecheck ni build po dogovoru.

2026-05-14 - Dopuna location search regresije: frontend location search provider sada prvo pokusava backend proxy, a ako backend jos nije restartan, endpoint nije dostupan ili provider vrati prazno, automatski pada na stari direktni Nominatim provider. Direktni provider sada koristi i proximity viewbox, a prazni rezultati se vise ne cacheaju da transientni provider problem ne zalijepi "nema rezultata". Datoteke: `services/locationSearch/*`, `FAZE.md`. Testirano: nije pokretan test/typecheck/build po dogovoru; samo `git diff --check`.

2026-05-14 - Dopuna address autocomplete normalizacije: Nominatim rezultati se sada normaliziraju iz `address` objekta (`road + house_number`, lokalitet, county/state/postcode/country), dedupeaju se po nazivu i lokalitetu, a create event address field cuva kucni broj iz korisnickog queryja u prikazu i upisanom tekstu kad provider vrati samo ulicu bez broja. Datoteke: frontend `services/locationSearch/*`, `features/events/create/create-event-address-field.tsx`, backend `LocationSearchService`, `FAZE.md`. Testirano: nije pokretan test/typecheck/build po dogovoru; samo `git diff --check`.

2026-05-14 - Dopuna owner event management i chat polish: profil je dobio `Created Events` ulaz i owner manage ekran za kreirane evente s izmjenom osnovnih detalja, dodavanjem/brisanjem image media URL-ova, pregledom waitliste/sudionika, prihvacanjem waitliste, micanjem sudionika i blokiranjem korisnika s neplacenih eventova. Backend je dobio owner-only event update/delete/media/participants endpointove, `event_blocks` migraciju i `waitlistCount` u event DTO-u. Direct chat vise ne prikazuje admin-only mode, chat liste/header/message bubble koriste stvarni `avatar_url`, a direct details prikazuje Add friend UI i buduce dostupne evente sugovornika. Datoteke: backend `EventController`, `EventService`, event DTO/row/mapper, `V9__event_owner_management.sql`, message DTO/row/mapper/service; frontend `app/profile/created-events.tsx`, `app/profile/event/[id].tsx`, `app/(tabs)/profile.tsx`, `app/chat/[id].tsx`, `features/messages/*`, `core/api/*`, `core/types/domain.ts`, `core/i18n/translations.ts`, README/FAZE/backend README. Testirano: nisu pokretani testovi, typecheck ni build po dogovoru.

2026-05-14 - Dopuna attendance statusa, default map filtera i ratinga: owner remove sada oznacava sudionika kao `rejected`, block koristi `event_blocks`, a `GET /api/users/me/events?filter=joined` vraca i `waitlisted`, `approved`, `rejected` i `blocked` statuse da se u profilu/kalendaru jasno vidi stanje prijave. Approve/remove/block zapisuju in-app obavijesti u `app_notifications`, a activity screen ih prikazuje. Mapa u defaultnom `Svi datumi` modu salje `from=now`, pa prikazuje samo buduce evente, dok rucni day/range moze dohvatiti stare. Dodan je `event_ratings` model i `POST /api/events/{id}/ratings/full` za odvojeno ocjenjivanje eventa i organizatora s komentarima; backend scheduler oznacava published evente kao `finished` dan nakon odrzavanja. Datoteke: backend `V10__event_attendance_notifications_ratings.sql`, `EventService`, `EventMapper.xml`, profile DTO/mapper/service, `BackendApplication`; frontend `use-events-map-screen-model.ts`, `profile/activity.tsx`, `ProfileEventRow`, `JoinedEventsCalendar`, `EventDetailsContent`, API services/hooks/types, i18n, README/FAZE/backend README. Testirano: nisu pokretani testovi, typecheck ni build po dogovoru; samo `git diff --check`.

2026-05-16 - Dopuna FYP layout polish: FYP je uskladjen s novim kompaktnim overlay smjerom, Android vise ne rendera media/content ispod native taba nego viewport racuna dostupnu visinu iz tab bar contexta, a FYP details koristi full-height draggable sheet s handle barom i scrollable shared details sadrzajem. Backend event payload je prosiren organizer metadatom (`creatorName`, `creatorAvatarUrl`) za feed/detail prikaz. Test/build/typecheck nisu pokretani po dogovoru.

2026-05-16 - Dopuna push notifikacija za poruke: dodan je Expo Notifications dependency/config, globalni push registrar, tap-to-open-chat handler, settings flow `Preferences > Notifications`, preference za privatne i grupne/event chatove te per-chat mute u `ChatDetailsPanel`. Backend je dobio `V11__message_push_notifications.sql`, `NotificationController`, `NotificationService`, notification mapper/DTO-e, `user_notification_preferences`, `user_push_tokens`, `chat_notification_mutes`, `mutedByMe` u `ChatRoomDto` i asinkrono slanje Expo push notifikacija nakon REST slanja text/event-share/poll poruke uz server-side filtriranje prema preferencama i mute stanju. Datoteke: frontend `app/_layout.tsx`, `app.config.ts`, `app/profile/settings.tsx`, `app/profile/preferences.tsx`, `app/profile/preferences/notifications.tsx`, `core/notifications/*`, `core/api/*`, `core/types/domain.ts`, `core/i18n/translations.ts`, `features/messages/components/chat-details-panel.tsx`, `package.json`, `package-lock.json`; backend `V11__message_push_notifications.sql`, `NotificationController`, `NotificationService`, notification DTO/mapper files, `MessageController`, `MessageService`, `MessageMapper.xml`, `ChatRoomDto`, `ChatRoomRow`, `BackendApplication`, `application.properties`, `README.md`; dokumentacija `README.md`, `FAZE.md`, `backend/README.md`. Testirano: nisu pokretani testovi, typecheck ni build po dogovoru; pokrenut je samo `git diff --check` u frontend i backend repou.

2026-05-16 - Dopuna push konfiguracije: `app.config.ts` sada cita Expo `extra.eas.projectId` iz `EXPO_PUBLIC_EAS_PROJECT_ID`, a `.env`, `.env.test`, `.env.example` i `.env.test.example` imaju odgovarajucu varijablu za lokalni/test setup bez hardcodanog UUID-a u kodu. Placeholder vrijednosti se ignoriraju, a test build bez stvarnog projectId-a faila rano. Testirano: nije pokretan test/typecheck/build po dogovoru.

## Faza 10 - FYP preference, tags, friends i message security

Status: Rijeseno

Cilj:

- Korisnik moze s FYP-a oznaciti event, kreatora ili tag kao `Not interested` i kasnije to maknuti u preferencama.
- Eventi imaju do 5 tagova koji se spremaju na backend i prikazuju u feed/detail ekranima.
- Direct chat Add friend flow salje friend request poruku s prihvati/odbij akcijama.
- Text poruke se za nove zapise spremaju encrypted-at-rest na backendu.
- Mapa koristi shared event details bottom sheet u kompaktnijem Apple Maps smjeru s drag za vise detalja.

Zadaci:

- [x] Dodati backend tablice `event_tags`, `user_feed_blocks`, `friend_requests` i encrypted message stupce.
- [x] Prosiriti event DTO/request/row/mapper/service s tagovima i FYP preference filtriranjem.
- [x] Dodati `GET/POST/DELETE /api/users/me/feed-preferences`.
- [x] Dodati tag input u create event basics korak i prikaz tagova u shared details komponenti.
- [x] Dodati FYP `Not interested` akciju za event, kreatora i tagove.
- [x] Dodati `Preferences > FYP preferences` ekran grupiran po eventima, kreatorima i tagovima s remove akcijom.
- [x] Dodati friend request backend endpointove i posebnu chat poruku s accept/reject gumbima.
- [x] Dodati AES-GCM encryption-at-rest za nove text poruke, s kljucem iz `MESSAGES_ENCRYPTION_SECRET` ili postojeceg JWT secreta kao fallbackom.
- [x] Kompaktnije podesiti map detail sheet snap pointove da se prvo otvara kao donji preview, a draganjem gore prikazuje cijele detalje.

Zavrsna biljeska:

2026-05-17 - Napravljeno: FYP sada ima `Not interested` akciju koja sprema preference za event, kreatora ili tag i backend ih filtrira iz feeda/mape; preference su dostupne u `Profile > Settings > Preferences > FYP preferences` po kategorijama i mogu se ukloniti. Event create prima do 5 tagova, backend ih sprema u `event_tags`, a details ih prikazuje. Direct chat `Add friend` sada kreira friend request i ubacuje posebnu poruku s `Prihvati/Odbij` akcijama. Backend sprema nove text poruke AES-GCM encrypted-at-rest kroz `MESSAGES_ENCRYPTION_SECRET` konfiguraciju, uz kompatibilno citanje starih plaintext poruka. Map detail sheet je spusten na kompaktni prvi snap point i i dalje koristi shared `EventDetailsContent`. Datoteke: backend `V12__fyp_tags_friend_requests_message_encryption.sql`, event/social/message DTO/mapper/service/controller files, `application.properties`; frontend FYP, create event, event details, chat details/message bubble, preferences feed screen, API hooks/services/types, i18n; dokumentacija `README.md`, `FAZE.md`, `backend/README.md`. Testirano: nisu pokretani testovi, typecheck ni build po dogovoru.

2026-05-17 - Dopuna friend request realtime UX-a: chat room DTO sada vraca `friendshipStatus` i pending friend request za direct chat, backend emitira `room.updated` nakon prihvacanja/odbijanja, a frontend preko postojeceg WebSocket listenera osvjezava chat i friends queryje. Chat details vise ne prikazuje `Add friend` kad je zahtjev vec poslan, kad je dosao pending zahtjev prikazuje `Prihvati/Odbij`, a nakon prihvacanja prikazuje da su korisnici vec prijatelji. Messages header je dobio friends list gumb s ikonom ljudi koji otvara prihvacene prijatelje i starta direct chat. Profile/settings redovi imaju veci vertikalni padding da tekst nije zalijepljen uz separatore. Datoteke: backend `MessageMapper.xml`, `MessageService`, `SocialService`; frontend messages screen, chat realtime listener, chat details/message bubble, profile menu row, API hooks/types, i18n. Testirano: samo `git diff --check` u backend i frontend repou; nisu pokretani testovi, typecheck ni build po dogovoru.

## Kako updateati ovaj dokument

Kad zavrsis zadatak, dodaj kratku biljesku u relevantnu fazu:

```text
YYYY-MM-DD - Napravljeno: kratki opis. Datoteke: file1, file2. Testirano: komanda ili manualna provjera.
```

Kad je cijela faza gotova, status u tablici i naslovu faze mora biti `Rijeseno`, a ispod faze treba ostati zapis zavrsne biljeske. To sluzi da se ista faza ne planira i ne radi ponovno u kasnijim chatovima.

Ako se tijekom rada promijeni redoslijed faza, promijeni tablicu statusa i objasni zasto u 1-2 recenice.
