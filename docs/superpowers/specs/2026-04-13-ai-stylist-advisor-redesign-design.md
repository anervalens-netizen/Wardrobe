# AI Stylist Advisor — Redesign Spec

**Date:** 2026-04-13
**Status:** Approved (awaiting implementation plan)
**Owner:** Andrei

## 1. Context & Goal

The current app is branded "Ava" — a feminine AI stylist with a violet/teal palette. It serves only women in practice, even though the codebase is gender-agnostic.

Goal: rebrand the product as the umbrella **"AI Stylist Advisor"**, introduce a conversational AI onboarding flow, and split the post-auth experience into two distinct personas:

- **Ava** (existing) — feminine experience, violet/teal palette, romantic serif italic typography
- **Adam** (new) — masculine experience, navy + cognac palette (light default + dark toggle), Cormorant Garamond serif typography, analytical-elegant tone

In addition: build a robust persistent memory system so the AI remembers user preferences, outfit decisions, and feedback across sessions — both daily continuous sessions and user-created thematic sessions.

This is not a UI tweak. It is a foundational redesign that touches branding, auth/landing, onboarding (new), routing, theming, AI prompts, database schema, chat UI, and adds a memory subsystem.

## 2. High-level Architecture

### 2.1 Branding hierarchy

- **AI Stylist Advisor** — public umbrella name on landing page, auth pages, PWA metadata
- **Ava** — feminine persona post-onboarding (existing experience, refined)
- **Adam** — masculine persona post-onboarding (new)

### 2.2 Persona routing

There are NO separate routes per persona (no `/ava` or `/adam`). Routes remain unified (`/dashboard`, `/wardrobe`, `/assistant`, etc.). The `(main)/layout.tsx` uses a `ThemeProvider` that reads `session.user.sex` and applies the correct CSS tokens, fonts, icons, category lists, and AI prompts.

Middleware enforces this flow on each authenticated request:

```
1. user.onboardingCompleted == false  → redirect /onboarding
2. user.sex == "female"               → render with Ava theme
3. user.sex == "male"                 → render with Adam theme
```

### 2.3 Feature flags (env vars)

All flags ship as `false` and are flipped per phase after staging validation:

- `FORCE_ONBOARDING` — middleware forces existing users into onboarding
- `NEXT_PUBLIC_PERSONA_ADAM_ENABLED` — unlocks the Adam theme + categories + prompts
- `NEXT_PUBLIC_THEMATIC_SESSIONS_ENABLED` — shows "+ New conversation" button in chat
- `MEMORY_COMPACTION_ENABLED` — allows the nightly cron to run consolidation

## 3. Database Schema Changes

### 3.1 Modifications to existing tables

```prisma
model User {
  // existing fields...
  sex                 String?   // "female" | "male" | null (pre-onboarding)
  onboardingCompleted Boolean   @default(false)
}

model UserProfile {
  // existing fields...
  themeVariant       String?   // "light" | "dark" — Adam-only for now
  preferredOccasions String?   // JSON array, populated from onboarding
  lifestyleNotes     String?   // free text from onboarding
}
```

### 3.2 New tables

