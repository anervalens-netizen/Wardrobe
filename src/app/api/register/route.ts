import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import cuid from "cuid";

const registerSchema = z.object({
  name: z.string().min(2, "Numele trebuie să aibă minim 2 caractere"),
  email: z.string().email("Email invalid"),
  password: z.string().min(6, "Parola trebuie să aibă minim 6 caractere"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Există deja un cont cu acest email" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date();

    const user = await prisma.user.create({
      data: {
        id: cuid(),
        name,
        email,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      },
    });

    await prisma.userProfile.create({
      data: {
        id: cuid(),
        userId: user.id,
        createdAt: now,
        updatedAt: now,
      },
    });

    return NextResponse.json(
      { message: "Cont creat cu succes" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Eroare la crearea contului" },
      { status: 500 }
    );
  }
}
