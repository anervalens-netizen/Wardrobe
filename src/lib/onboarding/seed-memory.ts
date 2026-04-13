import { prisma } from "@/lib/prisma";
import type { OnboardingProfile } from "./types";

export async function seedMemoryFromProfile(userId: string, profile: OnboardingProfile): Promise<number> {
  const facts: { type: string; content: string }[] = [];

  if (profile.dominantStyles.length > 0) {
    facts.push({ type: "preference_strong", content: `Stiluri preferate: ${profile.dominantStyles.join(", ")}` });
  }
  if (profile.preferredOccasions.length > 0) {
    facts.push({ type: "preference_strong", content: `Ocazii frecvente: ${profile.preferredOccasions.join(", ")}` });
  }
  for (const color of profile.favoriteColors) {
    facts.push({ type: "preference_strong", content: `Culoare preferată: ${color}` });
  }
  for (const color of profile.avoidColors) {
    facts.push({ type: "aversion", content: `Evită culoarea: ${color}` });
  }
  if (profile.bodyType) {
    facts.push({ type: "essential", content: `Tip corp: ${profile.bodyType}` });
  }
  if (profile.ageBand) {
    facts.push({ type: "essential", content: `Vârstă: ${profile.ageBand}` });
  }
  if (profile.lifestyleNotes.trim()) {
    facts.push({ type: "essential", content: `Note: ${profile.lifestyleNotes.trim()}` });
  }

  if (facts.length === 0) return 0;

  await prisma.$transaction([
    prisma.userMemoryFact.deleteMany({
      where: { userId, type: { in: ["preference_strong", "aversion", "essential"] } },
    }),
    prisma.userMemoryFact.createMany({
      data: facts.map((f) => ({ userId, type: f.type, content: f.content, confidence: 3, sourceCount: 1 })),
    }),
  ]);
  return facts.length;
}