```prisma
model ChatSession {
  id              String        @id @default(cuid())
  userId          String
  type            String        // "daily" | "thematic"
  title           String?       // "Pregătire nuntă", "Vacanță Italia", etc.
  startedAt       DateTime      @default(now())
  closedAt        DateTime?     // null = active
  closureMethod   String?       // "user" | "auto" | "ai_prompted"

  user     User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages ChatMessage[]
  summary  SessionSummary?

  @@index([userId, closedAt])
}

// Note: outfit decision tracking lives on SessionSummary.outfitId (single source of truth).
// We do NOT duplicate the outfit reference on ChatSession.

model ChatMessage {
  id        String   @id @default(cuid())
  sessionId String
  role      String   // "user" | "assistant"
  content   String
  createdAt DateTime @default(now())

  session ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
}

model SessionSummary {
  id              String   @id @default(cuid())
  sessionId       String   @unique
  userId          String
  occasion        String?  // "birou", "cină", "weekend", etc.
  outfitChosenText String?
  outfitId        String?  // FK to Outfit if recorded
  outcome         String?  // user feedback, free text
  keyInsights     String?  // JSON array of strings
  generatedAt     DateTime @default(now())

  session ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user    User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  outfit  Outfit?     @relation(fields: [outfitId], references: [id])

  @@index([userId, generatedAt])
}

model UserMemoryFact {
  id              String   @id @default(cuid())
  userId          String
  type            String   // "preference" | "aversion" | "pattern" | "note"
  content         String
  confidence      Int      @default(1)  // 1-10, increments on re-confirmation
  sourceCount     Int      @default(1)  // number of sessions that produced this fact
  lastConfirmedAt DateTime @default(now())
  createdAt       DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, type])
}

model MemoryCompactionLog {
  id                String   @id @default(cuid())
  userId            String
  sessionsCompacted Int
  factsCreated      Int
  runAt             DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### 3.3 Critical indexes

- `ChatMessage.sessionId` — message lookup per session
- `ChatSession.userId, closedAt` — split active vs closed in sidebar lists
- `SessionSummary.userId, generatedAt` — chronological memory loading
- `UserMemoryFact.userId, type` — fast filtering by fact type

### 3.4 Migration of legacy `Conversation` table

The existing `Conversation` table stores messages as a JSON string. We migrate via a one-off script with explicit idempotency:

1. Add a `migrated Boolean @default(false)` column to `Conversation` in Phase 1
2. The migration script processes only rows with `migrated=false`
3. After successful migration of a row, set `migrated=true`

```
For each Conversation row WHERE migrated = false:
  1. Create ChatSession (type="daily", startedAt=createdAt, closedAt=updatedAt)
  2. Parse Conversation.messages JSON
  3. For each {role, content}, create ChatMessage with createdAt distributed
     proportionally between startedAt and closedAt
  4. Do NOT generate SessionSummary for legacy conversations (we lack
     fidelity — risk of false data)
  5. Set Conversation.migrated = true (commit per-row, so partial runs are safe)
