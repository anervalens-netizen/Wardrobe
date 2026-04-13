import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractOnboardingProfile } from "@/lib/ai/onboarding-extract";
import { seedMemoryFromProfile } from "@/lib/onboarding/seed-memory";
import type { OnboardingProfile } from "@/lib/onboarding/types";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  let messages: { role: "user" | "assistant"; content: string }[];
  try {
    const body = await req.json();
    messages = body.messages;
  } catch {
    return NextResponse.json({ error: "Body invalid" }, { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length < 2) {
    return NextResponse.json({ error: "Transcript invalid" }, { status: 400 });
  }

  let profile: OnboardingProfile;
  try {
    profile = await extractOnboardingProfile(messages);
  } catch (e) {
    console.error("Onboarding extract failed:", e);
    return NextResponse.json({ error: "Nu am putut interpreta răspunsurile. Încearcă din nou." }, { status: 422 });
  }

  const profileData = {
    stylePreferences: profile.dominantStyles.length > 0 ? JSON.stringify(profile.dominantStyles) : null,
    favoriteColors: profile.favoriteColors.length > 0 ? JSON.stringify(profile.favoriteColors) : null,
    avoidColors: profile.avoidColors.length > 0 ? JSON.stringify(profile.avoidColors) : null,
    preferredOccasions: profile.preferredOccasions.length > 0 ? JSON.stringify(profile.preferredOccasions) : null,
    lifestyleNotes: profile.lifestyleNotes || null,
    bodyType: profile.bodyType,
  };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: { sex: profile.sex, onboardingCompleted: true, name: profile.preferredName },
      });
      await tx.userProfile.upsert({
        where: { userId: session.user.id },
        update: profileData,
        create: { userId: session.user.id, ...profileData },
      });
    });
  } catch (e) {
    console.error("Onboarding persist failed:", e);
    return NextResponse.json({ error: "Eroare la salvare. Încearcă din nou." }, { status: 500 });
  }

  let factsCreated = 0;
  try {
    factsCreated = await seedMemoryFromProfile(session.user.id, profile);
  } catch (e) {
    console.error("seedMemoryFromProfile failed (non-fatal):", e);
    // Profile already saved — degraded success is acceptable
  }

  return NextResponse.json({ ok: true, factsCreated });
}
