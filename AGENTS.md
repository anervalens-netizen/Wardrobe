<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Garderoba — Project Reference

Aplicație PWA de gestionare garderobă cu asistent AI de modă. Rulează local la `http://localhost:4821`, expusă extern prin tunel propriu.

## Stack exact

| Layer | Tehnologie |
|---|---|
| Framework | Next.js 16.2.3 — App Router, Turbopack |
| DB | SQLite local via `@prisma/adapter-libsql` + `@libsql/client` |
| ORM | Prisma 7 — client în `src/generated/prisma/` |
| Auth | NextAuth v5 beta (Auth.js) — JWT strategy |
| AI | Google GenAI SDK `@google/genai` — model `gemini-flash-lite-latest` |
| Storage | Local filesystem (folder `public/uploads/`) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Runtime | PM2 — process manager, autostart la boot Windows 11 |

## Deployment local

- **Port:** 4821 (fix, neuzual)
- **Start cu PM2:** `pm2 start node_modules/next/dist/bin/next --name garderoba -- start -p 4821`
- **Build:** `npm run build` (rulează `prisma generate && next build`)
- **Restart după build:** `pm2 restart garderoba`
- **Logs live:** `pm2 logs garderoba`
- **Status:** `pm2 status`
- **Autostart:** configurat prin `pm2-windows-startup`

## Arhitectura cheie

```
src/
  app/
    (main)/          # Layoutul principal (sidebar + header + mobile nav)
      layout.tsx     # SERVER component — citește persona + themeVariant din DB, aplică SSR
      dashboard/     # Homepage
      assistant/     # Chat AI (client component, SSE streaming)
      wardrobe/      # Catalog haine
      history/       # Istoric ținute + conversații (tabs dual)
      profile/       # Profil + preferințe utilizator
    onboarding/      # Flow onboarding conversațional (separat de main layout)
    api/
      assistant/
        chat/        # POST — streaming SSE cu Gemini, scrie ChatMessage în DB
        session/     # GET — sesiunea de azi (ChatSession activ, tip daily)
      sessions/
        route.ts     # GET — istoricul sesiunilor închise
        [id]/close/  # POST — închide sesiune + Gemini summary + UserMemoryFact
      profile/       # GET/PUT — UserProfile + User.name/sex
      cron/
        auto-close-sessions/  # Închide sesiuni inactive 4h cu >=3 mesaje
        compact-memory/       # Compactare UserMemoryFact (gated de MEMORY_COMPACTION_ENABLED)
      onboarding/
        chat/        # POST — chat onboarding cu Gemini
        complete/    # POST — extrage profil din transcript, salvează în DB
  lib/
    prisma.ts        # Prisma client singleton (cu PrismaLibSql adapter)
    auth.ts          # NextAuth config — JWT callback populează id, sex, onboardingCompleted
    feature-flags.ts # serverFeatureFlags + publicFeatureFlags
    ai/
      client.ts          # Google GenAI client singleton
      context-builder.ts # Construiește contextul utilizatorului pentru prompt AI
      fashion-system-prompt.ts      # Prompt Ava (feminin)
      fashion-system-prompt-adam.ts # Prompt Adam (masculin)
    onboarding/
      seed-memory.ts # Seed UserMemoryFact din profilul extras la onboarding
  components/
    layout/          # Sidebar, Header, MobileNav (prop: persona)
    onboarding/      # RerunOnboardingButton + chat onboarding
    ui/              # shadcn/ui components
  middleware.ts      # Auth guard + FORCE_ONBOARDING redirect
```

## Modele DB (Prisma schema)

User → UserProfile (1:1), ChatSession (1:n), UserMemoryFact (1:n)
ChatSession → ChatMessage (1:n), SessionSummary (1:1)
ClothingItem → OutfitItem → Outfit → OutfitWear

**Coloane importante adăugate după baseline:**
- `User.sex`, `User.onboardingCompleted` — adăugate prin ALTER TABLE
- `UserProfile.themeVariant`, `preferredOccasions`, `lifestyleNotes`, `ageBand` — adăugate prin ALTER TABLE
- `Conversation.migrated` — flag migrare legacy

## Persona system

- **Ava** (default, feminin): font Playfair Display, gradient teal, prompt feminin
- **Adam** (masculin, gated): font Cormorant Garamond, palette navy/gold, suportă dark mode
- Condiție activare Adam: `NEXT_PUBLIC_PERSONA_ADAM_ENABLED=true` AND `session.user.sex === "male"`
- Layout server component aplică SSR: `data-persona="adam"` + `.dark` class din DB
- **Light mode Adam**: sidebar alb/gri deschis, text navy
- **Dark mode Adam**: sidebar navy închis, accent cognac/gold

## Memory system (Phase 4)

Trei straturi:
1. **ChatMessage** — fiecare mesaj din conversație, brut
2. **SessionSummary** — rezumat Gemini la închidere sesiune (occasion, outfit, keyInsights)
3. **UserMemoryFact** — fapte consolidate despre utilizator (confidence 1-5)

`context-builder.ts` include toate trei în system prompt AI.

## Reguli critice

**Prisma 7:**
- Nu pune `url` în `schema.prisma` — adaptorul libsql e obligatoriu
- `prisma generate` rulează la build (`build: "prisma generate && next build"`)
- Nu commit `src/generated/prisma/` — e generat la build

**Schema changes:**
- NU se folosește `prisma db push` (incompatibil cu libsql://)
- Modificările de schema se aplică manual cu SQL direct pe `prisma/garderoba.db` via `@libsql/client`

**NextAuth v5:**
- Cookie prefix: `authjs` (nu `next-auth`)
- Middleware: `getToken({ cookieName, salt: cookieName })` — salt obligatoriu
- JWT callback populează: `token.id`, `token.sex`, `token.onboardingCompleted`

**Streaming AI:**
- Format SSE: `data: ${JSON.stringify({ text })}\n\n`
- `[DONE]` la final
- `sessionId` emis ca SSE chunk separat când sesiunea e nouă

## Env vars necesare (.env.local)

| Var | Note |
|---|---|
| `TURSO_DATABASE_URL` | `file:./prisma/garderoba.db` — SQLite local |
| `NEXTAUTH_SECRET` | JWT signing |
| `NEXTAUTH_URL` | URL-ul public al aplicației (ex: https://garderoba.domeniu.ro) |
| `GOOGLE_AI_API_KEY` | Gemini API |
| `BLOB_READ_WRITE_TOKEN` | token storage imagini |
| `CRON_SECRET` | Bearer token cron jobs |
| `NEXT_PUBLIC_PERSONA_ADAM_ENABLED` | "true" pentru Adam |
| `FORCE_ONBOARDING` | "true" forțează onboarding pt useri noi |
| `MEMORY_COMPACTION_ENABLED` | opțional, lasă gol |

## Cron jobs (local — Windows Task Scheduler)

Înlocuiesc cron-urile cloud. Configurate în Windows Task Scheduler să ruleze zilnic:

```bash
# auto-close-sessions — zilnic la 02:00
curl -H "Authorization: Bearer CRON_SECRET" http://localhost:4821/api/cron/auto-close-sessions

# compact-memory — zilnic la 03:00
curl -H "Authorization: Bearer CRON_SECRET" http://localhost:4821/api/cron/compact-memory
```