```

Re-running the script is safe: already-migrated rows are skipped. The `Conversation` table is kept read-only for one week after Phase 4 ships, then dropped after exporting the entire table to a Vercel Blob backup.

## 4. Conversational Onboarding Flow

### 4.1 Trigger

After register or login, if `user.onboardingCompleted == false`, middleware redirects to `/onboarding`.

### 4.2 UI

`/onboarding` is a focused chat interface:
- Header: "AI Stylist Advisor" with a subtle sparkle (neutral, no Ava/Adam branding yet)
- No sidebar, no main navigation — single-purpose page
- AI opens the conversation automatically; user does not type first

### 4.3 Conversation script (8-10 turns)

The AI uses a dedicated `onboarding-system-prompt.ts` that instructs it to:
- Ask one thing at a time (no batching)
- React warmly to each answer ("Îmi place numele tău, X")
- Extract structured info per turn (parsed from response)

Topics covered:
1. Preferred name (how they want to be addressed)
2. Sex → AI introduces itself as Ava or Adam immediately ("Mă bucur, X. De acum sunt Ava, stilista ta personală.")
3. Approximate age (optional, for generational context)
4. Dominant style (casual / business / eclectic) — multiple choice in chat
5. Frequent occasions (office / outings / special events)
6. Favorite colors + colors to avoid
7. Body type (optional, asked diplomatically)
8. Free text closer ("Mai e ceva ce vrei să știu despre tine sau stilul tău?")
9. Closing promise: "Am notat tot. Hai să-ți construim împreună garderoba digitală."

### 4.4 Multiple-choice in chat

For discrete-option questions (sex, style, occasions, colors), instead of free text the AI renders quick-reply buttons under its message:

```
AI: "Cum te-ai descrie cel mai bine? Poți alege mai multe."
[ Casual ] [ Business ] [ Elegant ] [ Sportiv ] [ Bohemian ]
```

Click → choice becomes a user message in chat → AI continues.

### 4.5 API endpoints

- `POST /api/onboarding/chat` — streams Gemini with onboarding system prompt + accumulated context
- `POST /api/onboarding/complete` — receives the final extracted profile, persists `User.sex`, `User.onboardingCompleted=true`, populates `UserProfile` (including `preferredOccasions` and `lifestyleNotes`), then redirects to `/dashboard`

### 4.6 Anti-stuck protection

A "Sări peste" button next to input lets the user skip a question. If they skip the sex question (critical), AI asks once more gently. If skipped again, a neutral picker appears: "Vezi versiunea Ava sau Adam?" with explicit buttons.

### 4.7 Re-running onboarding

The profile page exposes a "Vorbește din nou cu stilistul tău" action that resets `onboardingCompleted=false` and routes to `/onboarding` again. Useful if the user wants to switch persona or refresh preferences.

### 4.8 Special handling for existing users

When `FORCE_ONBOARDING=true` activates in Phase 2, existing users are redirected on next login. The AI sees their existing `UserProfile` in context and *confirms* rather than asks blank:

> "Văd că ai înălțime 175 cm și preferi stilul casual — e încă valabil?"

This avoids feeling like a reset; existing data is acknowledged and refined.

## 5. Adam Interface Differentiation

### 5.1 CSS tokens — Adam light (default)

```
--background:        oklch(0.97 0.01 80)    /* warm cream */
--foreground:        oklch(0.20 0.03 250)   /* near-black navy */
--card:              oklch(1 0 0)            /* pure white */
--primary:           oklch(0.25 0.06 250)   /* deep navy */
--primary-foreground: oklch(0.92 0.08 80)   /* warm cognac */
--secondary:         oklch(0.55 0.10 60)    /* tobacco/cognac */
--accent:            oklch(0.92 0.04 80)
--muted:             oklch(0.93 0.015 80)
--border:            oklch(0.85 0.02 80)
```

### 5.2 CSS tokens — Adam dark (toggle)

```
--background:        oklch(0.18 0.03 250)   /* deep navy */
--foreground:        oklch(0.92 0.04 80)    /* warm cream */
--card:              oklch(0.22 0.04 250)
--primary:           oklch(0.78 0.12 75)    /* bright cognac */
--secondary:         oklch(0.55 0.10 60)
--accent:            oklch(0.30 0.05 250)
--border:            oklch(0.30 0.04 250)
```

The user toggles via a control in the profile page or header. Preference is persisted in `UserProfile.themeVariant`.

### 5.3 Typography

- Heading: **Cormorant Garamond** (Google Fonts), weights 300–400, no italic
- Body: **Inter**, more geometric than Ava's Nunito

Fonts are loaded conditionally via `next/font/google` based on persona, OR loaded both and selected via CSS variable.

### 5.4 Categories (replace Ava's for Adam users)

```ts
const CATEGORIES_ADAM = [
  "Costume",         // suit, tuxedo
  "Sacouri & Blazere",
  "Cămăși",          // dress + casual shirts
  "Tricouri & Polo",
  "Pantaloni",       // chinos, dress, jeans
  "Outerwear",       // overcoat, trench, jacket
  "Pantofi",         // oxford, derby, loafer, sneakers
  "Accesorii",       // watches, cufflinks, belts, ties, pocket squares
];
```

Subcategories detailed per category. Examples for `Pantofi`: oxford, derby, monk strap, loafer, sneaker. For `Accesorii`: ceas, butoni, curea, cravată, papion, batistă pentru buzunar.

**What gets split, what stays shared:**

Only persona-specific constants are split. Shared constants (used identically across both personas) stay in a single file:

- **Split** (per persona): `CATEGORIES`, `SUBCATEGORIES` → `constants/categories-ava.ts` + `constants/categories-adam.ts`
- **Shared** (one file, no split): `PATTERNS`, `SEASONS`, `FORMALITY`, `CONDITIONS`, `BODY_TYPES`, `SKIN_TONES`, `STYLE_PREFERENCES`, `COLORS` → remain in `constants/shared.ts`

A barrel `constants/index.ts` exports a helper:

```ts
export function getCategories(sex: string | null) {
  return sex === "male" ? CATEGORIES_ADAM : CATEGORIES_AVA;
}

