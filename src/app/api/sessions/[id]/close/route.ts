import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { googleAI } from "@/lib/ai/client";
import { NextResponse } from "next/server";

interface SummaryResult {
  occasion?: string;
  outfitChosenText?: string;
  outcome?: string;
  keyInsights?: string;
}

async function generateSummary(
  messages: { role: string; content: string }[]
): Promise<SummaryResult> {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "Client" : "Stilist"}: ${m.content}`)
    .join("\n");

  const prompt = `Analizează această conversație despre stilul vestimentar și returnează un JSON cu următoarele câmpuri:
- occasion: ocazia pentru care s-a cerut ținuta (ex: "birou", "petrecere", "cină romantică")
- outfitChosenText: descrierea scurtă a ținutei finale recomandate (sau null dacă nu s-a ajuns la o ținută finală)
- outcome: "recommendation_made" | "browsing" | "no_conclusion"
- keyInsights: câteva fraze scurte despre preferințele stilistice ale clientului reieșite din conversație

Returnează DOAR JSON valid, fără text suplimentar.

Conversație:
${transcript}`;

  const response = await googleAI.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text = response.text ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return {};

  return JSON.parse(jsonMatch[0]) as SummaryResult;
}

async function extractMemoryFacts(
  userId: string,
  keyInsights: string
): Promise<void> {
  if (!keyInsights.trim()) return;

  const prompt = `Din aceste observații despre preferințele stilistice ale unui client, extrage fapte individuale clare.
Returnează un array JSON de obiecte cu câmpurile:
- type: tipul faptului ("color_preference" | "style_preference" | "body_concern" | "lifestyle" | "brand_preference" | "avoidance")
- content: faptul în sine, concis (max 100 caractere)
- confidence: 1-3 (1=menționat o dată, 2=întărit, 3=foarte clar)

Returnează DOAR JSON valid (array), fără text suplimentar.

Observații:
${keyInsights}`;

  const response = await googleAI.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text = response.text ?? "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return;

  const facts = JSON.parse(jsonMatch[0]) as Array<{
    type: string;
    content: string;
    confidence: number;
  }>;

  for (const fact of facts) {
    if (!fact.type || !fact.content) continue;
    // Upsert by content similarity is hard with SQLite — use exact content match
    const existing = await prisma.userMemoryFact.findFirst({
      where: { userId, type: fact.type, content: fact.content },
    });
    if (existing) {
      await prisma.userMemoryFact.update({
        where: { id: existing.id },
        data: {
          confidence: Math.min(existing.confidence + 1, 5),
          sourceCount: existing.sourceCount + 1,
          lastConfirmedAt: new Date(),
        },
      });
    } else {
      await prisma.userMemoryFact.create({
        data: {
          userId,
          type: fact.type,
          content: fact.content,
          confidence: fact.confidence ?? 1,
        },
      });
    }
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const closureMethod: string = body.closureMethod ?? "user";

  // Verify session belongs to user
  const chatSession = await prisma.chatSession.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!chatSession) {
    return NextResponse.json({ error: "Sesiune negăsită" }, { status: 404 });
  }
  if (chatSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Interzis" }, { status: 403 });
  }
  if (chatSession.closedAt) {
    return NextResponse.json({ ok: true, alreadyClosed: true });
  }

  // Close the session immediately
  await prisma.chatSession.update({
    where: { id },
    data: { closedAt: new Date(), closureMethod },
  });

  // Generate summary + memory facts (best-effort, don't fail the close)
  if (chatSession.messages.length >= 2) {
    try {
      const summary = await generateSummary(chatSession.messages);
      await prisma.sessionSummary.create({
        data: {
          sessionId: id,
          userId: session.user.id,
          occasion: summary.occasion ?? null,
          outfitChosenText: summary.outfitChosenText ?? null,
          outcome: summary.outcome ?? null,
          keyInsights: summary.keyInsights ?? null,
        },
      });

      if (summary.keyInsights) {
        await extractMemoryFacts(session.user.id, summary.keyInsights);
      }
    } catch (err) {
      console.error("Session summary generation failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
