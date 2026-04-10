import { prisma } from "@/lib/prisma";

export async function buildUserContext(userId: string): Promise<string> {
  const [profile, clothingItems, recentOutfits] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.clothingItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.outfit.findMany({
      where: { userId },
      include: {
        outfitItems: {
          include: { clothingItem: true },
        },
        outfitWears: {
          orderBy: { wornAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const sections: string[] = [];

  // Profile section
  if (profile) {
    const profileLines: string[] = ["## Profilul clientului"];
    if (profile.heightCm) profileLines.push(`- Înălțime: ${profile.heightCm} cm`);
    if (profile.weightKg) profileLines.push(`- Greutate: ${profile.weightKg} kg`);
    if (profile.bodyType) profileLines.push(`- Tip corp: ${profile.bodyType}`);
    if (profile.skinTone) profileLines.push(`- Ton piele: ${profile.skinTone}`);
    if (profile.hairColor) profileLines.push(`- Culoare păr: ${profile.hairColor}`);
    if (profile.eyeColor) profileLines.push(`- Culoare ochi: ${profile.eyeColor}`);
    if (profile.favoriteColors) {
      const colors = JSON.parse(profile.favoriteColors);
      if (colors.length) profileLines.push(`- Culori favorite: ${colors.join(", ")}`);
    }
    if (profile.avoidColors) {
      const colors = JSON.parse(profile.avoidColors);
      if (colors.length) profileLines.push(`- Culori de evitat: ${colors.join(", ")}`);
    }
    if (profile.stylePreferences) {
      const styles = JSON.parse(profile.stylePreferences);
      if (styles.length) profileLines.push(`- Stiluri preferate: ${styles.join(", ")}`);
    }
    if (profile.notes) profileLines.push(`- Note: ${profile.notes}`);
    sections.push(profileLines.join("\n"));
  }

  // Wardrobe section
  if (clothingItems.length > 0) {
    const wardrobeLines: string[] = [`## Garderoba (${clothingItems.length} piese)`];
    for (const item of clothingItems) {
      const details = [
        item.category,
        item.colorPrimary,
        item.pattern && item.pattern !== "solid" ? item.pattern : null,
        item.material,
        item.formality,
        item.season && item.season !== "all" ? `sezon: ${item.season}` : null,
        item.size ? `mărime: ${item.size}` : null,
      ]
        .filter(Boolean)
        .join(", ");
      wardrobeLines.push(`- **${item.name}** (${details})${item.favorite ? " ⭐" : ""}`);
    }
    sections.push(wardrobeLines.join("\n"));
  } else {
    sections.push("## Garderoba\nClientul nu a adăugat încă haine în garderobă.");
  }

  // Recent outfits section
  if (recentOutfits.length > 0) {
    const outfitLines: string[] = ["## Ultimele ținute"];
    for (const outfit of recentOutfits) {
      const items = outfit.outfitItems
        .map((oi) => oi.clothingItem.name)
        .join(" + ");
      const wears = outfit.outfitWears.length;
      const avgRating =
        outfit.outfitWears.length > 0
          ? (
              outfit.outfitWears.reduce((sum, w) => sum + (w.rating || 0), 0) /
              outfit.outfitWears.filter((w) => w.rating).length
            ).toFixed(1)
          : null;
      outfitLines.push(
        `- ${outfit.name}: ${items}${wears > 0 ? ` (purtată de ${wears} ori${avgRating ? `, rating mediu: ${avgRating}/5` : ""})` : ""}`
      );
    }
    sections.push(outfitLines.join("\n"));
  }

  return sections.join("\n\n");
}
