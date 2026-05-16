# CLAUDE.md — ADAVA

## Overview

PWA gestiune garderoba personala + asistent AI de moda. **ADAVA** = Adam + Ava (persoane duale feminin/masculin). User incarca haine (poze + metadata), primeste recomandari tinute, istoric conversatii, onboarding conversational.

## Stack

- **Framework:** Next.js 16.2.3 — App Router, Turbopack (⚠️ breaking changes fata de training data, citeste `node_modules/next/dist/docs/`)
- **DB:** SQLite local via `@prisma/adapter-libsql` + `@libsql/client`
- **ORM:** Prisma 7 — client in `src/generated/prisma/`
- **Auth:** NextAuth v5 beta (Auth.js) — JWT strategy
- **AI:** Google GenAI (`@google/genai`) — model `gemini-flash-lite-latest`; `@anthropic-ai/sdk` disponibil
- **Storage:** `public/uploads/` local (+ `@vercel/blob` optional)
- **UI:** shadcn/ui + Tailwind CSS v4 + `@base-ui/react`

## Deploy

- Path: `/opt/adava`
- Service: `adava.service` (port 4821)
- URL public: `https://adava.astancu.eu/` → `.68:4821`
- Runtime: systemd Linux (de la 2026-04-20). **AGENTS.md zice PM2 Windows = STALE**
- ExecStart: `/usr/bin/npm start`, WorkingDirectory `/opt/adava`, EnvironmentFile `/opt/adava/.env.local`, User `andrei`
- **Drop-in override safety:** `/etc/systemd/system/adava.service.d/override.conf` cu `MemoryMax=2G`, `MemoryHigh=1.5G`, `CPUQuota=200%` (aplicat 2026-04-20 dupa incidentul OOM freeze)
- **PM2 eliminat definitiv** — NU reinstala; duplicate supervisor cu systemd → EADDRINUSE loop → OOM

## Commands

```bash
# Dev
cd /opt/adava && npm run dev

# Build (ruleaza prisma generate + next build)
npm run build

# Restart serviciu
sudo systemctl restart adava

# Logs
sudo journalctl -u adava -f

# Status
systemctl status adava
```

## Structura

```
src/
├── app/
│   ├── (auth)/login|register    # UI autentificare (fundal unisex)
│   ├── (main)/                  # Layout principal (sidebar + header + mobile nav)
│   │   ├── dashboard/           # Homepage
│   │   ├── assistant/           # Chat AI (SSE streaming, dropdown istoric sesiuni)
│   │   ├── wardrobe/            # Catalog haine
│   │   ├── history/             # Istoric tinute + conversatii
│   │   └── profile/             # Profil + toggle tema instant
│   ├── onboarding/              # Flow onboarding conversational
│   ├── api/
│   │   ├── assistant/chat/      # POST SSE streaming cu Gemini
│   │   ├── sessions/[id]/close/ # Inchide sesiune + Gemini summary → UserMemoryFact
│   │   └── cron/
│   │       ├── auto-close-sessions/  # Inactivitate 4h + ≥3 mesaje
│   │       └── compact-memory/       # Gated de MEMORY_COMPACTION_ENABLED
│   └── lib/
│       ├── ai/                  # GenAI client + context-builder + prompts (Ava/Adam)
│       └── onboarding/seed-memory.ts
└── middleware.ts                # Auth guard + FORCE_ONBOARDING redirect
```

## Env vars (`.env.local`)

- `TURSO_DATABASE_URL` — `file:./prisma/garderoba.db` (SQLite local)
- `GOOGLE_AI_API_KEY`
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob (optional)
- `CRON_SECRET` — protejeaza endpoint-urile cron
- `NEXT_PUBLIC_PERSONA_ADAM_ENABLED` — feature flag persona masculin
- `FORCE_ONBOARDING` — forteaza onboarding pt useri noi
- `MEMORY_COMPACTION_ENABLED` — optional

## Conventions

- **Prisma client in `src/generated/prisma/`** — NU `@prisma/client` direct; regenereaza dupa `prisma generate`
- **Prisma 7 + libsql** — NU `url` in `schema.prisma`, adaptorul e obligatoriu; NU `prisma db push` (incompatibil cu libsql://), aplica schema manual via SQL
- **NextAuth v5 beta:** cookie prefix `authjs`, middleware `getToken({ cookieName, salt })`, NU `PrismaAdapter` cu credentials+JWT (rupe login), `signIn()` poate arunca exceptie → wrap in try-catch
- **Streaming SSE:** `data: ${JSON.stringify({ text })}\n\n` + `[DONE]` la final, `sessionId` emis ca chunk separat la sesiune noua
- **Persona system:** Ava (default feminin, Playfair) + Adam (masculin, Cormorant Garamond navy/gold, gated de env + `session.user.sex === "male"`)

## Memory system (3 straturi)

1. **ChatMessage** — mesaje brute
2. **SessionSummary** — rezumat Gemini la inchidere sesiune (occasion, outfit, keyInsights)
3. **UserMemoryFact** — fapte consolidate user (confidence 1-5)

`lib/ai/context-builder.ts` include toate trei in system prompt AI.

## Gotchas

- **Next.js 16 e nou** — APIs, conventii, structura diferite de training. AGENTS.md are rules `<!-- BEGIN:nextjs-agent-rules -->` — respecta-le
- **AGENTS.md stale pe deploy** — zice PM2 Windows + Task Scheduler, realitatea e systemd Linux de la 2026-04-20
- **NU reinstala PM2** — incident 2026-04-20 22:22: PM2 + systemd concomitent → EADDRINUSE 4821 → loop restart 77 iteratii → OOM → freeze server fizic
- **`login-background.mp4` 1MB** si `adam logo.png` 167KB — in root (nu public/); atent la deploy daca se schimba
- **Cron jobs** — nu mai Windows Task Scheduler; foloseste systemd timer daca e nevoie, sau curl manual
- **Schema changes manual** — ALTER TABLE direct pe `prisma/garderoba.db` via `@libsql/client`

## Ce NU este

- NU aplicatie publica cu multi-tenant — single-user per cont, uz personal
- NU foloseste Vercel/cloud — tot local pe `.68`

@AGENTS.md