export function getSubcategories(sex: string | null) {
  return sex === "male" ? SUBCATEGORIES_ADAM : SUBCATEGORIES_AVA;
}
```

Shared constants are imported directly without persona switching.

### 5.5 Quick prompts (Adam)

```
- "Cum mă îmbrac la o întâlnire de business?"
- "Recomandă o ținută pentru cina elegantă"
- "Cum combin acest sacou?"
- "Outfit pentru weekend smart-casual"
- "Cum port un ceas cu costum?"
- "Pregătire pentru black tie"
```

### 5.6 Iconography

- Ava: Sparkles (lucide-react) with rounded accents (existing)
- Adam: Diamond / romb (lucide-react) — geometric, fewer rounded corners

Mobile-nav and sidebar labels switch from "Ava AI" to "Adam AI" when persona is male.

### 5.7 AI personality (Adam system prompt)

A new file `src/lib/ai/fashion-system-prompt-adam.ts`:

> Ești Adam, consultantul de stil personal al clientului. Ești elegant, analitic, dar cald — nu rigid. Vorbești în limba română, cu un ton de încredere și expertiză. Explici **de ce** o combinație funcționează (proporții, croială, materiale, ocazie), nu doar **ce** să porți. Folosești limbaj precis: "tailoring slim", "break-ul pantalonului", "patina pielii". Eviți emoji-urile excesive — maxim unul rar. La salutul inițial folosești "Bună seara" sau "Bună ziua, X" (formal-cald). Recomanzi 1-2 ținute solide cu raționament, nu copleșești cu opțiuni.

The Ava system prompt remains as it is.

### 5.8 Layout

Layout structure (sidebar / mobile-nav / header / dashboard) is identical to Ava — only tokens, fonts, content (categories, prompts), and icons differ. This minimizes maintenance overhead.

## 6. Memory System (CORE)

### 6.1 Three-layer architecture

```
Layer 1: ChatMessage (raw)
  Individual messages per session. Deleted after compaction.
  Not used in AI context directly.
                       ▼
Layer 2: SessionSummary (per closed session)
  Generated by AI after session close. Contains occasion, outfit
  chosen, outcome, key insights.
                       ▼
Layer 3: UserMemoryFact (consolidated long-term)
  Distilled facts. Confidence grows with re-confirmation.
  Sole source of truth after compaction. Always in context.
```

### 6.2 Session lifecycle

```
START:
  User enters chat
    Has open daily session for today? → resume it
    Otherwise → create ChatSession (type="daily", closedAt=null)

ACTIVE:
  user ↔ AI exchanges
    Each message saved as ChatMessage
    AI sees: SystemPrompt + Memory.md (built per request) + last N session messages

CLOSURE TRIGGERS (any):
  - User clicks "Închide sesiunea" in chat UI
  - AI detects decision signal ("port X azi", "mulțumesc", "perfect")
    → AI proposes: "Te-ai decis? Pot să notez ținuta?"
    → User confirms → trigger close
  - Inactivity > 4h with > 3 messages → auto-close (cron)

ON CLOSE:
  1. Mark ChatSession.closedAt = now
  2. Async: GenerateSessionSummary
  3. Async: ExtractMemoryFacts
```

### 6.3 SessionSummary generation

Endpoint `POST /api/sessions/[id]/close`:
1. Marks session closed
2. Sends all messages to Gemini with a strict-JSON summary prompt:
   - `occasion` (1-3 words)
   - `outfitChosenText` (free text or null)
   - `outfitItems` (array of clothing item names from wardrobe mentioned as chosen)
   - `outcome` (user feedback / how they felt, or null)
   - `keyInsights` (max 3 strings — new preferences, aversions, patterns)
3. Persists SessionSummary
4. If `outfitItems.length > 0` and user confirms → automatically creates `Outfit` + `OutfitWear` records using the existing schema

### 6.4 ExtractMemoryFacts

Following SessionSummary, a second job:
1. For each `keyInsight`, search existing `UserMemoryFact` for similar content (case-insensitive partial match on `content`)
2. If found → `confidence += 1`, `sourceCount += 1`, `lastConfirmedAt = now`
3. Otherwise → create new `UserMemoryFact` with `confidence=1`

### 6.5 Memory Markdown Builder

In `src/lib/ai/memory-builder.ts`, before each chat request, we build:

```md
# Memoria mea despre Maria

