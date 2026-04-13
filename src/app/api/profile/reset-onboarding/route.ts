import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingCompleted: false },
  });
  return NextResponse.json({ ok: true });
}
