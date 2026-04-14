<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Garderoba — Project Reference

Aplicație PWA de gestionare garderobă cu asistent AI de modă. Deployment: https://garderoba.vercel.app

## Stack exact

| Layer | Tehnologie |
|---|---|
| Framework | Next.js 16.2.3 — App Router, Turbopack |
| DB | Turso (cloud SQLite) via `@prisma/adapter-libsql` |
| ORM | Prisma 7 — client în `src/generated/prisma/` |
| Auth | NextAuth v5 beta (Auth.js) — JWT strategy |
| AI | Google GenAI SDK `@google/genai` — model `gemini-flash-lite-latest` |
| Storage | Vercel Blob — imagini haine |
| UI | shadcn/ui + Tailwind CSS v4 |

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
scripts/
  push-schema.mjs           # Creare tabele inițiale (Phase 1 baseline)
  apply-phase1-migration.mjs # ALTER TABLE + CREATE TABLE pentru toate coloanele/tabelele adăugate
  migrate-conversations.ts   # Migrare Conversation (legacy) → ChatSession + ChatMessage
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
- Nu commit `src/generated/prisma/` — e generat la build pe Vercel

**Schema push pe Turso:**
- NU se folosește `prisma db push` (incompatibil cu libsql://)
- Se folosește `node scripts/apply-phase1-migration.mjs` pentru ALTER TABLE/CREATE TABLE
- Scriptul e idempotent (ignoră duplicate columns, IF NOT EXISTS)

**NextAuth v5:**
- Cookie prefix: `authjs` (nu `next-auth`)
- Middleware: `getToken({ cookieName, salt: cookieName })` — salt obligatoriu
- JWT callback populează: `token.id`, `token.sex`, `token.onboardingCompleted`

**Env vars Turso:**
- Întotdeauna `.trim()` pe `TURSO_DATABASE_URL` și `TURSO_AUTH_TOKEN` — Vercel adaugă newline trailing

**Streaming AI:**
- Format SSE: `data: ${JSON.stringify({ text })}\n\n`
- `[DONE]` la final
- `sessionId` emis ca SSE chunk separat când sesiunea e nouă

## Env vars necesare (Vercel Production)

| Var | Scope | Note |
|---|---|---|
| `TURSO_DATABASE_URL` | Production | libsql://... |
| `TURSO_AUTH_TOKEN` | Production | token Turso |
| `NEXTAUTH_SECRET` | Production | JWT signing |
| `NEXTAUTH_URL` | Production | https://garderoba.vercel.app |
| `GOOGLE_AI_API_KEY` | Production | Gemini API |
| `BLOB_READ_WRITE_TOKEN` | Production + Preview | Vercel Blob |
| `CRON_SECRET` | Production | Bearer token cron jobs |
| `NEXT_PUBLIC_PERSONA_ADAM_ENABLED` | Production + Preview | "true" pentru Adam |
| `FORCE_ONBOARDING` | All envs | "true" forțează onboarding pt useri noi |
| `MEMORY_COMPACTION_ENABLED` | Production | opțional, lasă gol |
