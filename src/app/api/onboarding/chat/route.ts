import { auth } from "@/lib/auth";
import { googleAI } from "@/lib/ai/client";
import { buildOnboardingSystemPrompt } from "@/lib/ai/onboarding-system-prompt";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { Content } from "@google/genai";

function parseStringOrArray(val: string): string {
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed.join(", ") : val;
  } catch {
    return val;
  }
}

function profileToMarkdown(p: {
  favoriteColors?: string | null;
  avoidColors?: string | null;
  stylePreferences?: string | null;
  preferredOccasions?: string | null;
  lifestyleNotes?: string | null;
  bodyType?: string | null;
}): string | null {
  const lines: string[] = [];
  if (p.stylePreferences) lines.push(`- Stiluri preferate: ${parseStringOrArray(p.stylePreferences)}`);
  if (p.favoriteColors) lines.push(`- Culori preferate: ${parseStringOrArray(p.favoriteColors)}`);
  if (p.avoidColors) lines.push(`- Culori de evitat: ${parseStringOrArray(p.avoidColors)}`);
  if (p.preferredOccasions) lines.push(`- Ocazii: ${p.preferredOccasions}`);
  if (p.bodyType) lines.push(`- Tip corp: ${p.bodyType}`);
  if (p.lifestyleNotes) lines.push(`- Note: ${p.lifestyleNotes}`);
  return lines.length > 0 ? lines.join("\n") : null;
}

// Transcript is intentionally not persisted here — it stays client-side until
// the user completes onboarding and POSTs to /api/onboarding/complete.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { messages } = (await req.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "Messages invalid" }, { status: 400 });
  }

  let existingProfile = null;
  try {
    existingProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });
  } catch (err) {
    console.error("Onboarding DB error:", err);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }

  const systemPrompt = buildOnboardingSystemPrompt(
    existingProfile ? profileToMarkdown(existingProfile) : null
  );

  const contents: Content[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  // Gemini requires at least one user turn — inject a start signal when
  // the client opens the conversation with an empty history.
  if (contents.length === 0) {
    contents.push({ role: "user", parts: [{ text: "start" }] });
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await googleAI.models.generateContentStream({
          model: "gemini-flash-lite-latest",
          config: { systemInstruction: systemPrompt },
          contents,
        });
        for await (const chunk of stream) {
          const text = chunk.text ?? "";
          if (text) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }
      } catch (error) {
        console.error("Onboarding chat error:", error);
        const errorText = "Scuze, am întâmpinat o eroare. Încearcă din nou.";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ text: errorText })}\n\n`)
        );
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
    cancel() {
      // client disconnected — no explicit abort available for in-flight Gemini
      // streams, but this prevents enqueue-to-closed-controller errors
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
