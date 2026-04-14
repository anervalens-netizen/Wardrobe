import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { name: true, sex: true } } },
  });

  if (!profile) {
    // Return just user fields when no profile row yet
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, sex: true },
    });
    return NextResponse.json({ name: user?.name ?? null, sex: user?.sex ?? null });
  }

  const { user, ...rest } = profile;
  return NextResponse.json({ ...rest, name: user.name, sex: user.sex });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const body = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name, sex, id: _id, userId: _userId, createdAt: _createdAt, updatedAt: _updatedAt, ...profileFields } = body;

  // Update User fields if provided
  if (name !== undefined || sex !== undefined) {
    const userUpdate: { name?: string; sex?: string } = {};
    if (name !== undefined) userUpdate.name = name;
    if (sex !== undefined) userUpdate.sex = sex;
    await prisma.user.update({ where: { id: session.user.id }, data: userUpdate });
  }

  const profile = await prisma.userProfile.upsert({
    where: { userId: session.user.id },
    update: profileFields,
    create: { userId: session.user.id, ...profileFields },
  });

  return NextResponse.json({ ...profile, name: name ?? null, sex: sex ?? null });
}
