<div align="center">
  <img src="./assets/banner-hero.svg" alt="Eurotrip" width="100%"/>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Internal-FF1493?style=for-the-badge&labelColor=0D0D0D" alt="Internal"/>
  <img src="https://img.shields.io/badge/Framework-Next.js-0D0D0D?style=for-the-badge&labelColor=0D0D0D" alt="Next.js"/>
  <img src="https://img.shields.io/badge/DB-Supabase-FF1493?style=for-the-badge&labelColor=0D0D0D" alt="Supabase"/>
  <img src="https://img.shields.io/badge/Install-PWA-0D0D0D?style=for-the-badge&labelColor=FF1493" alt="PWA"/>
</p>

<br/>

> **Eurotrip** is a private itinerary app I built for a trip through Europe with mates. There's no landing page, no signup flow for strangers, no marketing — just the app, and a login that gates it to the four of us who were actually on the trip.
>
> Publishing this one is a bit of a flex: **this repo is the landing page.**

<br/>

## What it does

- **Shared itinerary** — every day of the trip, with activities, accommodation, notes, and the running "where we are now" state.
- **Suggested activities** — per-city shortlists pulled from Supabase, so when we hit Barcelona at midnight and couldn't think of anywhere to go, the app already had ideas queued.
- **Installable as a PWA** — manifest + offline-friendly so it worked when reception was patchy (which, in rural Croatia, was often).
- **Cinematic backgrounds** — full-screen looping landscape/portrait video backgrounds pulled from Supabase storage. On the couch in Sydney it's a dumb flourish; on the train into Rome it felt right.
- **Login-gated** — only the four of us. No public signup.

<br/>

## Why it's here, not on a domain

The app is private by design. Publishing it as a public landing page would have meant either gating the whole experience (boring for anyone who lands on the homepage) or exposing real travel data (bad idea). Neither made sense, so — no landing.

But the **code** tells the story cleanly: Next.js server components, Supabase-backed itinerary, a PWA manifest, a middleware-protected auth boundary. That's the portfolio exhibit. Not the product — the build.

<br/>

## Stack

| Layer | Tech |
|---|---|
| Framework | **Next.js** · App Router · TypeScript |
| Rendering | Server Components + Server Actions (`actions/itinerary.ts`) |
| DB / Auth / Storage | **Supabase** — rows for itinerary/activities, storage for background media |
| UI | **shadcn/ui** · Radix · Tailwind |
| PWA | Web App Manifest (`app/manifest.ts`) · installable on iOS + Android |
| Middleware | Auth gate at the edge, so unauthenticated hits never reach the itinerary routes |

<br/>

## Project layout

```
eurotrip/
├── app/
│   ├── page.tsx                       Server component — fetches backgrounds + gates
│   ├── itinerary-client-wrapper.tsx   Client boundary for the main itinerary
│   ├── login/                         Auth form
│   ├── suggested-activities/          Per-city shortlist view
│   └── manifest.ts                    PWA manifest
├── actions/
│   └── itinerary.ts                   Server actions — mutate the trip state
├── middleware.ts                      Auth redirect for unauthenticated users
├── components/
├── hooks/
├── lib/
│   └── supabase-client.ts             Server + client Supabase factories
└── public/
```

<br/>

## Running locally

```bash
pnpm install

# Needs a Supabase project with tables for
#   animations (background media)
#   itinerary (days, activities)
#   suggested_activities (per-city lists)
#   users (auth)
cp .env.local.example .env.local

# Env vars
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY    (server-only)

pnpm dev
```

<br/>

## License

No license granted. Source visible as a portfolio artefact. **All rights reserved.** Also, if you happen to find real itinerary data in here, it's from 2025 — we're home.

<br/>

---

<p align="center">
  <sub>Built by <a href="https://github.com/KezLahd">Kieran Jackson</a> · For four mates · 2025</sub>
</p>
