# ReserveChain — Mobile (iOS + Android, React Native / Expo)

> ## Status: BUILT, NEVER RUN ON A DEVICE
>
> Nothing here has been executed on a simulator, an emulator or hardware, and no
> binary has ever been produced. Verified only by `npm ci`, `eslint` and
> `tsc --noEmit`.
>
> - **No native build exists.** EAS Build needs an Expo account, an Apple team id
>   and Google Play service-account credentials. This project has none, so
>   `eas build` has never been run and `eas.json` carries build profiles only —
>   no project id, no credentials. `eas init` must create the project id.
> - **No Maestro flow has ever been executed.** The six flows under `.maestro/`
>   are written against `testID`s in the screens; running them needs a device or
>   emulator with the app installed. They are unproven, not passing.
> - **No screen has been rendered against a live backend.** The API and CMS run
>   locally under Docker Compose; nothing is deployed, and there is no hosted
>   host for the app to talk to.
> - **Nothing is published to any app store**, and this is not a submission-ready
>   binary. An app-store listing reaches the public directly, so read the
>   compliance notes below before treating it as one.
>
> The overlay was written against an API that does not exist in this shape —
> passport, programs, waitlist and investor-status payloads were all invented.
> Those were corrected on apply (see the commit), but no screen has been
> exercised end to end against the real backend, so treat the data paths as
> unverified rather than fixed.

Cross-platform app (iOS + Android, plus web via Expo) that consumes the existing backend API and Payload CMS. Built with **Expo SDK 51 + Expo Router + TypeScript**.

## Features

- **Home** — intro, navigation, prelaunch disclosure.
- **Programs** — list + detail for Copper Powder / Nickel Wire (from the CMS public endpoint).
- **Digital Asset Passport** — provenance view; token mapping shown only for activated lots (sanitized public endpoint).
- **Register interest (waitlist)** — multi-field form with **required eligibility consent**, posts to the backend.
- **Investor** — register / log in (token stored in `expo-secure-store`), view KYC status; gated modules shown inactive.
- **i18n EN / ES / IT** with an in-app switcher (auto-detects device locale).
- **Dark-first theme** matching the web design tokens.
- Exact **verbatim prelaunch disclosure** on every screen; all figures labeled *illustrative*.

## Project layout

```
mobile/
  app/                     # Expo Router routes
    _layout.tsx            # providers (locale, auth), stack navigator
    index.tsx              # Home
    programs/index.tsx     # list
    programs/[slug].tsx    # detail
    passport/[slug].tsx    # Digital Asset Passport
    waitlist.tsx           # register interest
    investor/index.tsx     # login / register / status
  src/
    theme.ts               # design tokens
    constants.ts           # verbatim disclosure, token symbol
    api/client.ts          # fetch wrapper (API + CMS bases)
    api/types.ts
    i18n/                  # i18n-js + en/es/it
    components/            # UI kit, Disclosure, LocaleSwitcher
    context/               # LocaleContext, AuthContext
```

## Configuration

Copy `.env.example` to `.env` and set the public bases.

`EXPO_PUBLIC_*` variables are **inlined into the shipped bundle** and readable by
anyone who downloads the app — they are published, not configured. Only the two
base URLs belong here, and only because the endpoints they name already serve
unauthenticated callers. Never put a token, key or account identifier in one.

```
EXPO_PUBLIC_API_BASE=http://localhost:4000/api
EXPO_PUBLIC_CMS_BASE=http://localhost:3001/api
```

There is no default host: an unset base fails the first request with
`not_configured` rather than pointing at a domain this project does not control.
A simulator reaches your machine on `localhost`; a physical device needs your
LAN IP, e.g. `http://192.168.1.20:4000/api`.

## Run

```bash
cd mobile
npm install
npm run start        # Expo dev server (scan QR with Expo Go)
npm run ios          # iOS simulator
npm run android      # Android emulator
npm run typecheck    # tsc --noEmit
```

## Build (store binaries)

Use EAS Build:

```bash
npm install -g eas-cli
eas login
eas build --platform ios
eas build --platform android
```

iOS bundle id / Android package: `io.reservechain.app`.

`eas.json` defines development, preview and production profiles and contains no
project id, no Apple team id and no Google service-account reference. Those are
per-account values and must not be committed.

## Backend endpoints consumed

| Screen | Method + path | Base |
| --- | --- | --- |
| Programs list | `GET /asset-programs?where[status][equals]=published` | CMS |
| Program detail | `GET /asset-programs?where[slug][equals]=…` | CMS |
| Passport | `GET /passports/public/:slug` | CMS |
| Waitlist | `POST /waitlist` | API |
| Register | `POST /investor/register` | API |
| Login | `POST /investor/login` | API |
| Status | `GET /investor/status` | API |

> No backend addition is needed. The overlay called `/asset-programs/public`,
> which does not exist — the CMS defines exactly one custom endpoint,
> `/passports/public/:slug`. Programs now use Payload's standard collection REST,
> where the collection's own access control already restricts anonymous callers
> to published documents.
>
> The four gated modules (proof-of-reserves, redemption, wallet, purchase) have
> **no screen in this app and no client method**. They refuse every request with
> `501` and hold no data; nothing here presents a reserve figure, a redemption
> form, a wallet-linking flow or a purchase surface.
