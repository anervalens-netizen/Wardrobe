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
  `ALTER TABLE "UserProfile" ADD COLUMN "ageBand" TEXT`,
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
