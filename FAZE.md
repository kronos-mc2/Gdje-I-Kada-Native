# Gdje i Kada - fazni plan rada

Status dokumenta: 2026-04-26  
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
| 6 | Kalendar | Nije poceto | Kalendar prikazuje joined evente u mjesecnom gridu. |
| 7 | Poruke i event chat | Nije poceto | Poruke imaju chat roomove, event grupe, event share card i pollove. |
| 8 | Profil i postavke | Nije poceto | Profil ima edit, history, liked history, transactions i settings screen. |
| 9 | Placanja, rating i polish | Nije poceto | Paid eventi, transaction history, organizer rating i zavrsni UX polish. |

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
- Android ima MapLibre clustering.
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

## Faza 6 - Kalendar

Status: Nije poceto

Cilj:

Kalendar prikazuje samo evente na koje se korisnik pridruzio, u mjesecnom gridu.

Postojece stanje:

- `calendar.tsx` ima day chipove i filtere.
- Vec koristi backend `GET /api/users/me/events?filter=...`, ali jos nema mjesecni grid.

Zadaci:

- [ ] Maknuti `all` i `created` filtere iz glavnog kalendara ako ne trebaju finalnom zahtjevu.
- [x] Koristiti backend `GET /api/users/me/events`.
- [ ] Napraviti monthly calendar grid.
- [ ] Default je aktualni mjesec.
- [ ] Dodati next/previous month.
- [ ] Prikazati title eventa unutar dana.
- [ ] Klik na event/dan otvara event details.

Definition of done:

- Kalendar prikazuje samo joined evente i radi kao mjesecni pregled.

## Faza 7 - Poruke i event chat

Status: Nije poceto

Cilj:

Poruke pokrivaju privatne poruke, grupe, event grupe, pollove i admin-only chat mode.

Postojece stanje:

- Backend ima samo `conversations` listu.
- Frontend ima samo row listu.

Zadaci backend:

- [ ] Dodati `chat_rooms`.
- [ ] Dodati `chat_members`.
- [ ] Dodati `messages`.
- [ ] Dodati `message_reads`.
- [ ] Dodati `polls`, `poll_options`, `poll_votes`.
- [ ] Dodati role: owner/admin/member.
- [ ] Dodati admin-only permission rules.
- [ ] Dodati event share message type.

Zadaci frontend:

- [ ] Chat room list.
- [ ] Chat room screen.
- [ ] Slanje text messagea.
- [ ] Event share card u chatu: slika, naslov, kratki opis, link na details.
- [ ] Poll prikaz i glasanje.
- [ ] UI za admin-only mode.
- [ ] Event chat prompt nakon joina.

Realtime odluka:

- Prva verzija moze koristiti polling/React Query invalidation.
- Kasnije dodati WebSocket ili SSE ako treba real-time iskustvo.

Definition of done:

- Korisnik moze otvoriti chat, poslati poruku, shareati event i glasati u pollu.

## Faza 8 - Profil i postavke

Status: Nije poceto

Cilj:

Profil je korisnikov centar aktivnosti, a settings su odvojeni screen.

Postojece stanje:

- `profile.tsx` prikazuje ime/email, jezik, temu i odjavu.

Zadaci:

- [ ] Napraviti settings screen.
- [ ] Premjestiti jezik i temu u settings screen.
- [ ] Dodati edit profile screen.
- [ ] Dodati avatar upload ili avatar URL model.
- [ ] Dodati joined event history.
- [ ] Dodati liked reels/events history.
- [ ] Dodati transaction history.
- [ ] Dodati organizer rating flow za prosle evente.
- [ ] Backend profile update endpoint.
- [ ] Backend transaction/history endpointi.

Definition of done:

- Profil vise nije settings ekran, nego activity/profile hub.
- Settings se otvara kao poseban ekran iz profila.

## Faza 9 - Placanja, rating i polish

Status: Nije poceto

Cilj:

Zatvoriti proizvodne rupe: paid event, transaction history, organizer rating i stabilan UX.

Zadaci:

- [ ] Definirati payment provider.
- [ ] Dodati ticket product/order/payment/transaction model.
- [ ] Dodati paid join flow.
- [ ] Dodati transaction history u profil.
- [ ] Nakon zavrsenog eventa traziti rating organizatora.
- [ ] Dodati push notification strategiju.
- [ ] Provjeriti accessibility labels.
- [ ] Provjeriti dark/light theme.
- [ ] Provjeriti iOS i Android layout.
- [ ] Ocistiti prototip podatke i mock fallbacke gdje vise ne trebaju.

Definition of done:

- Paid event ima end-to-end flow ili jasno dokumentiran stub.
- Organizer rating je povezan s proslog eventa.
- App ima stabilno osnovno iskustvo na iOS i Android.

## Kako updateati ovaj dokument

Kad zavrsis zadatak, dodaj kratku biljesku u relevantnu fazu:

```text
YYYY-MM-DD - Napravljeno: kratki opis. Datoteke: file1, file2. Testirano: komanda ili manualna provjera.
```

Kad je cijela faza gotova, status u tablici i naslovu faze mora biti `Rijeseno`, a ispod faze treba ostati zapis zavrsne biljeske. To sluzi da se ista faza ne planira i ne radi ponovno u kasnijim chatovima.

Ako se tijekom rada promijeni redoslijed faza, promijeni tablicu statusa i objasni zasto u 1-2 recenice.
