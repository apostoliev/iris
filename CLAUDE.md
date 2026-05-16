# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Kin** — a private relationship network for hotel guests and the place-makers who serve them. AI engine **Maître** classifies, routes, abstracts, and drafts but never speaks to guests directly. Built for the Rosewood AI Hackathon at Rosewood Sand Hill.

## Commands

- `npm run dev` — start Next.js dev server (port 3000)
- `npm run build` — production build (runs `prisma generate` first)
- `npm run start` — start production server
- `npm run seed` — seed the database (Maria, Diana, Tomás + Apostoli, Lena + prior thread + one pre-seeded RawNote with briefs)
- `npx prisma migrate dev --name <name>` — create + apply migration
- `npx prisma migrate deploy` — apply pending migrations (runs on Railway boot via `start-with-migrations.sh`)
- `npx prisma studio` — open Prisma Studio for DB inspection
- `npx tsc --noEmit` — TypeScript check

## Architecture

### Maître engine (`lib/maitre/`)

Three pipelines, all hitting Anthropic via `lib/anthropic.ts`:

- `classify.ts` — Haiku 4.5; returns `{sensitivity: high|medium|low, themes[], suggestedRoles[]}` parsed from JSON
- `abstract.ts` — Sonnet 4.6; produces a role-appropriate Brief and is system-prompted to redact sensitive detail by role
- `draft.ts` — Sonnet 4.6; ghostwrites a message from a place-maker to a guest in that place-maker's voice
- `index.ts` (`runMaitre`) — orchestrator: classify → `Promise.all([abstract × placeMakers, draft])` → DB writes → SSE events

System prompts in `prompts.ts` are sent with `cache_control: ephemeral` to keep dev loops cheap.

### Data flow

1. Staff captures an observation — typed via `/api/dictate/complete`, or spoken via Pipecat → `/api/pipecat/webhook` (same downstream path). Writes a `RawNote`.
2. `runMaitre()` fires async. Per-role `Brief`s are written + a `MessageDraft` from the source place-maker.
3. Staff approves a draft → `/api/messages/[draftId]/approve` writes a `Message`, sends Twilio SMS, emits SSE `message.sent`.
4. Guest replies in-app → `/api/messages/reply` writes a `GuestReply`, emits SSE `guest.replied`.
5. Staff dashboard and guest view both subscribe to `/api/stream/guest-${guestId}` (SSE).

### Realtime (`lib/events.ts`)

A singleton Node `EventEmitter` on `globalThis.__kinBus`. `publish(event)` fans out; `subscribe(channel, handler)` returns an unsubscribe. Events: `note.captured`, `regenerate.started`, `brief.updated`, `draft.ready`, `message.sent`, `guest.replied`, `regenerate.completed`. Channel name is `guest-${guestId}` for everything tied to a guest. `/api/stream/[channel]/route.ts` opens a ReadableStream with 15s heartbeats and proper cleanup on `req.signal.abort`.

### Voice ingestion (Pipecat)

`pipecat-agent/bot.py` is a minimal Pipecat Cloud agent: DailyTransport with `transcription_enabled=True`, **no LLM, no TTS**. A custom `TranscriptCollector` FrameProcessor buffers `TranscriptionFrame`s and POSTs the final concatenated transcript to `/api/pipecat/webhook` on `on_participant_left`. The Next.js app starts a session via `lib/pipecat.ts` calling `https://api.pipecat.daily.co/v1/public/{AGENT_NAME}/start`; the Daily room URL is opened in a popup from `CaptureModal`.

### Audio output (ElevenLabs)

`lib/elevenlabs.ts` is a thin TTS helper using fetch. `/api/briefs/[briefId]/audio` synthesizes a spoken version of a single Brief. Each role has a default voice ID in `DEFAULT_VOICE_IDS`. **Audio is staff-facing only — guests never hear an AI voice.** The Play button lives on the `Brief` component.

### Twilio outbound (`lib/twilio.ts`)

`sendSms({to, body})` returns `{sid}` on success or `{skipped, reason}` if Twilio isn't configured / fails. Called from `/api/messages/[draftId]/approve`. The SMS body always includes a deep link back into the in-app thread (`${NEXT_PUBLIC_APP_URL}/g/${guestId}`). The inbound Twilio webhook (`/api/twilio/inbound`) returns an empty `<Response/>` — inbound is intentionally not parsed in MVP; replies happen in-app.

### UI structure

- `app/(staff)/layout.tsx` — brand chrome + `PersonaSwitcher`. Fetches `placeMaker` rows server-side.
- `app/(staff)/[placemakerSlug]/page.tsx` — dashboard listing guests in this place-maker's circle.
- `app/(staff)/[placemakerSlug]/guests/[guestId]/page.tsx` + `GuestCockpit.tsx` — per-guest cockpit: profile sidebar, `BriefTrio`, `DraftCard`, `Thread`, `CaptureModal`. `GuestCockpit` is the client component that subscribes to SSE and re-fetches briefs/draft/thread on events.
- `app/(guest)/g/[guestId]/page.tsx` + `GuestInbox.tsx` — guest's inbox. Slug-as-token (no auth in MVP).
- `PersonaSwitcher` derives the active slug from `usePathname()`.

Pages that read from Prisma export `dynamic = 'force-dynamic'` so the build doesn't try to pre-render with no DB.

### Voice integrations behave gracefully when env vars are missing

`sendSms` returns `{skipped: true, reason}` instead of throwing. `synthesizeSpeech` returns `{error: ...}`. The CaptureModal `Speak` tab catches Pipecat failures and switches to `Type`. This lets the app demo with partial configuration.

## Conventions

- All Prisma access goes through `lib/db.ts` (singleton, hot-reload-safe in dev)
- API routes set `export const runtime = 'nodejs'` because Prisma and EventEmitter need Node
- Server components are the default; client components are marked `'use client'`. Client-only libs (`useSse`, `EventSource`, dialog/tabs) stay in client files
- No auth in MVP — persona via slug, guest access via URL slug. Frame as "demo mode" in pitch
- Don't add ORM-style abstractions over Prisma; query directly in route handlers and pages

## Reference architecture (NOT for copying)

Patterns drew from prior work in `/Users/apostoliev/Ality/Code/Ality_GuestList_Railway` (orchestration + Anthropic + Twilio + Railway) and `/Users/apostoliev/Ality/Code/Pipecat Cloud Natural Conversation` (Pipecat DailyTransport). Every file in this repo was written fresh during the hackathon — no files copied.
