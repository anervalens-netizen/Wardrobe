# AI Stylist Advisor — Phase 1 (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Phase 1 of 4.** Phases 2–4 plans will be written after each prior phase lands in production.

**Goal:** Land an invisible deploy that adds all new DB columns + tables, feature-flag scaffolding, stub API routes, and the legacy-conversation migration script skeleton — with zero user-visible behavior changes.

**Architecture:** Additive-only schema changes applied through an idempotent SQL push script (project already uses this pattern in `scripts/push-schema.mjs`; Prisma `migrate dev` / `db push` are incompatible with libsql on this Prisma 7 setup). All Phase 2–4 features remain hidden behind `false`-default feature flags. No existing feature is modified.

**Tech Stack:** Next.js 16 App Router, Prisma 7 with `@prisma/adapter-libsql`, libsql/Turso, NextAuth v5, `@google/genai` (not touched in this phase), shadcn/ui (not touched in this phase).

**Verification model:** This phase adds no runtime logic that runs without a flag. The bar for "done" is:
1. `npx prisma generate` succeeds against the updated schema
2. `npm run build` succeeds
3. The migration script is idempotent (re-running causes no errors and no diffs)
4. The local SQLite DB after migration has the expected columns and tables (manual check via `sqlite3`)
5. Turso staging DB (Vercel preview env) has the same after running the script

No test framework is introduced in Phase 1. Vitest will be added in Phase 2 once there are pure helper functions worth unit-testing (onboarding extractors, memory-markdown builder).

**Reference spec:** `docs/superpowers/specs/2026-04-13-ai-stylist-advisor-redesign-design.md`

---

## File Structure

**Files modified:**
- `prisma/schema.prisma` — new fields on `User`, `UserProfile`, `Conversation`; five new models

**Files created:**
- `scripts/apply-phase1-migration.mjs` — idempotent SQL push that adds columns and creates new tables on the Turso DB (follows the existing `scripts/push-schema.mjs` pattern)
- `src/lib/feature-flags.ts` — central helper exposing the four Phase 1–4 flags with typed accessors (server-only flags read `process.env`; `NEXT_PUBLIC_*` flags readable on both sides)
- `src/app/api/onboarding/chat/route.ts` — 501-return stub (disabled unless `FORCE_ONBOARDING=true`, which Phase 1 keeps off)
- `src/app/api/onboarding/complete/route.ts` — 501-return stub
- `src/app/api/sessions/[id]/close/route.ts` — 501-return stub
- `src/app/api/cron/compact-memory/route.ts` — 501-return stub (not wired into any cron config yet — Phase 4 registers the schedule)
- `src/app/api/cron/auto-close-sessions/route.ts` — 501-return stub
- `scripts/migrate-conversations.ts` — legacy→new-schema backfill skeleton, NOT executed in Phase 1

**Why scaffold stubs now, before Phase 2–4 logic exists:**

Stubs let us land the Phase 1 schema migration together with the surface area those phases will consume, so that `next build` proves routing and imports compile cleanly against the new Prisma client before any business logic is written. If the stubs are omitted, we risk a Phase 2 PR combining schema import proofing with feature logic — which is exactly what this phased rollout is designed to avoid.

Each stub returns HTTP 501 ("Not Implemented") with a message referencing the phase that will unlock it.

---

## Task 1: Add new fields to existing Prisma models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `sex` and `onboardingCompleted` to `User` model**

Open `prisma/schema.prisma` and locate the `User` model (starts at line 10). Insert the two new fields after the existing `updatedAt` line (line 18), before the `accounts Account[]` relation block.

