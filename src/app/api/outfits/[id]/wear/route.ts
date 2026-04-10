import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  const body = await req.json();

  const outfit = await prisma.outfit.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!outfit) {
    return NextResponse.json({ error: "Negăsit" }, { status: 404 });
  }

  const wear = await prisma.outfitWear.create({
    data: {
      outfitId: id,
      userId: session.user.id,
      occasion: body.occasion,
      weather: body.weather,
      rating: body.rating,
      feedback: body.feedback,
    },
  });

  return NextResponse.json(wear, { status: 201 });
}
