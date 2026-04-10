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
  const item = await prisma.clothingItem.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!item) {
    return NextResponse.json({ error: "Negăsit" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.clothingItem.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Negăsit" }, { status: 404 });
  }

  const body = await req.json();
  const item = await prisma.clothingItem.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(item);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.clothingItem.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Negăsit" }, { status: 404 });
  }

  await prisma.clothingItem.delete({ where: { id } });

  return NextResponse.json({ message: "Șters cu succes" });
}
