import { googleAI } from "./client";
import { OnboardingProfile, OnboardingProfileSchema } from "@/lib/onboarding/types";

const EXTRACT_SYSTEM = `Ești un parser. Primești un transcript de onboarding și returnezi DOAR JSON valid conform schemei. Nu adăuga text explicativ, nu folosi markdown fences. Dacă utilizatorul a sărit o întrebare, folosește null sau array gol.

Caz special — sex: dacă utilizatorul a sărit întrebarea despre sex și apoi a răspuns la picker-ul neutru "Ava" sau "Adam", lasă sex=null în output (alegerea este despre persona, nu despre sex) și menționează alegerea în lifestyleNotes (ex: "Preferă versiunea Ava").

Schema:
{
  "preferredName": string,
  "sex": "female" | "male" | null,
  "ageBand": "under_25" | "25_34" | "35_44" | "45_54" | "55_plus" | null,
  "dominantStyles": string[],  // din: casual, business, elegant, sportiv, bohemian
  "preferredOccasions": string[],  // din: office, outings, special_events, travel, home
  "favoriteColors": string[],  // text liber, traduse în română
  "avoidColors": string[],
  "bodyType": "slim" | "athletic" | "average" | "curvy" | "plus_size" | null,
  "lifestyleNotes": string  // sumar scurt al răspunsului liber
}`;

export async function extractOnboardingProfile(
  transcript: { role: "user" | "assistant"; content: string }[],
): Promise<OnboardingProfile> {
  const transcriptText = transcript
    .map((m) => `${m.role === "assistant" ? "AI" : "User"}: ${m.content}`)
    .join("\n");

  const result = await googleAI.models.generateContent({
    model: "gemini-flash-lite-latest",
    config: { systemInstruction: EXTRACT_SYSTEM, responseMimeType: "application/json" },
    contents: [{ role: "user", parts: [{ text: transcriptText }] }],
  });

  const raw = result.text ?? "";
  const parsed = JSON.parse(raw);
  return OnboardingProfileSchema.parse(parsed);
}
