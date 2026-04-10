import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const userId = session.user.id;

  const [totalItems, favoriteItems, totalOutfits, recentItems] =
    await Promise.all([
      prisma.clothingItem.count({ where: { userId } }),
      prisma.clothingItem.count({ where: { userId, favorite: true } }),
      prisma.outfit.count({ where: { userId } }),
      prisma.clothingItem.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          name: true,
          category: true,
          colorPrimary: true,
          imagePath: true,
        },
      }),
    ]);

  return NextResponse.json({
    totalItems,
    favoriteItems,
    totalOutfits,
    recentItems,
  });
}
