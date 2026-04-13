import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// "Today" = since last 02:00 local time (Europe/Bucharest)
function getTodayStart(): Date {
  const now = new Date();
  const buch = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Bucharest" })
  );
  const resetHour = 2;

  const todayStart = new Date(buch);
  todayStart.setHours(resetHour, 0, 0, 0);

  if (buch < todayStart) {
    todayStart.setDate(todayStart.getDate() - 1);
  }

  const localOffset = buch.getTime() - now.getTime();
  return new Date(todayStart.getTime() - localOffset);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const todayStart = getTodayStart();

  const chatSession = await prisma.chatSession.findFirst({
    where: {
      userId: session.user.id,
      type: "daily",
      closedAt: null,
      startedAt: { gte: todayStart },
    },
    orderBy: { startedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!chatSession) {
    return NextResponse.json({ sessionId: null, messages: [] });
  }

  const messages = chatSession.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  return NextResponse.json({ sessionId: chatSession.id, messages });
}
