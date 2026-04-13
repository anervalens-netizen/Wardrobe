import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractOnboardingProfile } from "@/lib/ai/onboarding-extract";
import { seedMemoryFromProfile } from "@/lib/onboarding/seed-memory";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { messages } = (await req.json()) as { messages: { role: "user" | "assistant"; content: string }[] };
  if (!Array.isArray(messages) || messages.length < 2) {
    return NextResponse.json({ error: "Transcript invalid" }, { status: 400 });
  }

  let profile;
  try {
    profile = await extractOnboardingProfile(messages);
  } catch (e) {
    console.error("Onboarding extract failed:", e);
    return NextResponse.json({ error: "Nu am putut interpreta răspunsurile. Încearcă din nou." }, { status: 422 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: session.user.id },
      data: { sex: profile.sex, onboardingCompleted: true, name: profile.preferredName },
    });
    await tx.userProfile.upsert({
      where: { userId: session.user.id },
      update: {
        favoriteColors: profile.favoriteColors.length > 0 ? JSON.stringify(profile.favoriteColors) : null,
        avoidColors: profile.avoidColors.length > 0 ? JSON.stringify(profile.avoidColors) : null,
        stylePreferences: profile.dominantStyles.length > 0 ? JSON.stringify(profile.dominantStyles) : null,
        preferredOccasions: profile.preferredOccasions.length > 0 ? JSON.stringify(profile.preferredOccasions) : null,
        lifestyleNotes: profile.lifestyleNotes || null,
        bodyType: profile.bodyType,
      },
      create: {
        userId: session.user.id,
        favoriteColors: profile.favoriteColors.length > 0 ? JSON.stringify(profile.favoriteColors) : null,
        avoidColors: profile.avoidColors.length > 0 ? JSON.stringify(profile.avoidColors) : null,
        stylePreferences: profile.dominantStyles.length > 0 ? JSON.stringify(profile.dominantStyles) : null,
        preferredOccasions: profile.preferredOccasions.length > 0 ? JSON.stringify(profile.preferredOccasions) : null,
        lifestyleNotes: profile.lifestyleNotes || null,
        bodyType: profile.bodyType,
      },
    });
  });

  const factsCreated = await seedMemoryFromProfile(session.user.id, profile);

  return NextResponse.json({ ok: true, profile, factsCreated });
}
