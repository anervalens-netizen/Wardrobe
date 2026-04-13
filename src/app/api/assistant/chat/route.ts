import { auth } from "@/lib/auth";
import { googleAI } from "@/lib/ai/client";
import { FASHION_SYSTEM_PROMPT } from "@/lib/ai/fashion-system-prompt";
import { FASHION_SYSTEM_PROMPT_ADAM } from "@/lib/ai/fashion-system-prompt-adam";
import { buildUserContext } from "@/lib/ai/context-builder";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { Content } from "@google/genai";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { messages, conversationId } = await req.json();

  const userContext = await buildUserContext(session.user.id);
  const basePrompt =
    process.env.NEXT_PUBLIC_PERSONA_ADAM_ENABLED === "true" &&
    session.user.sex === "male"
      ? FASHION_SYSTEM_PROMPT_ADAM
      : FASHION_SYSTEM_PROMPT;
  const systemPrompt = `${basePrompt}\n\n---\n\n${userContext}`;

  // Build full contents array for Gemini
  const contents: Content[] = messages.map((m: { role: string; content: string }) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let fullResponse = "";

      try {
        const stream = await googleAI.models.generateContentStream({
          model: "gemini-flash-lite-latest",
          config: {
            systemInstruction: systemPrompt,
          },
          contents,
        });

        for await (const chunk of stream) {
          const text = chunk.text ?? "";
          if (text) {
            fullResponse += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }
      } catch (error) {
        console.error("Google AI error:", error);
        const errorText = "Scuze, am întâmpinat o eroare. Încearcă din nou.";
        fullResponse = errorText;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ text: errorText })}\n\n`)
        );
      }

      // Save conversation
      const allMessages = [
        ...messages,
        { role: "assistant", content: fullResponse },
      ];

      if (conversationId) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { messages: JSON.stringify(allMessages) },
        });
      } else {
        const conv = await prisma.conversation.create({
          data: {
            userId: session.user.id,
            messages: JSON.stringify(allMessages),
          },
        });
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ conversationId: conv.id })}\n\n`
          )
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