## Profil esențial
- Sex: female | Vârstă: ~32 | Stil dominant: smart-casual

## Preferințe puternice (confidence ≥ 3)
- Materiale naturale (in, bumbac) — confirmat de 5 ori
- Tailoring slim — confirmat de 4 ori

## Aversiuni
- Tocuri înalte — evitat de 3 ori

## Combinații purtate recent (ultimele 30 zile)
- 2026-04-12 (birou): cămașa albă + blazer navy + pantaloni bej → "încrezătoare"
- 2026-04-10 (cină): rochia neagră + cizme → "perfect"

## Sesiuni recente fără decizie (de întrebat)
- [11 apr] Discutat ținuta de conferință, n-a confirmat alegerea
```

This is injected into `systemInstruction` for every chat request, before the current session's messages.

**Token budget:** memory context is capped at ~2000 tokens. If exceeded, prioritize: facts with highest confidence + sessions from the last month.

### 6.6 Compaction (when SessionSummary count > 300)

Vercel Cron endpoint `/api/cron/compact-memory` runs daily at 03:00 (after the 02:00 daily reset):

```
For each user with COUNT(SessionSummary) > 300:
  1. Select sessions older than 60 days (keep 60 days verbatim)
  2. Group by occasion (birou, cină, weekend, ...)
  3. For each group, send Gemini a compaction prompt:
     "Iată 50 de sumarii de sesiuni 'birou' între 2025-12 și 2026-02.
      Extrage maxim 5 pattern-uri consolidate sub formă de UserMemoryFact."
  4. Add patterns as new UserMemoryFact (type="pattern")
  5. Delete the compacted SessionSummary rows
  6. Log run in MemoryCompactionLog (audit)
