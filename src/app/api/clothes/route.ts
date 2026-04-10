import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const clothingSchema = z.object({
  name: z.string().min(1, "Numele este obligatoriu"),
  category: z.string().min(1, "Categoria este obligatorie"),
  subcategory: z.string().optional(),
  size: z.string().optional(),
  colorPrimary: z.string().min(1, "Culoarea principală este obligatorie"),
  colorSecondary: z.string().optional(),
  pattern: z.string().optional(),
  material: z.string().optional(),
  brand: z.string().optional(),
  season: z.string().optional(),
  formality: z.string().optional(),
  condition: z.string().optional(),
  imagePath: z.string().optional(),
  tags: z.string().optional(),
  favorite: z.boolean().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const season = searchParams.get("season");
  const formality = searchParams.get("formality");
  const color = searchParams.get("color");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const where: Record<string, unknown> = { userId: session.user.id };
  if (category) where.category = category;
  if (season) where.season = season;
  if (formality) where.formality = formality;
  if (color) where.colorPrimary = color;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { brand: { contains: search } },
      { material: { contains: search } },
    ];
  }

  const items = await prisma.clothingItem.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = clothingSchema.parse(body);

    const item = await prisma.clothingItem.create({
      data: {
        ...data,
        userId: session.user.id,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Eroare la salvare" },
      { status: 500 }
    );
  }
}
