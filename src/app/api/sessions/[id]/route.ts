import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { id } = await params;

  const chatSession = await prisma.chatSession.findUnique({
    where: { id, userId: session.user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      summary: true,
    },
  });

  if (!chatSession) {
    return NextResponse.json({ error: "Sesiune negăsită" }, { status: 404 });
  }

  return NextResponse.json(chatSession);
}