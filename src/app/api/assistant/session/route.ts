import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// "Today" = since last 02:00 local time (Europe/Bucharest)
function getTodayStart(): Date {
  const now = new Date();
  // Get current time in Bucharest
  const buch = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Bucharest" })
  );
  const resetHour = 2; // 02:00

  const todayStart = new Date(buch);
  todayStart.setHours(resetHour, 0, 0, 0);

  // If current Bucharest time is before 02:00, go back to previous day's 02:00
  if (buch < todayStart) {
    todayStart.setDate(todayStart.getDate() - 1);
  }

  // Convert back to UTC for DB comparison
  const localOffset = buch.getTime() - now.getTime();
  return new Date(todayStart.getTime() - localOffset);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const todayStart = getTodayStart();

  const conversation = await prisma.conversation.findFirst({
    where: {
      userId: session.user.id,
      createdAt: { gte: todayStart },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!conversation) {
    return NextResponse.json({ conversationId: null, messages: [] });
  }

  const messages = JSON.parse(conversation.messages as string);
  return NextResponse.json({ conversationId: conversation.id, messages });
}
