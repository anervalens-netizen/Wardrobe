import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const IDLE_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours
const MIN_MESSAGES = 3;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - IDLE_THRESHOLD_MS);

  // Find open sessions with enough messages where the last message is old
  const staleSessions = await prisma.chatSession.findMany({
    where: {
      closedAt: null,
    },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: { select: { messages: true } },
    },
  });

  const toClose = staleSessions.filter(
    (s) =>
      s._count.messages >= MIN_MESSAGES &&
      s.messages[0] &&
      s.messages[0].createdAt < cutoff
  );

  let closed = 0;
  for (const s of toClose) {
    await prisma.chatSession.update({
      where: { id: s.id },
      data: { closedAt: new Date(), closureMethod: "cron" },
    });
    closed++;
  }

  return NextResponse.json({ ok: true, closed });
}