Replace:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
```

With:

```prisma
model User {
  id                  String    @id @default(cuid())
  name                String?
  email               String    @unique
  emailVerified       DateTime?
  image               String?
  password            String?
  sex                 String?
  onboardingCompleted Boolean   @default(false)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  accounts            Account[]
```

- [ ] **Step 2: Add `themeVariant`, `preferredOccasions`, `lifestyleNotes` to `UserProfile`**

Locate `model UserProfile` (line 65) and insert the three fields after the existing `notes` field (line 77), before `createdAt`.

Replace:

```prisma
  stylePreferences String?
  notes            String?
  createdAt        DateTime @default(now())
```

With:

```prisma
  stylePreferences   String?
  notes              String?
  themeVariant       String?
  preferredOccasions String?
  lifestyleNotes     String?
  createdAt          DateTime @default(now())
```

- [ ] **Step 3: Add `migrated` flag to `Conversation`**

Locate `model Conversation` (line 148). Add the `migrated` column before `createdAt`.

Replace:

```prisma
model Conversation {
  id        String   @id @default(cuid())
  userId    String
  messages  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

With:

```prisma
model Conversation {
  id        String   @id @default(cuid())
  userId    String
  messages  String
  migrated  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): add onboarding + theme + migration flag fields"
```

---

## Task 2: Add the five new Prisma models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the five models at the end of the schema file**

Open `prisma/schema.prisma` and append after the existing `Conversation` model (after line 157):

```prisma
model ChatSession {
  id            String    @id @default(cuid())
  userId        String
  type          String
  title         String?
  startedAt     DateTime  @default(now())
  closedAt     DateTime?
  closureMethod String?

  user     User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages ChatMessage[]
  summary  SessionSummary?

  @@index([userId, closedAt])
}

model ChatMessage {
  id        String   @id @default(cuid())
  sessionId String
  role      String
  content   String
  createdAt DateTime @default(now())

  session ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
}

model SessionSummary {
  id               String   @id @default(cuid())
  sessionId        String   @unique
  userId           String
  occasion         String?
  outfitChosenText String?
  outfitId         String?
  outcome          String?
  keyInsights      String?
  generatedAt      DateTime @default(now())

  session ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user    User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  outfit  Outfit?     @relation(fields: [outfitId], references: [id])

  @@index([userId, generatedAt])
}

model UserMemoryFact {
  id              String   @id @default(cuid())
  userId          String
  type            String
  content         String
  confidence      Int      @default(1)
  sourceCount     Int      @default(1)
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

- [ ] **Step 2: Add back-relations to `User` and `Outfit`**

The new models reference `User` and `Outfit`. Prisma requires the reverse relation to be declared as well.

In `model User` (near line 10), add the following lines to the relations block (after the existing `conversations Conversation[]`):

```prisma
  chatSessions        ChatSession[]
  sessionSummaries    SessionSummary[]
  memoryFacts         UserMemoryFact[]
  compactionLogs      MemoryCompactionLog[]
```

In `model Outfit` (line 109), add the reverse relation to `SessionSummary` after the existing `outfitWears OutfitWear[]`:

```prisma
  sessionSummaries SessionSummary[]
```

- [ ] **Step 3: Run Prisma generate and check for validation errors**

Run: `npx prisma generate`

Expected: command succeeds and writes `src/generated/prisma/*`. If Prisma reports a validation error like "relation field is missing an opposite relation field", re-check Step 2 — every `@relation` in the new models must have a matching reverse.

- [ ] **Step 4: Verify the build still succeeds**

Run: `npm run build`

Expected: `prisma generate` step runs, `next build` completes with no TypeScript errors. The new models are available on `prisma.chatSession.*`, `prisma.chatMessage.*`, etc.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): add ChatSession, ChatMessage, SessionSummary, UserMemoryFact, MemoryCompactionLog"
```

---

## Task 3: Write the idempotent SQL migration script

**Files:**
- Create: `scripts/apply-phase1-migration.mjs`

Background: `scripts/push-schema.mjs` already demonstrates the pattern — connect with `@libsql/client`, execute a list of SQL statements, use `IF NOT EXISTS` where possible, and wrap each statement in try/catch so failures on one don't abort the rest. SQLite does not support `IF NOT EXISTS` for `ALTER TABLE ADD COLUMN`, so we rely on the try/catch to swallow "duplicate column name" errors. Re-running the script is safe because every statement is either inherently idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`) or fails gracefully on repeat (the ALTERs).

- [ ] **Step 1: Create the script file**

Create `scripts/apply-phase1-migration.mjs`:

```js
import { createClient } from "@libsql/client";
import "dotenv/config";

const client = createClient({
  url: (process.env.TURSO_DATABASE_URL || "").trim(),
  authToken: process.env.TURSO_AUTH_TOKEN?.trim(),
});

const alters = [
  `ALTER TABLE "User" ADD COLUMN "sex" TEXT`,
  `ALTER TABLE "User" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "UserProfile" ADD COLUMN "themeVariant" TEXT`,
  `ALTER TABLE "UserProfile" ADD COLUMN "preferredOccasions" TEXT`,
  `ALTER TABLE "UserProfile" ADD COLUMN "lifestyleNotes" TEXT`,
  `ALTER TABLE "Conversation" ADD COLUMN "migrated" BOOLEAN NOT NULL DEFAULT false`,
];

const creates = [
  `CREATE TABLE IF NOT EXISTS "ChatSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "closureMethod" TEXT,
    CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "ChatSession_userId_closedAt_idx" ON "ChatSession"("userId", "closedAt")`,

  `CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId")`,

  `CREATE TABLE IF NOT EXISTS "SessionSummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "occasion" TEXT,
    "outfitChosenText" TEXT,
    "outfitId" TEXT,
    "outcome" TEXT,
    "keyInsights" TEXT,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionSummary_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessionSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessionSummary_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "SessionSummary_sessionId_key" ON "SessionSummary"("sessionId")`,
  `CREATE INDEX IF NOT EXISTS "SessionSummary_userId_generatedAt_idx" ON "SessionSummary"("userId", "generatedAt")`,

  `CREATE TABLE IF NOT EXISTS "UserMemoryFact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 1,
    "sourceCount" INTEGER NOT NULL DEFAULT 1,
    "lastConfirmedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserMemoryFact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "UserMemoryFact_userId_type_idx" ON "UserMemoryFact"("userId", "type")`,

  `CREATE TABLE IF NOT EXISTS "MemoryCompactionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sessionsCompacted" INTEGER NOT NULL,
    "factsCreated" INTEGER NOT NULL,
    "runAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MemoryCompactionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
];

function isDuplicateColumnError(err) {
  const msg = (err?.message || "").toLowerCase();
  return msg.includes("duplicate column") || msg.includes("already exists");
}

async function main() {
  console.log("Applying Phase 1 migration to:", process.env.TURSO_DATABASE_URL || "(local sqlite)");

  console.log("\nAdding columns (idempotent, ignores duplicates):");
  for (const sql of alters) {
    const label = sql.replace(/\s+/g, " ").slice(0, 70);
    try {
      await client.execute(sql);
      console.log(`  + ${label}`);
    } catch (e) {
      if (isDuplicateColumnError(e)) {
        console.log(`  = ${label} (already present)`);
      } else {
        console.error(`  ! ${label} — ${e.message}`);
        throw e;
      }
    }
  }

  console.log("\nCreating tables + indexes (IF NOT EXISTS):");
  for (const sql of creates) {
    const label = sql.match(/"(\w+)"/)?.[1] || "stmt";
    try {
      await client.execute(sql);
      console.log(`  ✓ ${label}`);
    } catch (e) {
      console.error(`  ✗ ${label} — ${e.message}`);
      throw e;
    }
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Run the script locally**

Run: `node scripts/apply-phase1-migration.mjs`

Expected output: all six ALTERs succeed (first run) or print "already present" (subsequent runs). All CREATE TABLE / CREATE INDEX succeed with `✓`. No errors.

If `TURSO_DATABASE_URL` is unset locally, the script connects to nothing. Set it to the local file URL before running:

```bash
TURSO_DATABASE_URL="file:prisma/dev.db" node scripts/apply-phase1-migration.mjs
```

- [ ] **Step 3: Verify local schema**

Run: `sqlite3 prisma/dev.db ".schema User"`

Expected: the output includes `"sex" TEXT` and `"onboardingCompleted" BOOLEAN NOT NULL DEFAULT false`.

Run: `sqlite3 prisma/dev.db ".tables"`

Expected: the table list includes `ChatSession`, `ChatMessage`, `SessionSummary`, `UserMemoryFact`, `MemoryCompactionLog`.

If `sqlite3` is not on PATH on Windows, use instead:

```bash
node -e "import('@libsql/client').then(({createClient}) => createClient({url: 'file:prisma/dev.db'}).execute('SELECT name FROM sqlite_master WHERE type=\"table\"').then(r => console.log(r.rows)))"
```

- [ ] **Step 4: Run the script again — idempotency check**

Run: `TURSO_DATABASE_URL="file:prisma/dev.db" node scripts/apply-phase1-migration.mjs`

Expected: every ALTER prints `= ... (already present)`. Every CREATE prints `✓` (silently no-ops thanks to `IF NOT EXISTS`). Exit code 0.

- [ ] **Step 5: Commit**

```bash
git add scripts/apply-phase1-migration.mjs
git commit -m "feat(migration): add idempotent Phase 1 SQL migration script"
```

---

## Task 4: Feature flags helper

**Files:**
- Create: `src/lib/feature-flags.ts`

- [ ] **Step 1: Create the helper**

Create `src/lib/feature-flags.ts`:

```ts
function isTrue(value: string | undefined): boolean {
  return value?.trim() === "true";
}

export const serverFeatureFlags = {
  forceOnboarding: isTrue(process.env.FORCE_ONBOARDING),
  memoryCompactionEnabled: isTrue(process.env.MEMORY_COMPACTION_ENABLED),
};

export const publicFeatureFlags = {
  personaAdamEnabled: isTrue(process.env.NEXT_PUBLIC_PERSONA_ADAM_ENABLED),
  thematicSessionsEnabled: isTrue(process.env.NEXT_PUBLIC_THEMATIC_SESSIONS_ENABLED),
};
```

Notes for the engineer: the `NEXT_PUBLIC_` prefix is Next.js's convention — Next inlines those at build time so they are readable in client components. Non-prefixed flags are server-only. Phase 1 does not consume these flags in any code path; this helper simply makes them available so Phase 2–4 can import a typed, trimmed reading (Vercel env vars can carry trailing newlines — per the project's memory, `.trim()` is essential).

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

Expected: no errors. (If the project has no root-level `tsc --noEmit` script wired up, this command still works with the existing `tsconfig.json`.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/feature-flags.ts
git commit -m "feat(flags): add Phase 1–4 feature flag helper"
```

---

## Task 5: Onboarding API stubs

**Files:**
- Create: `src/app/api/onboarding/chat/route.ts`
- Create: `src/app/api/onboarding/complete/route.ts`

- [ ] **Step 1: Create the chat stub**

Create `src/app/api/onboarding/chat/route.ts`:

```ts
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Onboarding chat is not yet enabled. Unlocks in Phase 2." },
    { status: 501 },
  );
}
```

- [ ] **Step 2: Create the complete stub**

Create `src/app/api/onboarding/complete/route.ts`:

```ts
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Onboarding completion is not yet enabled. Unlocks in Phase 2." },
    { status: 501 },
  );
}
```

- [ ] **Step 3: Verify the build still succeeds**

Run: `npm run build`

Expected: success. Both new routes appear in the Next.js build output under the API routes listing.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/onboarding
git commit -m "feat(api): add onboarding stub routes (Phase 2 placeholders)"
```

---

## Task 6: Sessions + cron API stubs

**Files:**
- Create: `src/app/api/sessions/[id]/close/route.ts`
- Create: `src/app/api/cron/compact-memory/route.ts`
- Create: `src/app/api/cron/auto-close-sessions/route.ts`

- [ ] **Step 1: Create the session close stub**

Create `src/app/api/sessions/[id]/close/route.ts`:

```ts
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Session close is not yet enabled. Unlocks in Phase 4." },
    { status: 501 },
  );
}
```

Note on the dynamic param: in Next.js 16 App Router the handler signature can receive `{ params }`, but Phase 1 does not touch it, so we intentionally omit the second argument to keep the stub minimal. Phase 4 will add the full `(req, { params })` shape.

- [ ] **Step 2: Create the compact-memory cron stub**

Create `src/app/api/cron/compact-memory/route.ts`:

```ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Memory compaction cron is not yet enabled. Unlocks in Phase 4." },
    { status: 501 },
  );
}
```

- [ ] **Step 3: Create the auto-close cron stub**

Create `src/app/api/cron/auto-close-sessions/route.ts`:

```ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Auto-close cron is not yet enabled. Unlocks in Phase 4." },
    { status: 501 },
  );
}
```

- [ ] **Step 4: Verify middleware does not block the cron routes**

Open `src/middleware.ts` (or wherever the project's middleware lives — check with `ls src/middleware.ts` first). If the existing middleware matcher already excludes `/api/cron/*`, no change is needed.

If it does NOT exclude them, add them to the exclusion list. Phase 1 is invisible-deploy so the stubs returning 501 is fine; but we still want them reachable without a session cookie so Phase 4 can wire up Vercel Cron correctly.

This step may be a no-op on most projects — check the matcher pattern before editing.

- [ ] **Step 5: Verify the build still succeeds**

Run: `npm run build`

Expected: success. All three stub routes appear in the build output.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/sessions src/app/api/cron
git commit -m "feat(api): add session-close + cron stub routes (Phase 4 placeholders)"
```

---

## Task 7: Legacy-conversation migration script skeleton

**Files:**
- Create: `scripts/migrate-conversations.ts`

Background: this script is NOT executed in Phase 1. It is written now so Phase 4 can run it without a separate PR. The skeleton uses `tsx` to run (no compilation needed — project already ships TypeScript-capable tooling). We leave the actual Gemini / SessionSummary logic as a clearly-labeled stub, because it depends on helpers that Phases 2–4 introduce.

- [ ] **Step 1: Verify `tsx` is available**

Run: `npx tsx --version`

Expected: a version number prints. If the package is not installed, `npx` downloads it on first run — which is acceptable for a script executed manually.

- [ ] **Step 2: Create the skeleton**

Create `scripts/migrate-conversations.ts`:

```ts
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import "dotenv/config";

type LegacyMessage = { role: "user" | "assistant"; content: string };

function buildPrisma() {
  const url = (process.env.TURSO_DATABASE_URL || "file:prisma/dev.db").trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  const adapter = new PrismaLibSql({
    url,
    ...(authToken ? { authToken } : {}),
  });
  return new PrismaClient({ adapter });
}

function distributeTimestamps(
  count: number,
  start: Date,
  end: Date,
): Date[] {
  if (count <= 0) return [];
  if (count === 1) return [start];
  const span = end.getTime() - start.getTime();
  const step = span / (count - 1);
  return Array.from({ length: count }, (_, i) => new Date(start.getTime() + i * step));
}

async function migrateOne(prisma: PrismaClient, row: {
  id: string;
  userId: string;
  messages: string;
  createdAt: Date;
  updatedAt: Date;
}): Promise<void> {
  let messages: LegacyMessage[];
  try {
    messages = JSON.parse(row.messages);
  } catch {
    console.warn(`  [skip] conversation ${row.id}: invalid JSON`);
    return;
  }
  if (!Array.isArray(messages)) {
    console.warn(`  [skip] conversation ${row.id}: messages is not an array`);
    return;
  }

  const validMessages = messages.filter(
    (m) => m.role === "user" || m.role === "assistant",
  );
  const timestamps = distributeTimestamps(validMessages.length, row.createdAt, row.updatedAt);

  await prisma.$transaction(async (tx) => {
    const chatSession = await tx.chatSession.create({
      data: {
        userId: row.userId,
        type: "daily",
        title: null,
        startedAt: row.createdAt,
        closedAt: row.updatedAt,
        closureMethod: "auto",
      },
    });

    for (let i = 0; i < validMessages.length; i++) {
      const m = validMessages[i];
      await tx.chatMessage.create({
        data: {
          sessionId: chatSession.id,
          role: m.role,
          content: m.content,
          createdAt: timestamps[i],
        },
      });
    }

    await tx.conversation.update({
      where: { id: row.id },
      data: { migrated: true },
    });
  });
}

async function main() {
  const prisma = buildPrisma();
  console.log("Migrating legacy Conversation rows...");

  const batchSize = 50;
  let total = 0;

  // Cast to `any` here is intentional — the generated client may not expose the
  // `migrated` column as a filterable field in some transient states between
  // schema sync and client regen. This is a one-shot script.
  while (true) {
    const batch = await (prisma.conversation as any).findMany({
      where: { migrated: false },
      take: batchSize,
    });
    if (batch.length === 0) break;

    for (const row of batch) {
      await migrateOne(prisma, row);
      total++;
      console.log(`  ✓ ${row.id}`);
    }
  }

  console.log(`\nDone. Migrated ${total} conversations.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});

// Note: Prisma client is disconnected at the end of main(). On error the process
// exits immediately; Node closes the libsql socket on exit, so no explicit
// disconnect is needed here.
```

- [ ] **Step 3: Verify it compiles (type-check only, do NOT run)**

Run: `npx tsc --noEmit scripts/migrate-conversations.ts`

Expected: type-check passes. If it complains about `PrismaClient` or `prisma.chatSession`/`prisma.chatMessage` being undefined, re-run `npx prisma generate` — the client must have been regenerated after Task 2.

Warning: do NOT run the script itself in Phase 1. Running it would create `ChatSession` and `ChatMessage` rows from legacy `Conversation` data, and Phase 2–4 UI is not yet built. Phase 4 has the execution step.

- [ ] **Step 4: Commit**

```bash
git add scripts/migrate-conversations.ts
git commit -m "feat(migration): add legacy-conversation migration skeleton (Phase 4 will run it)"
```

---

## Task 8: Apply migration to Turso staging + prod

**Files:**
- No code changes. This task is execution + verification.

- [ ] **Step 1: Ensure environment variables are available locally**

The migration script reads `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` from `.env`. Verify:

```bash
grep -E "TURSO_DATABASE_URL|TURSO_AUTH_TOKEN" .env
```

Expected: both values present (project is already deployed to Vercel, so these should exist locally if you've been developing against prod Turso).

If you use separate staging + prod Turso DBs, set up `.env.staging` and run the script with an env override:

```bash
set -a; source .env.staging; set +a
node scripts/apply-phase1-migration.mjs
```

If there's only a single Turso DB shared with prod, skip straight to Step 3 — but verify the `apply-phase1-migration.mjs` output matches expectations first by doing a dry-run against the local file DB (Task 3 already did this).

- [ ] **Step 2: Apply to staging Turso (if it exists)**

Run: `node scripts/apply-phase1-migration.mjs`

Expected output: all ALTERs either `+` or `=`, all CREATEs `✓`, no errors.

- [ ] **Step 3: Apply to production Turso**

If there's a single DB shared with prod, this IS the prod application. Confirm with the user before running.

Then: `node scripts/apply-phase1-migration.mjs` with prod env.

Expected: same output as staging. Idempotent re-run after is harmless.

- [ ] **Step 4: Smoke-test the live app**

Open the existing production URL (`garderoba.vercel.app`). Log in. Verify:
- Dashboard loads
- Wardrobe loads
- Chat with Ava works (sends a message, receives a response)

If ANY of these regress, the migration is NOT the cause (it is purely additive), but do revert via: delete the newly-created tables and drop the newly-added columns. Since Phase 1 is additive, a rollback is:

```sql
-- only if a real regression is traced back to this
DROP TABLE "MemoryCompactionLog";
DROP TABLE "UserMemoryFact";
DROP TABLE "SessionSummary";
DROP TABLE "ChatMessage";
DROP TABLE "ChatSession";
ALTER TABLE "Conversation" DROP COLUMN "migrated";
ALTER TABLE "UserProfile" DROP COLUMN "lifestyleNotes";
ALTER TABLE "UserProfile" DROP COLUMN "preferredOccasions";
ALTER TABLE "UserProfile" DROP COLUMN "themeVariant";
ALTER TABLE "User" DROP COLUMN "onboardingCompleted";
ALTER TABLE "User" DROP COLUMN "sex";
```

Note: SQLite older than 3.35 does not support `DROP COLUMN`. Turso runs a recent libsql build, so it does — but verify with `SELECT sqlite_version()` if needed.

- [ ] **Step 5: No commit (this task only runs the already-committed script)**

---

## Task 9: Deploy + final verification

**Files:**
- No code changes in this task.

- [ ] **Step 1: Push to master**

```bash
git push origin master
```

Expected: Vercel auto-deploys. The build command (`prisma generate && next build`) regenerates the Prisma client with the new models.

- [ ] **Step 2: Verify the deploy**

Open the deploy's "Functions" tab on Vercel and confirm the new stub routes appear:
- `/api/onboarding/chat`
- `/api/onboarding/complete`
- `/api/sessions/[id]/close`
- `/api/cron/compact-memory`
- `/api/cron/auto-close-sessions`

Optionally `curl` one of them:

```bash
curl -X POST https://garderoba.vercel.app/api/onboarding/chat
```

Expected: `{"error":"Onboarding chat is not yet enabled. Unlocks in Phase 2."}` with status 501.

- [ ] **Step 3: Confirm no user-visible regression**

Log into prod as Andrei. Click through:
- Dashboard
- Wardrobe (add item, list items)
- Ava chat (send a message, receive a reply)
- Profile
- History

If any of these regress, revert the latest commit and investigate. Since Phase 1 is purely additive, a regression almost certainly indicates a schema-validation issue in the Prisma client — which would have surfaced at `npx prisma generate` time, so it should be caught before this step.

- [ ] **Step 4: Mark Phase 1 complete**

Phase 1 is done when:
- New columns + tables exist on prod Turso
- All 5 stub routes return 501
- Feature flags helper compiles but is not imported by any consumer
- No user-visible change to the app

Next step: write the Phase 2 plan (`docs/superpowers/plans/2026-MM-DD-phase-2-rebrand-onboarding.md`) — Rebrand + Onboarding.

---

## Why no test framework yet

The spec has logic worth unit-testing (onboarding extractors that parse AI responses into structured profile fields, the memory-markdown builder, the summary-JSON validator). None of that logic exists in Phase 1 — every file in this phase is either:

- schema (validated by `prisma generate`)
- 501 stubs (behavior is "return 501", not testable in any useful way)
- idempotent SQL (validated by re-running the script and seeing "already present")
- a skeleton with only plumbing (Prisma calls + transaction boundaries)

Adding Vitest in Phase 1 would be setup without content. Phase 2 introduces the first extractable pure function (the onboarding response parser), and Vitest is added there along with its first test.
