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

  const timestamps = distributeTimestamps(messages.length, row.createdAt, row.updatedAt);

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

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      if (m.role !== "user" && m.role !== "assistant") continue;
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