```

**Safety:** before deletion, export the compacted summaries to a Vercel Blob JSON for recovery.

### 6.7 Edge cases

- **User did not close yesterday** → on opening today's session, AI asks: "Ieri am discutat despre X. Te-ai decis până la urmă? Cum a fost?"
- **User changes sex/persona** → memory persists (it's about the person), only the tone adapts
- **User deletes account** → cascade delete via `onDelete: Cascade` on all related tables
- **Conflicting facts** detected ("preferă galben" + "evită galben") → both facts' `confidence` decrement, AI asks for clarification next session

## 7. Sessions UI & Chat Redesign

### 7.1 Daily vs thematic sessions

**Daily session:**
- One per day (reset at 02:00 Europe/Bucharest, existing behavior)
- Auto-created on first message of the day
- Default title: "Conversație de [date]"

**Thematic session:**
- Created via "+ Conversație nouă" button
- Modal asks for optional title ("Pregătire nuntă", "Vacanță Italia", etc.)
- Multiple may be open at once
- User-closable anytime

### 7.2 Chat UI layout

Desktop:
```
┌─────────────┬──────────────────────────────────────┐
│ SIDEBAR     │  Header: Ava AI · Online             │
│ SESIUNI     ├──────────────────────────────────────┤
│             │      Messages (scrollable)           │
│ + Nouă      │                                      │
│             │                                      │
│ AZI         ├──────────────────────────────────────┤
│ • Daily     │  [Închide]   [Textarea]   [Send ▶]   │
│ TEMATICE    │                                      │
│ • Nuntă     │                                      │
│ ARHIVĂ      │                                      │
│ • 11 apr    │                                      │
│ ...         │                                      │
└─────────────┴──────────────────────────────────────┘
```

Mobile: chat session sidebar opens as a `Sheet` (drawer) via a button in the chat header.

### 7.3 Session actions

Right-click / long-press on a sidebar session:
- **Rename** (thematic only)
- **Close now** (active only)
- **Delete** (confirm; cascades ChatMessage; SessionSummary survives in memory)
- **View summary** (preview SessionSummary if closed)

### 7.4 "Închide sesiunea" button

Appears beside Send when session has > 2 messages. On click:
1. Modal: "Te-ai decis cu ce vei purta? [Da, am ales: ...] [Nu încă] [Doar închide]"
2. If "Da" → text field for outfit chosen (pre-filled if AI detected)
3. Submit → triggers `POST /api/sessions/[id]/close` with optional `outfitChosenText`
4. Session closes, sidebar updates, summary generation begins

### 7.5 History page redesign

`/history` becomes dual-tab:
- **Tab "Ținute"** (existing — outfit wear records)
- **Tab "Conversații"** (new):
  - Filter: daily / thematic / all
  - Search by title / content
  - Listing with: title, date, occasion (from summary), outfit chosen, outcome
  - Click → view full conversation read-only (cannot continue an old chat)

### 7.6 Quick prompts adapt to session

For a new empty session:
- **Daily:** generic prompts ("Ce port azi?", "Sfat rapid")
- **Thematic:** AI sees the title ("Pregătire nuntă") and generates context-aware prompts ("Ce stil de costum?", "Cravată sau papion?")

## 8. Migration Strategy for Existing Users

### 8.1 Affected users

Current users (including Andrei) have:
- `User.sex == null`
- `User.onboardingCompleted == false` (after column added with that default)
- `Conversation` records with JSON-stringified messages (not yet `ChatSession` + `ChatMessage`)
- Partial profile completed manually

### 8.2 Step 1 — Schema migration (invisible deploy)

Prisma migration on Vercel build:
- Add new columns with safe defaults (`sex=null`, `onboardingCompleted=false`)
- Create new tables (ChatSession, ChatMessage, SessionSummary, UserMemoryFact, MemoryCompactionLog)
- Leave `Conversation` intact

After this, app behavior is unchanged because all feature flags are OFF.

### 8.3 Step 2 — Backfill `Conversation` → `ChatSession` + `ChatMessage`

Script `scripts/migrate-conversations.ts`, run once during Phase 4 deploy:
- Idempotent (checks for existing migration via a flag column or marker)
- Distributes message timestamps proportionally across the original session window
- Does NOT generate SessionSummary for legacy data (we lack original fidelity)

### 8.4 Forced onboarding (Phase 2)

When `FORCE_ONBOARDING=true`:
1. Middleware redirects users with `onboardingCompleted=false` to `/onboarding`
2. AI opens with: "Bună! Văd că e prima ta interacțiune cu noua versiune. Hai să ne cunoaștem din nou — vrei să-mi spui cum te numești?"
3. AI references existing profile data and asks for confirmation rather than starting blank
4. On completion, `onboardingCompleted=true`, user is routed by sex

### 8.5 Wardrobe data preservation

Existing `ClothingItem`, `Outfit`, `OutfitWear` are persona-agnostic in structure. After migration:
- Female users (Ava): wardrobe stays exactly as is
- Male users (Adam) with legacy items in Ava-only categories ("dresses"): items appear in a "Necategorizat" section with an option to remap to Adam categories. This is rare in practice; new Adam users add only Adam-aligned items.

### 8.6 Memory seed for existing users

After forced onboarding, AI extracts initial `UserMemoryFact` records from:
- Existing `UserProfile` (favorite/avoid colors, style preferences, notes)
- This seeds the memory before the first new session

Legacy chat sessions are visible in the Conversations history (read-only), but do not contribute to `UserMemoryFact` automatically — only the fresh post-onboarding interactions build memory cleanly.

## 9. Deployment Strategy — 4 Phases

### Phase 1 — Foundation (invisible deploy)

**Includes:**
- Schema migration (User columns, UserProfile columns, all new tables)
- API endpoint scaffolding (no UI consumes them yet)
- `migrate-conversations.ts` script written but NOT run yet

**Flags activated:** none. App behavior unchanged.

**Validation:** prod schema matches Prisma; existing app fully functional.

### Phase 2 — Rebrand + Onboarding (live behavior change)

**Includes:**
- Landing page rebrand to "AI Stylist Advisor"
- Auth page layout neutralized (no Ava branding)
- `/onboarding` page (conversational chat)
- Middleware updates to redirect incomplete users
- Profile "Rerulează onboarding" action
- All users (regardless of sex chosen) land on Ava interface — Adam still hidden

**Flags activated:** `FORCE_ONBOARDING=true`

**Validation:**
- Existing user passes onboarding without losing data
- New user can register → onboard → reach dashboard with populated profile
- "Sări peste tot" fallback works for stuck users

**Risk:** existing user blocked in onboarding. **Mitigation:** the skip-all button warns ("preferințele tale nu vor fi actualizate") but unblocks.

### Phase 3 — Adam interface (unlock male persona)

**Includes:**
- ThemeProvider in `(main)/layout.tsx` reading `session.user.sex`
- Adam light + dark CSS token sets
- `constants-adam.ts` with male categories
- `fashion-system-prompt-adam.ts`
- Adam quick prompts
- Theme toggle (light/dark) in profile for Adam users
- Mobile-nav + sidebar label switches "Ava AI" → "Adam AI"
- Logo / monogram for Adam ("A" or rhombus)

**Flags activated:** `NEXT_PUBLIC_PERSONA_ADAM_ENABLED=true`

**Validation:**
- New male user → Adam persona correct
- Female users → no change
- Theme toggle works and persists in `UserProfile.themeVariant`

**Risk:** male user who completed Phase 2 onboarding got Ava temporarily. **Mitigation:** on first login post-flag, if `user.sex=="male"` they auto-route to Adam without re-onboarding.

### Phase 4 — Memory + History (most complex)

**Includes:**
- `POST /api/sessions/[id]/close` with summary generation
- `extractMemoryFacts()` job after close
- `MemoryMarkdownBuilder` integrated into `context-builder.ts`
- Chat UI redesign: session sidebar, "+ Conversație nouă", "Închide sesiunea" controls
- History page redesign: dual tab Ținute + Conversații
- Vercel cron `/api/cron/compact-memory` configured in `vercel.ts` or `vercel.json`
- Cron `/api/cron/auto-close-sessions` (every 30 min) closes idle sessions
- Backfill: run `migrate-conversations.ts`
- Drop `Conversation` table 1 week after launch + after Vercel Blob backup

**Flags activated:** `NEXT_PUBLIC_THEMATIC_SESSIONS_ENABLED=true`. `MEMORY_COMPACTION_ENABLED` activated only when at least one user reaches >100 sessions.

**Validation:**
- Daily session works as before + closes with a generated summary
- Thematic session can be created and persists
- AI references prior sessions in context (manual test: ask "ce mi-ai recomandat data trecută?")
- History tab Conversații lists both legacy and new sessions
- Cron auto-close runs without errors on staging

### 9.1 Cron configuration

In `vercel.ts` (or `vercel.json` for now if `vercel.ts` not yet adopted):

```ts
crons: [
  { path: '/api/cron/compact-memory',     schedule: '0 3 * * *' },
  { path: '/api/cron/auto-close-sessions', schedule: '*/30 * * * *' },
],
```

### 9.2 Rollback strategy per phase

- Each phase ships as ONE PR on `master` with a clear commit message
- Schema changes are **additive only** through Phase 4; nothing is dropped until the very end
- Rollback = revert commit + redeploy. Data remains safe.
- Exception: dropping `Conversation` at end of Phase 4 — done only after 1 week of monitoring + Vercel Blob backup of the entire table

## 10. Acceptance Criteria

Project is considered successful when ALL of the following hold:

- ✅ Existing user (Andrei) passes through onboarding, receives Adam persona, sees correct masculine theme
- ✅ New user can register → complete onboarding → receive relevant AI recommendations from the first session
- ✅ AI naturally references what was discussed in a prior session (manual smoke test passes)
- ✅ Daily and thematic sessions coexist in History
- ✅ Session close generates a SessionSummary and (when applicable) creates an Outfit/OutfitWear record
- ✅ Compaction cron runs nightly without errors (verified after seeding test data)
- ✅ Adam light/dark theme toggle works and persists across logins
- ✅ Female user experience (Ava) is preserved with no functional regressions
- ✅ Legacy `Conversation` data is browsable as read-only in Conversations history
- ✅ Re-running onboarding from profile correctly resets and updates user data

## 11. Out of Scope (Explicitly Deferred)

- Theme toggle for Ava (light only for now; can be added later)
- Multi-language support (RO only — existing scope)
- Voice input or image-based outfit recommendations
- Social features (sharing outfits, comparing with friends)
- Subscription / paid tier
- Mobile native app (PWA continues to be the mobile path)
