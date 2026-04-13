import { z } from "zod";

export const OnboardingProfileSchema = z.object({
  preferredName: z.string().min(1).max(60),
  sex: z.enum(["female", "male"]).nullable(),
  ageBand: z.enum(["under_25", "25_34", "35_44", "45_54", "55_plus"]).nullable(),
  dominantStyles: z.array(z.enum(["casual", "business", "elegant", "sportiv", "bohemian"])).default([]),
  preferredOccasions: z.array(z.enum(["office", "outings", "special_events", "travel", "home"])).default([]),
  favoriteColors: z.array(z.string().max(50)).max(20).default([]),
  avoidColors: z.array(z.string().max(50)).max(20).default([]),
  bodyType: z.enum(["slim", "athletic", "average", "curvy", "plus_size"]).nullable(),
  lifestyleNotes: z.string().max(1000).default(""),
});

export type OnboardingProfile = z.infer<typeof OnboardingProfileSchema>;
