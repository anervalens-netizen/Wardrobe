import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const sessions = await prisma.chatSession.findMany({
    where: {
      userId: session.user.id,
      closedAt: { not: null },
    },
    orderBy: { startedAt: "desc" },
    take: 50,
    include: {
      summary: true,
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(sessions);
}
