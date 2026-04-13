import { prisma } from "@/lib/prisma";
import { googleAI } from "@/lib/ai/client";
import { NextResponse } from "next/server";

const SUMMARY_THRESHOLD = 300;

interface CompactedFact {
  type: string;
  content: string;
  confidence: number;
}

async function compactUserSummaries(userId: string): Promise<void> {
  const summaries = await prisma.sessionSummary.findMany({
    where: { userId },
    orderBy: { generatedAt: "asc" },
  });

  if (summaries.length < SUMMARY_THRESHOLD) return;

  // Group by occasion for compaction
  const byOccasion: Record<string, typeof summaries> = {};
  for (const s of summaries) {
    const key = s.occasion ?? "general";
    if (!byOccasion[key]) byOccasion[key] = [];
    byOccasion[key].push(s);
  }

  const allInsights = summaries
    .filter((s) => s.keyInsights)
    .map((s) => s.keyInsights!)
    .join("\n");

  const prompt = `Ești un sistem de memorie pentru un asistent de stil. Ai acumulat ${summaries.length} rezumate de conversații.
Extrage faptele esențiale despre preferințele stilistice ale clientului.
Returnează un array JSON de obiecte cu câmpurile:
- type: "color_preference" | "style_preference" | "body_concern" | "lifestyle" | "brand_preference" | "avoidance"
- content: faptul concis (max 100 caractere)
- confidence: 1-5

Returnează DOAR JSON valid (array).

Rezumate:
${allInsights.slice(0, 8000)}`;

  const response = await googleAI.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text = response.text ?? "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return;

  const facts = JSON.parse(jsonMatch[0]) as CompactedFact[];
  let factsCreated = 0;

  for (const fact of facts) {
    if (!fact.type || !fact.content) continue;
    const existing = await prisma.userMemoryFact.findFirst({
      where: { userId, type: fact.type, content: fact.content },
    });
    if (!existing) {
      await prisma.userMemoryFact.create({
        data: {
          userId,
          type: fact.type,
          content: fact.content,
          confidence: fact.confidence ?? 2,
          sourceCount: summaries.length,
        },
      });
      factsCreated++;
    }
  }

  // Delete compacted summaries (keep last 30)
  const summaryIdsToDelete = summaries
    .slice(0, summaries.length - 30)
    .map((s) => s.id);

  await prisma.sessionSummary.deleteMany({
    where: { id: { in: summaryIdsToDelete } },
  });

  await prisma.memoryCompactionLog.create({
    data: {
      userId,
      sessionsCompacted: summaryIdsToDelete.length,
      factsCreated,
    },
  });
}

export async function GET(req: Request) {
  if (!process.env.MEMORY_COMPACTION_ENABLED) {
    return NextResponse.json({ ok: true, skipped: "feature_disabled" });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usersWithManySummaries = await prisma.sessionSummary.groupBy({
    by: ["userId"],
    _count: { userId: true },
    having: { userId: { _count: { gte: SUMMARY_THRESHOLD } } },
  });

  let usersProcessed = 0;
  for (const row of usersWithManySummaries) {
    try {
      await compactUserSummaries(row.userId);
      usersProcessed++;
    } catch (err) {
      console.error(`Compaction failed for user ${row.userId}:`, err);
    }
  }

  return NextResponse.json({ ok: true, usersProcessed });
}
