import { auth } from "@/lib/auth";
import { googleAI } from "@/lib/ai/client";
import { buildOnboardingSystemPrompt } from "@/lib/ai/onboarding-system-prompt";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { Content } from "@google/genai";

function profileToMarkdown(p: {
  favoriteColors?: string | null;
  avoidColors?: string | null;
  preferredOccasions?: string | null;
  lifestyleNotes?: string | null;
  bodyType?: string | null;
}): string | null {
  const lines: string[] = [];
  if (p.favoriteColors) lines.push(`- Culori preferate: ${p.favoriteColors}`);
  if (p.avoidColors) lines.push(`- Culori de evitat: ${p.avoidColors}`);
  if (p.preferredOccasions) lines.push(`- Ocazii: ${p.preferredOccasions}`);
  if (p.bodyType) lines.push(`- Tip corp: ${p.bodyType}`);
  if (p.lifestyleNotes) lines.push(`- Note: ${p.lifestyleNotes}`);
  return lines.length > 0 ? lines.join("\n") : null;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { messages } = (await req.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  const existingProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });
  const systemPrompt = buildOnboardingSystemPrompt(
    existingProfile ? profileToMarkdown(existingProfile) : null
  );

  const contents: Content[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

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
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
