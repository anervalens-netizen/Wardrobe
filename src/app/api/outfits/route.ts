import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const outfitSchema = z.object({
  name: z.string().min(1),
  occasion: z.string().optional(),
  aiGenerated: z.boolean().optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  clothingItemIds: z.array(z.string()),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const outfits = await prisma.outfit.findMany({
    where: { userId: session.user.id },
    include: {
      outfitItems: {
        include: { clothingItem: true },
      },
      outfitWears: {
        orderBy: { wornAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(outfits);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { clothingItemIds, ...data } = outfitSchema.parse(body);

    const outfit = await prisma.outfit.create({
      data: {
        ...data,
        userId: session.user.id,
        outfitItems: {
          create: clothingItemIds.map((id) => ({ clothingItemId: id })),
        },
      },
      include: {
        outfitItems: { include: { clothingItem: true } },
      },
    });

    return NextResponse.json(outfit, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Eroare la salvare" }, { status: 500 });
  }
}
