# Kin

A private relationship network for hotel guests and the place-makers who serve them. Built for the **Rosewood AI Hackathon** at Rosewood Sand Hill.

**Thesis:** Most hospitality AI wants to talk to the guest. Kin is the opposite — AI talks to staff, helps staff talk to guests, and routes context by relationship rather than broadcast.

**Tagline:** *We built the system that lets the people scale.*

## The two-minute demo

1. **Maria** (sommelier at Sand Hill) opens her dashboard. Her circle of guests appears, each with a one-line brief in her voice.
2. She opens **Apostoli's** cockpit. Three role-aware briefs sit side-by-side — same underlying observation, three different abstractions for Maria, Diana (front desk), and Tomás (housekeeping). The sensitive detail never travels to the wrong role. The play button reads the brief aloud (**ElevenLabs**).
3. Maria taps **Capture** and dictates a new observation. **Pipecat Cloud** transcribes; **Maître** classifies (Haiku 4.5), abstracts per role (Sonnet 4.6), and ghostwrites a message draft in Maria's voice.
4. Maria one-taps **Approve**. The guest gets an **SMS via Twilio** with a deep link to a private thread.
5. The guest replies in the thread. **Maria sees the reply live** via SSE.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind + radix primitives
- **Anthropic SDK** — Claude **Sonnet 4.6** (drafting + role abstraction) + **Haiku 4.5** (classification)
- **Prisma** + **Postgres** (Railway)
- **Pipecat Cloud** dictation agent (separate service in `pipecat-agent/`)
- **Twilio** for outbound SMS to the guest's phone
- **ElevenLabs** for staff-facing audio briefs
- **Server-Sent Events** for realtime — no third-party signup
- **Railway** for deploy

## Run locally

```sh
cp .env.example .env.local
# fill in DATABASE_URL, ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, PIPECAT_API_KEY,
# TWILIO_*, DEMO_GUEST_PHONE, NEXT_PUBLIC_APP_URL

npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Open <http://localhost:3000> — you'll land on Maria's dashboard.
The guest view URL is `/g/[guestId]` (the seed script prints Apostoli's id at the end).

## Deploy to Railway

1. New Railway project from this repo
2. Attach a Postgres add-on; copy the `DATABASE_URL`
3. Set env vars (see `.env.example`)
4. Deploy. Healthcheck is `/api/ping`. Migrations run on boot via `start-with-migrations.sh`.

## Deploy the Pipecat dictation agent

See `pipecat-agent/README.md`. It runs on Pipecat Cloud, not Railway.

## What was built during the hackathon

Everything in this repository. The architecture takes inspiration from prior hospitality work, but every file was written fresh for Kin during the event.

## Demo controls

- Persona switcher in the staff header (Maria · Diana · Tomás)
- `?as=<slug>` switches persona on any staff URL
- `?fallback=1` forces the Type tab in the CaptureModal — backup if Pipecat is sluggish
