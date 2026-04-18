# Gdje i Kada - projektna dokumentacija i master prompt

Status dokumenta: 2026-04-18  
Projekt se ne radi ispocetka. Postojeci React Native/Expo frontend i Spring Boot backend ostaju baza, a nove funkcionalnosti se nadograduju na vec postojece klase, rute, storeove, hookove i dizajn sustav.

Radimo mobilnu event aplikaciju "Gdje i Kada" za iOS i Android. Frontend je React Native kroz Expo Router, backend je Spring Boot s PostgreSQL bazom. Nemoj kretati ispocetka. Prvo procitaj postojeci kod i nadogradi ga prema lokalnim patternima.

Repo struktura:

- `Gdje-I-Kada-Native/` - Expo React Native aplikacija.
- `backend/` - Spring Boot backend.

Glavna ideja aplikacije:

Aplikacija pomaze korisniku pronaci evente oko sebe, pregledati ih na mapi ili kroz Reels/FYP feed, pridruziti se eventu, otvoriti detalje, komunicirati kroz privatne i event chatove, vidjeti svoj kalendar eventova i urediti profil/postavke. Cilj je native-feeling aplikacija za iOS i Android, s posebnim naglaskom na iOS Liquid Glass gdje god ima smisla, ali uz dobar Android fallback.

Planirani glavni tabovi:

1. `Mapa`
2. `Reels/FYP`
3. `Kalendar`
4. `Poruke`
5. `Profil`

Trenutno stanje tabova:

- Mapa je implementirana kao `app/(tabs)/index.tsx` i rendera `EventsMapExperience`.
- FYP je implementiran kao `app/(tabs)/fyp.tsx`.
- Kalendar je implementiran kao `app/(tabs)/calendar.tsx`, ali jos nije mjesecni FullCalendar-style pogled.
- Poruke su glavni tab kroz `app/(tabs)/messages.tsx`.
- `app/(tabs)/social.tsx` ostaje prototip/sekundarni ekran za conversations + friends, ali vise nije glavni tab.
- Profil je implementiran kao `app/(tabs)/profile.tsx`, ali trenutno ima osnovni profil, jezik, temu i odjavu. Treba dodati history eventova, lajkova, transakcija, edit profila i settings ekran.

Postojece frontend tehnologije i patterni:

- Expo SDK 54, React 19, React Native 0.81, TypeScript.
- Navigacija: `expo-router` i `expo-router/unstable-native-tabs` u `app/(tabs)/_layout.tsx`.
- Data fetching/cache: TanStack React Query u `core/api/query-hooks.ts` i `core/query/query-client.ts`.
- HTTP: Axios u `core/api/http-client.ts`, s Bearer token interceptorom iz `useAuthStore`.
- Global state: Zustand u `core/store/app-store.ts` i `core/store/auth-store.ts`.
- Auth token storage: `expo-secure-store` s fallback migracijom iz AsyncStorage u `core/store/auth-store.ts`.
- i18n: rucni HR/EN prijevodi u `core/i18n/translations.ts` i `useI18n`.
- Theme: `AppThemeProvider`, `createAppTheme`, `palette`, `tokens`, `ThemeToggle`.
- iOS glass: `expo-glass-effect` i `expo-blur` se vec koriste u `EventDetailSheet` i `MapSearchBar.ios.tsx`; `AppCard` i `AppButton` imaju blur glass varijantu. Kod novih iOS povrsina preferirati `GlassView` kad je `isLiquidGlassAvailable()` i `isGlassEffectAPIAvailable()`, uz `BlurView` ili themed surface fallback.
- Karte:
  - iOS: `components/map/event-map-surface.ios.tsx` koristi `react-native-maps` / MapKit.
  - Android: `components/map/event-map-surface.android.tsx` koristi `@maplibre/maplibre-react-native` i `supercluster`.
  - Shared API: `components/map/event-map.tsx`, `components/map/types.ts`, `MapMarkerBadge`, `EventDetailSheet`.
- Lokacija: `features/events/hooks/use-map-location-bootstrap.ts` trazi consent, koristi `expo-location`, Android MapLibre fallback i IP/capital fallback.
- Search po eventima na mapi: `features/events/hooks/use-event-map-search.ts`, `MapSearchBar`, `MapSearchResults`.

Postojece backend tehnologije i patterni:

