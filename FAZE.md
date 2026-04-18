# Gdje i Kada - fazni plan rada

Status dokumenta: 2026-04-18  
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
| 2 | Event domain i baza | Nije poceto | Event model pokriva creator, lokaciju, ulaz, visibility, join pravila i media. |
| 3 | Mapa MVP+ | Nije poceto | Mapa ima search, date filter, nearby logiku, detalje i join flow. |
| 4 | Join state i event details | Nije poceto | Join/leave i detalji su server-side i dijele se izmedu mape, FYP-a i kalendara. |
| 5 | Reels/FYP | Nije poceto | FYP radi kao reels feed s media preloadom, likeovima i shareom. |
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

Status: Nije poceto

Cilj:

Event treba iz prototip modela prerasti u pravi domain model za public/friends evente, waitlist, paid/open attendance, media, creator i rating.

Postojece stanje:

- Baza ima `events`, `friends`, `conversations`, `app_users`.
- `events.event_type` je prototip filter (`nearby`, `joined`, `created`), ne pravi domain tip.
- `visibility` ima `public` i `private`, ali zahtjev trazi `public` i `friends`.
- Frontend i backend vec imaju `entranceCoordinates` i `entryInstructions`, ali create flow ih ne salje.

Zadaci backend:

- [ ] Dodati Flyway migraciju za nova event polja:
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
- [ ] Normalizirati `visibility` prema `public` i `friends`.
- [ ] Dodati `event_media`.
- [ ] Dodati `event_participants`.
- [ ] Dodati `event_likes`.
- [ ] Dodati `event_organizer_ratings`.
- [ ] Prosiriti `EventRow`, `AppEventDto`, `CreateEventRequest`.
- [ ] Prosiriti `EventMapper.xml`.
- [ ] Prosiriti `EventService` validaciju.

Zadaci frontend:

- [ ] Prosiriti `AppEvent` i `CreateEventPayload`.
- [ ] U create event flow dodati visibility, attendance mode, cijenu ako je paid, entrance pin i entry instructions.
- [ ] Povezati `entrance-map-picker.tsx` s `create-event.tsx`.
- [ ] Ukloniti random offset kao stalno ponasanje create flowa.

Definition of done:

- Novi event se sprema s creatorom, adresom, vremenima, visibilityjem, attendance modeom i entrance podacima.
- Frontend i backend dijele isti model.
- Flyway migracije prolaze na svjezoj bazi.

## Faza 3 - Mapa MVP+

Status: Nije poceto

Cilj:

Mapa postaje primarni discovery ekran: search gore, date filter ispod, mapa u fokusu, event pinovi oko korisnika, detalji i join flow.

Postojece stanje:

- `EventsMapExperience` vec rendera search, mapu, recenter button i `EventDetailSheet`.
- `useMapLocationBootstrap` vec rjesava precise location i fallback.
- Android ima MapLibre clustering.
- iOS ima MapKit i Liquid Glass search/sheet.

Zadaci:

- [ ] Dodati date filter UI odmah ispod search bara.
- [ ] Prosiriti `useEventsQuery` da prima query parametre.
- [ ] Backend `/api/events` dodati `from`, `to`, `lat`, `lng`, `radiusKm`, `query`.
- [ ] Dodati nearby sortiranje ili radius filter.
- [ ] U detaljima prikazati entrance pin i entry instructions.
- [ ] U detaljima prikazati media preview.
- [ ] U detaljima prikazati organizer rating.
- [ ] Dodati join/leave CTA u map detail sheet.
- [ ] Nakon joina pitati korisnika zeli li otvoriti event chat.
- [ ] Zadrzati iOS Liquid Glass na search/filter/sheet povrsinama.

Definition of done:

- Korisnik vidi evente oko sebe i moze filtrirati po datumu.
- Klik na pin otvara detalje s korisnim informacijama.
- Join radi kroz backend, ne samo lokalni store.

## Faza 4 - Join state i shared event details

Status: Nije poceto

Cilj:

Event details i join state trebaju biti isti kroz mapu, FYP, kalendar i direct details screen.

Zadaci backend:

- [ ] `GET /api/events/{id}`.
- [ ] `POST /api/events/{id}/join`.
- [ ] `DELETE /api/events/{id}/join`.
- [ ] `GET /api/users/me/events`.
- [ ] Vracati `joinedByMe`, `likedByMe`, `attendanceStatus` i `canJoin`.

Zadaci frontend:

- [ ] Napraviti shared event details komponentu koja se koristi na mapi, FYP-u i `event/[id]`.
- [ ] Zamijeniti lokalni `joinedEventIds` server stateom gdje god je bitno.
- [ ] Ostaviti lokalni optimistic update samo ako se odmah sinkronizira s backendom.
- [ ] Nakon join responsea otvoriti prompt za event chat ako postoji.

Definition of done:

- Join/leave je per-user i prezivi restart aplikacije.
- Svi ekrani prikazuju isti status eventa.

## Faza 5 - Reels/FYP

Status: Nije poceto

Cilj:

FYP treba raditi kao pravi reels feed za event discovery.

Postojece stanje:

- `app/(tabs)/fyp.tsx` ima vertikalni paged `FlatList`.
- Koristi static cover image preko Picsum.
- Like/favorite/joined su lokalni.

Zadaci:

- [ ] Ukloniti bookmark/favorite UI jer finalni zahtjev nema saveanje.
- [ ] Dodati backend like/unlike.
- [ ] Dodati feed pagination (`cursor`, `limit`).
- [ ] Dodati media model za video/image.
- [ ] Implementirati video player i preload nekoliko itema unaprijed.
- [ ] Otvarati isti event details kao mapa.
- [ ] Share ponuditi prema chatovima i native share kao fallback.
- [ ] Liked history povezati s profilom.

Definition of done:

- Feed je paginiran, like je server-side, details su konzistentni, nema save/bookmark akcije.

## Faza 6 - Kalendar

Status: Nije poceto

Cilj:

Kalendar prikazuje samo evente na koje se korisnik pridruzio, u mjesecnom gridu.

Postojece stanje:

- `calendar.tsx` ima day chipove i filtere.
- Koristi sve evente i lokalni `joinedEventIds`.

Zadaci:

- [ ] Maknuti `all` i `created` filtere iz glavnog kalendara ako ne trebaju finalnom zahtjevu.
- [ ] Koristiti backend `GET /api/users/me/events`.
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
