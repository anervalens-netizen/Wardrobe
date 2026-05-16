import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { closeSessionWithSummary } from "@/lib/session-close";
import { NextResponse } from "next/server";

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

  const chatSession = await prisma.chatSession.findUnique({
    where: { id },
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

  await prisma.chatSession.update({
    where: { id },
    data: { closedAt: new Date(), closureMethod },
  });

  const { summaryCreated } = await closeSessionWithSummary(id, session.user.id);

  return NextResponse.json({ ok: true, summaryCreated });
}