- Spring Boot 4.0.5, Java 25, Maven.
- PostgreSQL.
- Flyway migracije u `backend/src/main/resources/db/migration`.
- MyBatis mapperi u `backend/src/main/resources/mapper` i Java mapper interfacei u persistence paketima.
- Spring Security stateless JWT auth:
  - `SecurityConfig`
  - `JwtAuthenticationFilter`
  - `JwtService`
  - `AuthService`
- BCrypt password hashing.
- Google i Apple login id token verifikacija kroz:
  - `GoogleIdTokenVerifierService`
  - `AppleIdTokenVerifierService`
  - `AudienceValidator`
- REST endpointi kroz controllere:
  - `AuthController`
  - `EventController`
  - `SocialController`
  - `MessageController`

Backend trenutno ima:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/apple`
- `GET /api/auth/me`
- `GET /api/events`
- `POST /api/events`
- `GET /api/feed`
- `GET /api/social/friends`
- `GET /api/messages/conversations`

Svi `/api/**` endpointi osim public auth ruta traze `Authorization: Bearer <token>`.

Trenutna baza:

- `events` iz `V1__init_schema.sql`
  - `id`
  - `creator_user_id` iz `V4__expand_event_domain.sql`
  - `title_hr`, `title_en`
  - `where_hr`, `where_en`
  - `address`
  - `about_hr`, `about_en`
  - `when_iso`
  - `start_at`, `end_at`
  - `event_type` (`nearby`, `joined`, `created`)
  - `latitude`, `longitude`
  - `entrance_latitude`, `entrance_longitude`
  - `entry_instructions_hr`, `entry_instructions_en`
  - `visibility` (`public`, `friends`)
  - `attendance_mode` (`open`, `waitlist`, `paid`)
  - `price_amount`, `price_currency`
  - `capacity`
  - `status` (`draft`, `published`, `cancelled`, `finished`)
  - `organizer_rating_average`, `organizer_rating_count`
  - `participant_count`
  - `created_at`, `updated_at`
- `event_media` iz `V4__expand_event_domain.sql`
- `event_participants` iz `V4__expand_event_domain.sql`
- `event_likes` iz `V4__expand_event_domain.sql`
- `event_organizer_ratings` iz `V4__expand_event_domain.sql`
- `friends` iz `V1__init_schema.sql`
- `conversations` iz `V1__init_schema.sql`
- `app_users` iz `V3__create_users_table.sql`
  - `id`
  - `email`
  - `full_name`
  - `password_hash`
  - `auth_provider` (`local`, `google`, `apple`)
  - `created_at`, `updated_at`

Trenutni event model:

- Frontend: `core/types/domain.ts` tip `AppEvent`.
- Backend DTO: `AppEventDto`.
- Backend request: `CreateEventRequest`.
- Persistence row: `EventRow`.
- Service: `EventService`.
- Mapper: `EventMapper` i `EventMapper.xml`.

Event trenutno podrzava naslov, lokaciju, adresu, opis, start/end datum, coordinates, entrance coordinates, entry instructions, creator user id, visibility `public/friends`, attendance mode `open/waitlist/paid`, cijenu za paid evente, capacity, status, organizer rating agregate i participant count. Baza ima tablice za media, participants, likes i organizer ratings. Jos ne postoje pun UI/API flow za upload media, join/leave endpointi, placanje, rating submit, event chat ni reels-specific metadata.

Kad implementiras nove stvari, nadogradi postojece:

- Ako dodajes nova event polja, prosiri `AppEvent`, `AppEventDto`, `CreateEventRequest`, `EventRow`, `EventService`, `EventMapper.xml` i Flyway migraciju.
- Ako dodajes novi API, napravi controller/service/mapper sloj po istom patternu.
- Ako dodajes novi frontend screen, koristi `AppScreen`, `AppText`, `AppButton`, `AppCard`, theme tokens i postojece i18n kljuceve ili dodaj nove u `translations.ts`.
- Ako radis state koji mora prezivjeti restart appa, koristi Zustand persist u `app-store.ts` ili secure auth store ako je osjetljivo.
- Ako radis server state, koristi React Query i query keys.
- Ako radis iOS translucent povrsine, koristi Liquid Glass API gdje je dostupan i fallback na BlurView/surface.

## Vizija proizvoda

"Gdje i Kada" je social discovery aplikacija za evente. Korisnik otvara aplikaciju i odmah vidi evente oko sebe na mapi. Moze pretrazivati evente, filtrirati ih po datumu i tipu, otvoriti detalje, vidjeti gdje je tocno ulaz, joinati event, eventualno kupiti ulaznicu, uci u event grupu i kasnije rateati organizatora.

FYP dio aplikacije sluzi za brz discovery kroz vertikalni Reels-style feed. Svaki reel je povezan s eventom. Korisnik moze lajkati, shareati i otvoriti detalje eventa. Save/bookmark nije dio finalnog zahtjeva i treba ga ukloniti ili zamijeniti ako ostane iz starog prototipa.

Kalendar prikazuje samo evente na koje se korisnik pridruzio. Treba izgledati kao mjesecni kalendar s naslovima eventova unutar dana, slicno FullCalendar iskustvu, ali implementirano nativno za React Native ako FullCalendar nije primjenjiv.

Poruke trebaju podrzavati privatne razgovore, privatne i javne grupe, event-specific grupe, pollove i admin-only chat mod gdje samo admini pisu, a ostali mogu glasati na pollu.

Profil treba prikazivati korisnikovu aktivnost: event history, joined eventove, liked reels/evente i transaction history. Profil mora imati editiranje slike i imena. Postavke trebaju biti odvojeni ekran otvoren iz profila, a tamo idu jezik, tema i slicne opcije.

## Frontend dokumentacija

### Navigacija

Root navigacija je u `Gdje-I-Kada-Native/app/_layout.tsx`.

Trenutno:

- Ako korisnik nije autentificiran, prikazuje se `(auth)`.
- Ako je autentificiran, prikazuje se `(tabs)`, `create-event`, `entrance-map-picker` i `event/[id]`.
- Auth hidratacija se radi kroz `useAuthStore.hydrateAuth()`.
- `QueryClientProvider`, `SafeAreaProvider`, `AppThemeProvider` i `GestureHandlerRootView` su globalni wrapperi.

Tab navigacija je u `Gdje-I-Kada-Native/app/(tabs)/_layout.tsx`.

Status Faze 1:

- Rijeseno 2026-04-18: glavni tabovi su uskladeni na Mapa, FYP, Kalendar, Poruke i Profil.
- `social` vise nije trigger u glavnom tab baru; `messages` je glavni tab za poruke.

Trenutni `NativeTabs.Trigger`:

- `index` label `map`
- `fyp` label `fyp`
- `calendar` label `calendar`
- `messages` label `messages`
- `profile` label `profile`

Rijeseno:

- `index` se tretira kao `Mapa`, ne kao genericki `Dogadaji`.
- `social` je maknut iz glavnog tab bara i zamijenjen s `messages`.
- Ako prijatelji ostaju u proizvodu, bit ce dio poruka/profila ili sekundarni screen, ne glavni tab.

### Mapa

Postoji:

- Screen: `app/(tabs)/index.tsx`.
- Screen model: `features/events/hooks/use-events-map-screen-model.ts`.
- Experience komponenta: `features/events/components/events-map-experience.tsx`.
- Map wrapper: `components/map/event-map.tsx`.
- Platform-specific surfaces:
  - `components/map/event-map-surface.ios.tsx`
  - `components/map/event-map-surface.android.tsx`
- Event bottom sheet: `components/map/event-detail-sheet.tsx`.
- Search:
  - `components/search/map-search-bar.tsx`
  - `components/search/map-search-bar.ios.tsx`
  - `components/search/map-search-results.tsx`
  - `features/events/hooks/use-event-map-search.ts`
- Location bootstrap: `features/events/hooks/use-map-location-bootstrap.ts`.

Trenutno ponasanje:

- App dohvat eventova radi preko `useEventsQuery()` i `/api/events`.
- Eventi su sortirani po datumu.
- Mapa se inicijalno centrira na `userLocation`.
- Ako korisnik dopusti lokaciju, pokusava se dohvatiti precizna lokacija.
- Ako nema precizne lokacije, koristi se IP/capital fallback.
- Event pinovi su clickable.
- Klik na pin otvara `EventDetailSheet`.
- Sheet ima collapsed i expanded state.
- Event detalji u sheetu prikazuju cover sliku, naslov, mjesto, datum, broj sudionika, type i opis.
- Share koristi native `Share.share`.
- Android mapa ima MapLibre i clustering preko `supercluster`.
- iOS mapa koristi MapKit.
- iOS search bar i event detail sheet vec koriste Liquid Glass/Blur fallback.

Sto fali za finalni zahtjev:

- Filter po datumu odmah ispod search bara.
- Jasna lokalna pretraga adresa ili remote geocoding search za lokacije. Postoji `services/locationSearch`, ali trenutno map search koristi event search.
- Backend filtering po geo bounding boxu/radiusu, datumu i queryju. Trenutno frontend dobiva sve public evente.
- Distanca od korisnika i sortiranje po blizini.
- Prikaz tocnog entrance pina u detaljima i na mapi.
- Detalji koji ukljucuju slike/videe, organizer rating, join state, cijenu/ticket state, waitlist state.
- Join flow koji nakon joina pita korisnika zeli li uci u event messages grupu.
- Razlikovanje `public`, `friends`, `waitlist`, `open/free`, `paid` i drugih attendance pravila.

### Reels/FYP

Postoji:

- Screen: `app/(tabs)/fyp.tsx`.
- Query: `useFeedQuery()` prema `/api/feed`.
- Cover image helper: `core/events/event-cover.ts`.
- Liked/joined/favorite lokalno stanje: `useAppStore`.

Trenutno ponasanje:

- Vertikalni `FlatList` s `pagingEnabled`, `snapToInterval` i fullscreen slideovima.
- Svaki event prikazuje cover image preko Picsum seed URL-a.
- Akcije: like, favorite/bookmark, share.
- Details button vodi na `app/event/[id].tsx`.
- Like stanje je lokalno u Zustand storeu.
- `favoriteEventIds` postoji, ali finalni zahtjev kaze da nema saveanja.

Sto fali:

- Pravi video/reels model i media playback.
- Preload nekoliko itema unaprijed i unload udaljenih videa.
- Backend feed ranking i pagination/cursor.
- Event link i detail sheet isti kao na mapi, ne odvojeno iskustvo ako se zeli konzistentnost.
- Ukloniti bookmark/save UI ako ostajemo na zahtjevu "nema saveanje".
- Backend persistencija likeova.
- Share u chatove, ne samo native share.
- Liked history na profilu.

### Kalendar

Postoji:

- Screen: `app/(tabs)/calendar.tsx`.
- Koristi `useEventsQuery()` i lokalni `joinedEventIds`.
- Ima filtere `all`, `joined`, `created`.
- Prikazuje horizontalne day chipove i listu eventova za odabrani dan.

Sto treba promijeniti:

- Finalni zahtjev: kalendar prikazuje samo evente na koje se korisnik pridruzio.
- Treba mjesecni grid za aktualni mjesec po defaultu.
- Svaki dan mjeseca treba prikazati event title ako dan ima joined event.
- Treba navigacija mjesec naprijed/nazad.
- Treba klik na event/dan otvoriti detalje.
- Joined events moraju doci s backenda po korisniku, ne iz lokalnog Zustand storea.

Preporuka za React Native:

- Prije uvodjenja FullCalendara provjeriti je li uopce smislen za native. Vjerojatnije je bolje napraviti vlastiti monthly grid komponentu u RN ili koristiti provjerenu RN calendar biblioteku.
- Ako se uvodi biblioteka, treba paziti na Expo kompatibilnost, performanse i theme integration.

### Poruke

Postoji:

- `app/(tabs)/messages.tsx` prikazuje samo listu conversations.
- `app/(tabs)/social.tsx` prikazuje conversations + friends.
- `features/messages/components/conversation-row.tsx`.
- `features/social/components/friend-row.tsx`.
- Backend:
  - `MessageController`
  - `MessageService`
  - `MessageMapper`
  - `ConversationRow`
  - `MessageMapper.xml`
  - tablica `conversations`

Trenutno ponasanje:

- Dohvat liste conversations preko `/api/messages/conversations`.
- Nema stvarnih poruka, nema chat room screena, nema slanja poruka.

Sto fali:

- Modeli za `chat_rooms`, `chat_members`, `messages`, `message_reads`.
- Tipovi chata: private DM, private group, public group, event group.
- Admin role per chat.
- Admin-only chat mode.
- Pollovi:
  - `polls`
  - `poll_options`
  - `poll_votes`
  - pravilo da korisnik moze glasati, a ne pisati ako nema permission.
- Slanje event carda u chat s minimalnim previewjem: slika, naslov, kratki opis, deep link na event details.
- WebSocket/SSE ili polling strategy za realtime.
- Push notifikacije kasnije.

### Profil

Postoji:

- Screen: `app/(tabs)/profile.tsx`.
- Prikazuje korisnikovo ime/email iz `useAuthStore`.
- Jezik HR/EN se mijenja preko `setLocale`.
- Tema se mijenja preko `ThemeToggle`.
- Odjava zove `clearAuth()` i vraca na auth flow.

Sto fali:

- Odvojeni Settings screen otvoren gumbom iz profila.
- Edit profila:
  - ime
  - profilna slika/avatar
  - eventualno username/bio
- History eventova na koje se korisnik pridruzio.
- Mjesto za rating organizatora nakon zavrsenog eventa.
- History lajkanih reelova/eventova.
- Transaction history za kupljene ulaznice.
- Backend endpointi za profile update, avatar upload, history i transactions.

### Auth

Postoji:

- `app/(auth)/index.tsx` login.
- `app/(auth)/register.tsx` registracija.
- Email/password login i register.
- Google id token auth preko `expo-auth-session`.
- Apple sign in preko `expo-apple-authentication`.
- Token se sprema u SecureStore.

Backend:

- `AuthController`
- `AuthService`
- `AuthMapper`
- `UserRow`
- `PasswordPolicy`
- `JwtService`
- `JwtAuthenticationFilter`
- `SecurityConfig`

Sto fali:

- Refresh token model ili svjesna odluka da access token traje dugo.
- Logout invalidacija tokena ako bude potrebna.
- Profile update endpoint.
- Avatar storage.
- Account delete/deactivate.

## Backend dokumentacija

### Pokretanje

Postojeci backend README vec sadrzi lokalni setup. Baza:

```bash
docker run -d --name gik-pg \
  -e POSTGRES_PASSWORD=gik \
  -e POSTGRES_USER=gik \
  -e POSTGRES_DB=gik \
  -p 5432:5432 \
  postgres
```

Backend:

```bash
cd backend
export JAVA_HOME=$(/usr/libexec/java_home)
SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run
```

Default:

- `DB_URL=jdbc:postgresql://localhost:5432/gik`
- `DB_USERNAME=gik`
- `DB_PASSWORD=gik`
- `SERVER_PORT=8080`

Frontend API URL:

- iOS simulator: `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api`
- Android emulator automatski mijenja localhost u `10.0.2.2` u `core/api/http-client.ts`, ali moze se koristiti `EXPO_PUBLIC_ANDROID_API_BASE_URL`.

### Event backend trenutno

`EventController`:

- `GET /api/events` -> `EventService.getEvents()`
- `GET /api/feed` -> `EventService.getFeed()`
- `POST /api/events` -> `EventService.createEvent()`

`EventService`:

- Validira osnovna required polja.
- Parsira `whenISO`.
- Normalizira `visibility` na `public` ili `private`.
- Kreira `id` prefiksa `created-`.
- `participantCount` inicijalno postavlja na `1`.
- Mapira `EventRow` u `AppEventDto`.

`EventMapper.xml`:

- `findAll` vraca samo `visibility = 'public'`, sort ASC.
- `findFeed` vraca samo `visibility = 'public'`, sort DESC.
- `insert` sprema osnovna event polja.

Ogranicenje:

- Trenutni `event_type` je vise frontend filter/prototip (`nearby`, `joined`, `created`) nego pravi domain model.
- `visibility = private` postoji u bazi, ali private eventi se ne vracaju kroz public endpoint i nema friends access logike.

### Ciljani event domain

Event bi trebao podrzati:

- `id`
- `creator_user_id`
- `title`
- `address`
- `coordinates` za generalnu lokaciju
- `entrance_coordinates` za tocna vrata/ulaz
- `entry_instructions`
- `details/description`
- `start_at`, `end_at`
- `visibility`: `public`, `friends`
- `attendance_mode`: `open`, `waitlist`, `paid`
- `price_amount`, `price_currency` za paid event
- `capacity` opcionalno
- `status`: `draft`, `published`, `cancelled`, `finished`
- `participant_count`
- `organizer_rating_average`
- `organizer_rating_count`
- `created_at`, `updated_at`

Media:

- `event_media`
  - `id`
  - `event_id`
  - `media_type`: `image`, `video`
  - `url`
  - `thumbnail_url`
  - `sort_order`
  - `created_at`

Join/attendance:

- `event_participants`
  - `event_id`
  - `user_id`
  - `status`: `joined`, `left`, `waitlisted`, `approved`, `rejected`
  - `joined_at`
  - `approved_at`
  - unique `(event_id, user_id)`

Organizer rating:

- `event_organizer_ratings`
  - `event_id`
  - `organizer_user_id`
  - `rater_user_id`
  - `rating`
  - `comment`
  - `created_at`
  - unique `(event_id, rater_user_id)`

Likes/Reels:

- `event_likes`
  - `event_id`
  - `user_id`
  - `created_at`
  - unique `(event_id, user_id)`
- Ako reels postane odvojen od eventa:
  - `reels`
  - `reel_media`
  - `reel_likes`
  - `reel_impressions`

Tickets/transactions:

- `ticket_products`
- `orders`
- `order_items`
- `payments`
- `transactions`

Messages:

- `chat_rooms`
  - `id`
  - `type`: `dm`, `private_group`, `public_group`, `event`
  - `event_id` nullable
  - `title`
  - `is_admin_only`
  - `created_by`
  - `created_at`
- `chat_members`
  - `chat_room_id`
  - `user_id`
  - `role`: `owner`, `admin`, `member`
  - `joined_at`
- `messages`
  - `id`
  - `chat_room_id`
  - `sender_user_id`
  - `type`: `text`, `event_share`, `poll`, `system`
  - `body`
  - `event_id` nullable za share card
  - `created_at`
- `polls`
- `poll_options`
- `poll_votes`

Friends:

- Trenutna tablica `friends` je static/prototip.
- Treba realni model:
  - `friendships`
  - status `pending`, `accepted`, `blocked`
  - requester/receiver ids

Profile/settings:

- Prosiriti `app_users` ili dodati `user_profiles`.
- Potrebno:
  - profile image URL
  - display name
  - locale preference
  - theme preference mozda ostaje lokalno, osim ako se synca server-side

## Prioriteti implementacije

Detaljni operativni plan i status svake faze vodi se u `FAZE.md`. README drzi sazetak:

- Faza 0 - Dokumentacija i smjer: rijeseno 2026-04-18.
- Faza 1 - Glavni tabovi i navigacija: rijeseno 2026-04-18.
- Faza 2 - Event domain i baza: rijeseno 2026-04-18.
- Faza 3 - Mapa MVP+: sljedeca faza.
- Faza 4 - Join state i event details.
- Faza 5 - Reels/FYP.
- Faza 6 - Kalendar.
- Faza 7 - Poruke i event chat.
- Faza 8 - Profil i postavke.
- Faza 9 - Placanja, rating i polish.

Kad se status faze promijeni, prvo azuriraj `FAZE.md`, a zatim ovaj sazetak ako je potrebno.

## UI i dizajn pravila za ovaj projekt

- Ne raditi landing page. Aplikacija je alat, prvi screen nakon login-a je iskustvo aplikacije.
- Drzati native mobile feel.
- iOS:
  - koristiti `expo-router/unstable-native-tabs` i iOS tab blur gdje vec postoji.
  - koristiti Liquid Glass za overlaye, bottom sheetove, search bar, floating actions, modalne povrsine i eventualno cards gdje ima smisla.
  - obavezno provjeriti dostupnost API-ja preko `isLiquidGlassAvailable()` i `isGlassEffectAPIAvailable()`.
- Android:
  - koristiti themed translucent surfaces, elevation i MapLibre.
  - ne forsirati iOS glass ako platforma nije iOS.
- Koristiti postojece theme tokene iz `core/theme/tokens.ts`.
- Koristiti `AppText`, `AppButton`, `AppCard`, `AppScreen`, `AppHeader`, `ThemeToggle`.
- Novi tekst mora ici kroz `core/i18n/translations.ts` za `hr` i `en`.
- Za server state koristiti React Query.
- Za lokalne preference koristiti Zustand persist.
- Za auth token koristiti SecureStore, ne AsyncStorage.

## Dokumentacija trenutnih ogranicenja

- Event create screen (`app/create-event.tsx`) salje address, start/end time, visibility, attendance mode, paid price/currency, capacity, entrance pin i entry instructions.
- `app/entrance-map-picker.tsx` je povezan u create event flow i puni `entranceCoordinates`.
- Ako korisnik ne odabere entrance pin, create flow koristi zadnju poznatu korisnicku lokaciju kao event coordinates.
- `EventDetailScreen` (`app/event/[id].tsx`) zna prikazati `address`, `entryInstructions`, `visibility`, `attendanceMode`, paid price, capacity, `endAt`, organizer rating i `entranceCoordinates` ako postoje.
- `EventDetailSheet` na mapi jos ne prikazuje entrance data ni join button.
- `favoriteEventIds` postoji u `app-store.ts`, ali finalni proizvod ne treba saveanje.
- Joined/liked/favorite su lokalni i nisu sinkronizirani s backendom.
- Messages su samo conversation list, ne realni chat.
- Friends su staticki/prototip podaci iz `friends` tablice.
- Backend `/api/events` i `/api/feed` vracaju samo `public/published` evente i jos nemaju per-user friends access logiku.
- Profil nema settings sub-route, edit profil, avatar, activity history ni transactions.

## Sto paziti kod dokazivanja koda

Kod dokazivanja ili objasnjavanja projekta moze se referencirati:

- Frontend routing: `Gdje-I-Kada-Native/app/_layout.tsx`, `app/(tabs)/_layout.tsx`.
- Mapa: `EventsMapExperience`, `EventMap`, `EventMapSurface`, `EventDetailSheet`.
- iOS Liquid Glass: `components/search/map-search-bar.ios.tsx`, `components/map/event-detail-sheet.tsx`.
- Android MapLibre + clustering: `components/map/event-map-surface.android.tsx`.
- State: `core/store/app-store.ts`, `core/store/auth-store.ts`.
- API layer: `core/api/http-client.ts`, `core/api/services.ts`, `core/api/query-hooks.ts`, `core/api/auth-services.ts`.
- Backend auth: `AuthController`, `AuthService`, `JwtService`, `JwtAuthenticationFilter`, `SecurityConfig`, `AuthMapper.xml`.
- Backend events: `EventController`, `EventService`, `EventMapper`, `EventRow`, `EventMapper.xml`, `AppEventDto`, `CreateEventRequest`.
- Backend DB: `V1__init_schema.sql`, `V3__create_users_table.sql`.
- Backend messages/social prototype: `MessageController`, `MessageService`, `MessageMapper.xml`, `SocialController`, `SocialService`, `SocialMapper.xml`.

## Kratki API target za buduci rad

Eventi:

- `GET /api/events?from=&to=&lat=&lng=&radiusKm=&query=`
- `GET /api/events/{id}`
- `POST /api/events`
- `PATCH /api/events/{id}`
- `POST /api/events/{id}/join`
- `DELETE /api/events/{id}/join`
- `POST /api/events/{id}/ratings`
- `GET /api/users/me/events`
- `GET /api/users/me/liked-events`

Feed:

- `GET /api/feed?cursor=&limit=`
- `POST /api/events/{id}/like`
- `DELETE /api/events/{id}/like`

Messages:

- `GET /api/chats`
- `POST /api/chats`
- `GET /api/chats/{id}/messages`
- `POST /api/chats/{id}/messages`
- `POST /api/chats/{id}/polls`
- `POST /api/polls/{id}/votes`
- `POST /api/chats/{id}/share-event`

Profile:

- `GET /api/users/me`
- `PATCH /api/users/me`
- `POST /api/users/me/avatar`
- `GET /api/users/me/transactions`

## Testiranje i verifikacija

Frontend:

```bash
cd Gdje-I-Kada-Native
npm run lint
npm run ios
npm run android
```

Backend:

```bash
cd backend
./mvnw test
SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run
```

Kod promjena koje diraju i frontend i backend:

1. Dodati Flyway migraciju ako se mijenja DB schema.
2. Pokrenuti backend testove.
3. Pokrenuti frontend lint.
4. Manualno provjeriti login, mapu, FYP, event details i relevantni novi flow.
