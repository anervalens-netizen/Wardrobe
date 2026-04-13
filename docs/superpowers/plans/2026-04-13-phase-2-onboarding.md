# Phase 2 — Rebrand + Conversational Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the public surface to "AI Stylist Advisor" and ship a conversational `/onboarding` flow that collects sex, name, style, occasions, colors, etc., persists them to `User` + `UserProfile`, then routes to `/dashboard`. All users still see the existing Ava UI (Adam comes in Phase 3).

**Architecture:** Client-side state machine drives the chat (current step + accumulated answers in React state). `/api/onboarding/chat` streams Gemini text per turn (mirrors `/api/assistant/chat` pattern). `/api/onboarding/complete` runs a one-shot LLM extraction over the full transcript, persists the structured profile, seeds `UserMemoryFact` rows, and flips `onboardingCompleted=true`. Middleware redirects users with `onboardingCompleted=false` to `/onboarding` *only* when `FORCE_ONBOARDING=true`.

**Tech Stack:** Next.js 16 App Router, Prisma 7 + libsql, NextAuth v5, `@google/genai` (`gemini-flash-lite-latest`), Tailwind + shadcn/ui, server-sent events for streaming.

**Spec source:** `docs/superpowers/specs/2026-04-13-ai-stylist-advisor-redesign-design.md` sections 4 (onboarding flow), 8.4–8.6 (existing-user handling + memory seed), 9 Phase 2 (deployment).

**Phase 1 dependencies already in place:** schema (`User.sex`, `User.onboardingCompleted`, `UserProfile.preferredOccasions/lifestyleNotes/themeVariant`, `UserMemoryFact` table), 501-stub routes at `/api/onboarding/{chat,complete}`, `serverFeatureFlags.forceOnboarding` reader, middleware bypass for `/api/cron/*`.

---

## File Structure

**Create:**
- `src/lib/ai/onboarding-system-prompt.ts` — Romanian system prompt that drives the 8–10 turn script + extraction rules
- `src/lib/ai/onboarding-extract.ts` — one-shot Gemini call that converts a finished transcript into a typed `OnboardingProfile`
- `src/lib/onboarding/types.ts` — `OnboardingProfile` Zod schema (single source of truth for shape)
- `src/lib/onboarding/seed-memory.ts` — turns the extracted profile into initial `UserMemoryFact` rows
- `src/app/onboarding/layout.tsx` — minimal full-screen layout, no sidebar/nav
- `src/app/onboarding/page.tsx` — server component: requires session, renders `<OnboardingChat>`, passes any pre-existing `UserProfile` so AI confirms instead of asking blank
- `src/components/onboarding/onboarding-chat.tsx` — client component: full chat state machine + stream consumer + skip
- `src/components/onboarding/quick-replies.tsx` — multi-button reply row that simulates a user message on click
- `src/app/api/profile/reset-onboarding/route.ts` — `POST` flips `onboardingCompleted=false` for the current session user

**Modify:**
- `src/app/page.tsx` — landing rebrand (header word "Ava" → "AI Stylist Advisor", hero copy)
- `src/app/(auth)/login/page.tsx` — neutralize Ava-only copy/branding
- `src/app/(auth)/register/page.tsx` — same
- `src/app/(auth)/layout.tsx` — same (if it carries any "Ava" wordmark)
- `src/app/manifest.ts` — PWA `name` / `short_name` updated to AI Stylist Advisor (keep existing icon for now; logo refresh is out of scope for Phase 2)
- `src/app/api/onboarding/chat/route.ts` — replace 501 stub with streaming Gemini handler
- `src/app/api/onboarding/complete/route.ts` — replace 501 stub with extract + persist + memory-seed pipeline
- `src/middleware.ts` — when `FORCE_ONBOARDING=true`, redirect authenticated users with `onboardingCompleted=false` to `/onboarding` (allow-list `/onboarding` and `/api/onboarding/*` to avoid loops)
- `src/lib/auth.ts` — extend `jwt`/`session` callbacks to hydrate and refresh `onboardingCompleted` + `sex` claims (supports `useSession().update()` refresh)
- `src/types/next-auth.d.ts` — add `onboardingCompleted` and `sex` to `Session["user"]`; add `JWT` module augmentation for the same fields
- `src/app/(main)/profile/page.tsx` — add "Vorbește din nou cu stilistul" action that POSTs to `/api/profile/reset-onboarding` then `router.push("/onboarding")`

**No tests:** repo currently has no test runner configured. Each task ends with a manual smoke step against `npm run dev` instead of automated tests. The spec's acceptance criteria (section 10) drive the final smoke pass.

---

## Task 1: Landing + auth + manifest rebrand

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/register/page.tsx`
- Modify: `src/app/(auth)/layout.tsx`
- Modify: `src/app/manifest.ts`

- [ ] **Step 1: Rebrand landing header + hero**

In `src/app/page.tsx`, replace the `Ava` wordmark and hero headline:

```tsx
// Header brand mark
<span className="text-xl font-bold">AI Stylist Advisor</span>

// Hero h1
<h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
  Stilistul tău AI personal
  <br />
  <span className="text-muted-foreground">pentru garderoba ta digitală</span>
</h1>

// Footer
<p>AI Stylist Advisor &copy; {new Date().getFullYear()}</p>
```

Keep the `Sparkles` icon, the layout, and the three feature cards. Do not introduce Ava OR Adam wording on the landing — the umbrella name is the *only* thing visible publicly.

- [ ] **Step 2: Neutralize auth pages**

Open `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`, and `src/app/(auth)/layout.tsx`. Replace any `Ava` literal (header, page title, taglines) with `AI Stylist Advisor`. Drop violet/teal accent classes only if they're explicitly Ava-themed copy; do NOT restyle inputs/buttons (theme system stays intact and is updated in Phase 3).

- [ ] **Step 3: Update PWA manifest**

In `src/app/manifest.ts`:

```ts
return {
  name: "AI Stylist Advisor",
  short_name: "AI Stylist",
  description: "Stilistul tău AI personal pentru garderoba ta digitală",
  // keep existing start_url, display, theme_color, background_color, icons
  ...
};
```

- [ ] **Step 4: Smoke test rebrand**

Run: `npm run dev` then visit `/`, `/login`, `/register`. Confirm: no "Ava" text visible. Open DevTools → Application → Manifest, confirm `name === "AI Stylist Advisor"`.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/\(auth\)/ src/app/manifest.ts
git commit -m "feat(brand): rebrand public surface to AI Stylist Advisor"
```

---

## Task 2: Onboarding profile schema + extraction prompt

**Files:**
- Create: `src/lib/onboarding/types.ts`
- Create: `src/lib/ai/onboarding-system-prompt.ts`
- Create: `src/lib/ai/onboarding-extract.ts`

- [ ] **Step 1: Define `OnboardingProfile` Zod schema**

Create `src/lib/onboarding/types.ts`:

```ts
import { z } from "zod";

export const OnboardingProfileSchema = z.object({
  preferredName: z.string().min(1).max(60),
  sex: z.enum(["female", "male"]).nullable(),
  ageBand: z.enum(["under_25", "25_34", "35_44", "45_54", "55_plus"]).nullable(),
  dominantStyles: z.array(z.enum(["casual", "business", "elegant", "sportiv", "bohemian"])).default([]),
  preferredOccasions: z.array(z.enum(["office", "outings", "special_events", "travel", "home"])).default([]),
  favoriteColors: z.array(z.string()).default([]),
  avoidColors: z.array(z.string()).default([]),
  bodyType: z.enum(["slim", "athletic", "average", "curvy", "plus_size"]).nullable(),
  lifestyleNotes: z.string().max(1000).default(""),
});

export type OnboardingProfile = z.infer<typeof OnboardingProfileSchema>;
```

`sex` and `bodyType` are nullable because the user can skip them (anti-stuck).

- [ ] **Step 2: Write the onboarding system prompt**

Create `src/lib/ai/onboarding-system-prompt.ts`. The prompt MUST:
- Speak Romanian, warm but concise
- Ask **one** question per turn
- React briefly to each answer ("Îmi place numele tău, X.")
- Cover topics in this order: name → sex → age (optional) → dominant style → occasions → favorite colors → avoid colors → body type (optional, diplomatic) → free-text closer → closing line "Am notat tot. Hai să-ți construim împreună garderoba digitală."
- For sex/style/occasions/colors render an instruction line on its own: `[QUICK_REPLIES]: option1, option2, option3`. The client parses that line to render buttons; AI must not embed buttons inside prose.
- After the user picks sex, immediately introduce as Ava (female) or Adam (male): "Mă bucur, X. De acum sunt Ava, stilista ta personală." / "Mă bucur, X. De acum sunt Adam, stilistul tău personal."
- Accept a `[SKIP]` user reply and move to the next topic without re-asking
- If the user has an existing profile (passed in as `## Profil existent` context block at the top of the system prompt), confirm rather than re-ask: "Văd că preferi stilul casual — e încă valabil?"
- Stop generating after the closing line; the client will then call `/api/onboarding/complete`

Export as named const:

```ts
export function buildOnboardingSystemPrompt(existingProfileMarkdown: string | null): string {
  const profileBlock = existingProfileMarkdown
    ? `\n\n## Profil existent\n${existingProfileMarkdown}\n\nConfirmă datele de mai sus în loc să întrebi de la zero.`
    : "";
  return `Ești stilistul AI care îl onboardează pe utilizator în aplicația "AI Stylist Advisor".

## Reguli STRICTE
1. O singură întrebare per mesaj
2. Reacționează scurt și cald la răspunsul anterior
3. Pentru întrebări cu opțiuni discrete, adaugă pe un rând separat la finalul mesajului: [QUICK_REPLIES]: optiune1, optiune2, optiune3
4. Nu pune butoanele în text — doar pe linia [QUICK_REPLIES]
5. După ce afli sexul, prezintă-te imediat ca Ava (femeie) sau Adam (bărbat)
6. Dacă utilizatorul răspunde [SKIP], treci la subiectul următor fără să reformulezi (cu EXCEPȚIA întrebării despre sex — vezi regula 8)
7. Termină conversația cu exact: "Am notat tot. Hai să-ți construim împreună garderoba digitală."
8. Sex este întrebarea critică (determină persona). Dacă utilizatorul răspunde [SKIP] la sex:
   - Prima dată: reformulează blând, explicând scurt de ce contează ("Ca să-ți pot recomanda stilul potrivit, aș vrea să știu — preferi versiunea Ava sau Adam?") și re-oferă opțiunile: [QUICK_REPLIES]: Femeie, Bărbat, Prefer să nu spun
   - A doua oară (dacă sare din nou): acceptă și oferă un picker neutru pentru persona — "Fără problemă. Vrei să vezi versiunea Ava sau versiunea Adam?" cu [QUICK_REPLIES]: Ava, Adam. Apoi continuă la vârstă.

## Topicuri în ordine
1. Nume preferat (text liber)
2. Sex — [QUICK_REPLIES]: Femeie, Bărbat, Prefer să nu spun (vezi regula 8 pentru [SKIP])
3. Vârstă aproximativă (opțional) — [QUICK_REPLIES]: Sub 25, 25-34, 35-44, 45-54, 55+
4. Stil dominant (poate alege mai multe) — [QUICK_REPLIES]: Casual, Business, Elegant, Sportiv, Bohemian
5. Ocazii frecvente — [QUICK_REPLIES]: Birou, Ieșiri, Evenimente speciale, Călătorii, Acasă
6. Culori preferate (text liber sau opțiuni) — [QUICK_REPLIES]: Negru, Alb, Bej, Bleumarin, Burgundy, Verde, Pastelate
7. Culori de evitat (text liber)
8. Tip corp (opțional, diplomatic) — [QUICK_REPLIES]: Slim, Atletic, Mediu, Curvy, Plus-size, Prefer să nu spun
9. Un text liber: "Mai e ceva ce vrei să știu despre tine sau stilul tău?"
10. Linie de închidere fixă (vezi regula 7)${profileBlock}`;
}
```

- [ ] **Step 3: Write the extraction call**

Create `src/lib/ai/onboarding-extract.ts`. Takes the full transcript, asks Gemini to return JSON matching `OnboardingProfileSchema`, validates with Zod, returns the parsed profile or throws.

```ts
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
```

- [ ] **Step 4: Smoke check the prompt files compile**

Run: `npx tsc --noEmit --skipLibCheck`. Expected: no errors in the new files. (Existing repo errors, if any, are out of scope.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/onboarding/types.ts src/lib/ai/onboarding-system-prompt.ts src/lib/ai/onboarding-extract.ts
git commit -m "feat(onboarding): system prompt + Zod profile schema + extractor"
```

---

## Task 3: `/api/onboarding/chat` streaming handler

**Files:**
- Modify: `src/app/api/onboarding/chat/route.ts`

- [ ] **Step 1: Replace 501 stub with streaming handler**

Mirror `src/app/api/assistant/chat/route.ts`. Differences:
- System prompt comes from `buildOnboardingSystemPrompt(existingProfileMarkdown)` instead of `FASHION_SYSTEM_PROMPT`
- We do NOT persist messages to `Conversation` here — the entire onboarding transcript stays client-side until `/api/onboarding/complete`
- We pass the *existing* `UserProfile` (if any) as a markdown block so the AI confirms instead of starting blank

```ts
import { auth } from "@/lib/auth";
import { googleAI } from "@/lib/ai/client";
import { buildOnboardingSystemPrompt } from "@/lib/ai/onboarding-system-prompt";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { Content } from "@google/genai";

function profileToMarkdown(p: { favoriteColors?: string | null; avoidColors?: string | null; preferredOccasions?: string | null; lifestyleNotes?: string | null; height?: number | null; bodyType?: string | null; }): string | null {
  const lines: string[] = [];
  if (p.favoriteColors) lines.push(`- Culori preferate: ${p.favoriteColors}`);
  if (p.avoidColors) lines.push(`- Culori de evitat: ${p.avoidColors}`);
  if (p.preferredOccasions) lines.push(`- Ocazii: ${p.preferredOccasions}`);
  if (p.bodyType) lines.push(`- Tip corp: ${p.bodyType}`);
  if (p.height) lines.push(`- Înălțime: ${p.height} cm`);
  if (p.lifestyleNotes) lines.push(`- Note: ${p.lifestyleNotes}`);
  return lines.length > 0 ? lines.join("\n") : null;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { messages } = (await req.json()) as { messages: { role: "user" | "assistant"; content: string }[] };

  const existingProfile = await prisma.userProfile.findUnique({ where: { userId: session.user.id } });
  const systemPrompt = buildOnboardingSystemPrompt(existingProfile ? profileToMarkdown(existingProfile) : null);

  const contents: Content[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await googleAI.models.generateContentStream({
          model: "gemini-flash-lite-latest",
          config: { systemInstruction: systemPrompt },
          contents,
        });
        for await (const chunk of stream) {
          const text = chunk.text ?? "";
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }
      } catch (error) {
        console.error("Onboarding chat error:", error);
        const errorText = "Scuze, am întâmpinat o eroare. Încearcă din nou.";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: errorText })}\n\n`));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
```

- [ ] **Step 2: Smoke test with curl**

Start `npm run dev`, log in via the browser, then in DevTools → Application → Cookies copy `authjs.session-token`. Run:

```bash
curl -N -X POST http://localhost:3000/api/onboarding/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=<paste>" \
  -d '{"messages":[]}'
```

Expected: SSE stream begins; first chunks should ask the user's preferred name in Romanian, ending with `[DONE]`. No `[QUICK_REPLIES]` line for the first turn (name is free text).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/onboarding/chat/route.ts
git commit -m "feat(onboarding): implement streaming chat endpoint"
```

---

## Task 4: `/api/onboarding/complete` extract + persist + memory seed

**Files:**
- Create: `src/lib/onboarding/seed-memory.ts`
- Modify: `src/app/api/onboarding/complete/route.ts`

- [ ] **Step 1: Write the memory-seed function**

Create `src/lib/onboarding/seed-memory.ts`:

```ts
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

  await prisma.userMemoryFact.createMany({
    data: facts.map((f) => ({ userId, type: f.type, content: f.content, confidence: 3, sourceCount: 1 })),
  });
  return facts.length;
}
```

- [ ] **Step 2: Replace the `complete` 501 stub**

In `src/app/api/onboarding/complete/route.ts`:

```ts
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
        favoriteColors: profile.favoriteColors.join(", ") || null,
        avoidColors: profile.avoidColors.join(", ") || null,
        preferredOccasions: profile.preferredOccasions.join(", ") || null,
        lifestyleNotes: profile.lifestyleNotes || null,
        bodyType: profile.bodyType,
      },
      create: {
        userId: session.user.id,
        favoriteColors: profile.favoriteColors.join(", ") || null,
        avoidColors: profile.avoidColors.join(", ") || null,
        preferredOccasions: profile.preferredOccasions.join(", ") || null,
        lifestyleNotes: profile.lifestyleNotes || null,
        bodyType: profile.bodyType,
      },
    });
  });

  const factsCreated = await seedMemoryFromProfile(session.user.id, profile);

  return NextResponse.json({ ok: true, profile, factsCreated });
}
```

Note: this writes `User.name` from `preferredName`; the existing column is the right home for this.

- [ ] **Step 3: Smoke-curl `complete`**

With a logged-in cookie, POST a fake transcript:

```bash
curl -X POST http://localhost:3000/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=<paste>" \
  -d '{"messages":[
    {"role":"assistant","content":"Cum te numești?"},
    {"role":"user","content":"Andrei"},
    {"role":"assistant","content":"Sex? [QUICK_REPLIES]: Femeie, Bărbat"},
    {"role":"user","content":"Bărbat"},
    {"role":"assistant","content":"Stil? [QUICK_REPLIES]: Casual, Business"},
    {"role":"user","content":"Casual"},
    {"role":"assistant","content":"Am notat tot."}
  ]}'
```

Expected: 200, JSON body with `ok:true`, `profile.sex == "male"`, `factsCreated >= 1`. Then run `npx prisma studio` (or a quick query) to confirm `User.onboardingCompleted == true` for that user and at least one `UserMemoryFact` row exists.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/onboarding/complete/route.ts src/lib/onboarding/seed-memory.ts
git commit -m "feat(onboarding): persist extracted profile + seed UserMemoryFact"
```

---

## Task 5: Onboarding page shell + layout

**Files:**
- Create: `src/app/onboarding/layout.tsx`
- Create: `src/app/onboarding/page.tsx`

- [ ] **Step 1: Minimal layout**

Create `src/app/onboarding/layout.tsx`:

```tsx
import { Sparkles } from "lucide-react";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center gap-2 px-4 py-4">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="font-semibold">AI Stylist Advisor</span>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
```

No sidebar, no main nav — the page intentionally has no escape routes.

- [ ] **Step 2: Server page that gates on session and renders the chat**

Create `src/app/onboarding/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OnboardingChat } from "@/components/onboarding/onboarding-chat";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true },
  });

  if (user?.onboardingCompleted) {
    redirect("/dashboard");
  }

  return <OnboardingChat />;
}
```

The redirect-if-already-completed guard prevents a logged-in user from re-entering by URL. The "rerun" path goes through `/api/profile/reset-onboarding` → `onboardingCompleted=false` → page is reachable again.

- [ ] **Step 3: Add a placeholder OnboardingChat so the page builds**

Temporarily create `src/components/onboarding/onboarding-chat.tsx` with a stub:

```tsx
"use client";
export function OnboardingChat() {
  return <div className="p-6">Onboarding chat coming next.</div>;
}
```

(Real implementation lands in Task 6.)

- [ ] **Step 4: Smoke test**

Run `npm run dev`. While logged in, navigate to `/onboarding`. Expected: header reads "AI Stylist Advisor", placeholder div renders. Logged-out → redirect to `/login`. With `onboardingCompleted=true` → redirect to `/dashboard`.

- [ ] **Step 5: Commit**

```bash
git add src/app/onboarding/ src/components/onboarding/onboarding-chat.tsx
git commit -m "feat(onboarding): page shell + auth/completion guards"
```

---

## Task 6: Onboarding chat client component

**Files:**
- Modify: `src/components/onboarding/onboarding-chat.tsx`
- Create: `src/components/onboarding/quick-replies.tsx`

- [ ] **Step 1: Quick-replies component**

Create `src/components/onboarding/quick-replies.tsx`:

```tsx
"use client";
import { Button } from "@/components/ui/button";

export function QuickReplies({ options, onPick }: { options: string[]; onPick: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map((opt) => (
        <Button key={opt} variant="outline" size="sm" onClick={() => onPick(opt)}>
          {opt}
        </Button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Implement OnboardingChat**

Replace the stub at `src/components/onboarding/onboarding-chat.tsx`:

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuickReplies } from "./quick-replies";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_REPLIES_PREFIX = "[QUICK_REPLIES]:";

function splitQuickReplies(content: string): { text: string; options: string[] } {
  const lines = content.split("\n");
  const qrLine = lines.find((l) => l.trim().startsWith(QUICK_REPLIES_PREFIX));
  if (!qrLine) return { text: content, options: [] };
  const options = qrLine
    .slice(qrLine.indexOf(":") + 1)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const text = lines.filter((l) => !l.trim().startsWith(QUICK_REPLIES_PREFIX)).join("\n").trim();
  return { text, options };
}

const CLOSING_MARKER = "Hai să-ți construim împreună garderoba digitală";

export function OnboardingChat() {
  const router = useRouter();
  const { update: refreshSession } = useSession();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function sendNext(history: Msg[]) {
    setStreaming(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffered = "";
      let assistantText = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffered += decoder.decode(value, { stream: true });
        const events = buffered.split("\n\n");
        buffered = events.pop() ?? "";
        for (const ev of events) {
          if (!ev.startsWith("data: ")) continue;
          const data = ev.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (typeof parsed.text === "string") {
              assistantText += parsed.text;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "assistant", content: assistantText };
                return next;
              });
            }
          } catch {
            /* ignore malformed chunk */
          }
        }
      }

      if (assistantText.includes(CLOSING_MARKER)) {
        await complete([...history, { role: "assistant", content: assistantText }]);
      }
    } catch (e) {
      console.error(e);
      setError("Eroare de conexiune. Încearcă din nou.");
    } finally {
      setStreaming(false);
    }
  }

  async function complete(finalHistory: Msg[]) {
    setCompleting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: finalHistory }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      // Refresh the NextAuth JWT so `onboardingCompleted` becomes true on the
      // client before the dashboard nav — otherwise middleware's stale-claim
      // check could bounce the user back to /onboarding on the first request.
      await refreshSession();
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Eroare la finalizare.");
    } finally {
      setCompleting(false);
    }
  }

  function pushUserMessage(content: string) {
    const history = [...messages, { role: "user" as const, content }];
    setMessages(history);
    void sendNext(history);
  }

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || streaming || completing) return;
    setInput("");
    pushUserMessage(trimmed);
  }

  function handleSkip() {
    if (streaming || completing) return;
    pushUserMessage("[SKIP]");
  }

  // Kick off conversation on mount
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void sendNext([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const lastQuickReplies = lastAssistant && !streaming ? splitQuickReplies(lastAssistant.content).options : [];

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6 gap-4">
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {messages.map((m, i) => {
          const { text } = m.role === "assistant" ? splitQuickReplies(m.content) : { text: m.content };
          return (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "self-end max-w-[85%] rounded-lg bg-primary text-primary-foreground px-3 py-2"
                  : "self-start max-w-[85%] rounded-lg bg-muted px-3 py-2 whitespace-pre-wrap"
              }
            >
              {text || (streaming && i === messages.length - 1 ? "…" : "")}
            </div>
          );
        })}
        {lastQuickReplies.length > 0 && (
          <QuickReplies options={lastQuickReplies} onPick={pushUserMessage} />
        )}
        <div ref={bottomRef} />
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      <div className="flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Scrie răspunsul tău…"
          disabled={streaming || completing}
        />
        <Button onClick={handleSend} disabled={streaming || completing || !input.trim()}>
          Trimite
        </Button>
        <Button variant="ghost" onClick={handleSkip} disabled={streaming || completing}>
          Sări peste
        </Button>
      </div>
    </div>
  );
}
```

Notes on the design:
- Conversation starts automatically (`sendNext([])` on mount) — AI speaks first
- `[QUICK_REPLIES]` line is parsed out of assistant messages; only the prose is shown, the options become buttons under the bubble
- Skip sends `[SKIP]` — the system prompt instructs the AI to advance
- Detecting completion: when streamed text contains the fixed closing marker, automatically POST `/api/onboarding/complete` with the full transcript and redirect

- [ ] **Step 3: Smoke test the full flow**

Reset your test user (`UPDATE User SET onboardingCompleted = false WHERE id = '<your-id>'` via Prisma Studio). Visit `/onboarding`. Expected:
- AI greets and asks for the name
- Type "Andrei" → AI reacts and asks sex with `[Femeie] [Bărbat] [Prefer să nu spun]` buttons
- Click "Bărbat" → AI introduces itself as Adam (text only — Adam UI comes Phase 3)
- Continue through ~8 turns
- After AI says the closing line, the page auto-redirects to `/dashboard`
- In Prisma Studio, confirm `User.sex == "male"`, `User.onboardingCompleted == true`, profile populated, ≥1 `UserMemoryFact`

- [ ] **Step 4: Commit**

```bash
git add src/components/onboarding/
git commit -m "feat(onboarding): chat client with streaming + quick replies + skip"
```

---

## Task 7: Profile "rerun onboarding" action

**Files:**
- Create: `src/app/api/profile/reset-onboarding/route.ts`
- Modify: `src/app/(main)/profile/page.tsx`

- [ ] **Step 1: Reset endpoint**

Create `src/app/api/profile/reset-onboarding/route.ts`:

```ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingCompleted: false },
  });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Add the action to profile page**

In `src/app/(main)/profile/page.tsx`, add a small client component or use a form action. If profile is currently a server component, add a sibling client snippet:

```tsx
// Inside profile/page.tsx — add at the bottom of the visible profile UI
import { RerunOnboardingButton } from "@/components/onboarding/rerun-onboarding-button";
// ...
<section className="mt-8 pt-6 border-t">
  <h2 className="font-semibold mb-2">Re-rulează onboarding-ul</h2>
  <p className="text-sm text-muted-foreground mb-3">
    Vorbește din nou cu stilistul tău dacă vrei să-ți actualizezi preferințele.
  </p>
  <RerunOnboardingButton />
</section>
```

Create `src/components/onboarding/rerun-onboarding-button.tsx`:

```tsx
"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function RerunOnboardingButton() {
  const router = useRouter();
  const { update: refreshSession } = useSession();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await fetch("/api/profile/reset-onboarding", { method: "POST" });
        if (res.ok) {
          // Refresh the JWT so middleware sees onboardingCompleted=false on the
          // next request — otherwise the stale `true` claim would let the user
          // through to /dashboard instead of redirecting to /onboarding.
          await refreshSession();
          router.push("/onboarding");
        } else {
          setBusy(false);
        }
      }}
    >
      Vorbește din nou cu stilistul tău
    </Button>
  );
}
```

- [ ] **Step 3: Smoke test**

While logged in, visit `/profile`, click the new button. Expected: routed to `/onboarding`, AI starts again with `## Profil existent` context (it confirms colors/style instead of asking blank, per system prompt).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/profile/reset-onboarding/route.ts src/app/\(main\)/profile/page.tsx src/components/onboarding/rerun-onboarding-button.tsx
git commit -m "feat(onboarding): profile rerun action"
```

---

## Task 8: Middleware FORCE_ONBOARDING redirect

**Files:**
- Modify: `src/middleware.ts`
- Modify: `src/lib/feature-flags.ts` (sanity check — should already export `serverFeatureFlags.forceOnboarding`)

- [ ] **Step 1: Surface `onboardingCompleted` and `sex` in the JWT**

This MUST land before the middleware edit — middleware reads `token.onboardingCompleted` in Step 2, so the claim has to exist first.

Open `src/lib/auth.ts`. The current signature is `async jwt({ token, user })`. Extend it to `async jwt({ token, user, trigger })`, hydrate `onboardingCompleted` + `sex` from DB on first sign-in, and add a `trigger === "update"` branch so `useSession().update()` (called client-side after `/api/onboarding/complete` and `/api/profile/reset-onboarding`) re-reads the flag without forcing the user to sign out. In `callbacks.session`, surface the claims onto `session.user`.

```ts
// src/lib/auth.ts — replace the existing callbacks block

callbacks: {
  async jwt({ token, user, trigger }) {
    if (user) {
      token.id = user.id;
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { onboardingCompleted: true, sex: true },
      });
      token.onboardingCompleted = dbUser?.onboardingCompleted ?? false;
      token.sex = dbUser?.sex ?? null;
    }
    // Allow client-side useSession().update() to refresh the DB-backed claims.
    if (trigger === "update" && token.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { onboardingCompleted: true, sex: true },
      });
      if (dbUser) {
        token.onboardingCompleted = dbUser.onboardingCompleted;
        token.sex = dbUser.sex;
      }
    }
    return token;
  },
  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.id as string;
      session.user.onboardingCompleted = Boolean(token.onboardingCompleted);
      session.user.sex = (token.sex ?? null) as string | null;
    }
    return session;
  },
},
```

Update the existing module declarations in `src/types/next-auth.d.ts` and add JWT augmentation. Current file is:

```ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
```

Replace with:

```ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      onboardingCompleted: boolean;
      sex: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    onboardingCompleted?: boolean;
    sex?: string | null;
  }
}
```

Smoke: `npx tsc --noEmit --skipLibCheck` — no new errors in `src/lib/auth.ts`, `src/types/next-auth.d.ts`, or their consumers.

- [ ] **Step 2: Read the JWT claim in middleware and redirect when needed**

Update `src/middleware.ts`. Add an allow-list for the onboarding surface, and when the flag is on + user is authenticated + the JWT says `onboardingCompleted === false`, redirect to `/onboarding`. If the claim is missing (legacy session before Step 1 deploys), let the request through — the page-level redirect guard in `/onboarding/page.tsx` will re-read from DB and bounce correctly on the next request.

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { serverFeatureFlags } from "@/lib/feature-flags";

export async function middleware(req: NextRequest) {
  const secureCookie = req.nextUrl.protocol === "https:";
  const cookieName = secureCookie ? "__Secure-authjs.session-token" : "authjs.session-token";
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie, cookieName, salt: cookieName });
  const isLoggedIn = !!token;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isPublicApi =
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron/") ||
    pathname === "/api/register" ||
    pathname === "/api/debug-env";
  const isOnboardingSurface = pathname === "/onboarding" || pathname.startsWith("/api/onboarding/");
  const isPublicPage = pathname === "/";
  const isApi = pathname.startsWith("/api/");

  if (isPublicApi) return NextResponse.next();

  if (isAuthPage) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicPage) {
    if (isApi) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Forced onboarding: authenticated, flag on, not completed → push to /onboarding.
  // Reads the `onboardingCompleted` claim populated in Step 1. If the claim is
  // undefined (legacy session), we fall through and let the page-level guard
  // handle it — safer than redirecting the user into a loop on stale sessions.
  if (
    isLoggedIn &&
    serverFeatureFlags.forceOnboarding &&
    !isOnboardingSurface &&
    !isPublicPage &&
    token.onboardingCompleted === false
  ) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico|uploads|manifest.webmanifest|sw.js|icon-|apple-touch-icon|favicon-).*)"],
};
```

JWT staleness note: after `/api/onboarding/complete` flips `onboardingCompleted=true`, the user's existing JWT still says `false` until refreshed. Task 6 (`OnboardingChat.complete`) and Task 7 (`RerunOnboardingButton`) both call `await update()` from `useSession()` immediately after the POST returns — that hits the `trigger === "update"` branch added in Step 1 and re-reads the flag from DB, eliminating the flicker that would otherwise bounce the user back to `/onboarding` on the first dashboard navigation.

- [ ] **Step 3: Smoke test with flag OFF and ON**

With `FORCE_ONBOARDING` unset (default `false`): existing behavior, no redirect.

Set `FORCE_ONBOARDING=true` in `.env.local` and restart `npm run dev`. Log out, log back in. Expected: any visit to `/dashboard` (or any protected route except `/onboarding`) bounces to `/onboarding`. After completing onboarding, you land on `/dashboard` and can navigate freely.

- [ ] **Step 4: Commit**

```bash
git add src/middleware.ts src/lib/auth.ts src/types/next-auth.d.ts
git commit -m "feat(onboarding): middleware redirect when FORCE_ONBOARDING=true"
```

---

## Task 9: Deploy + flip flag + smoke

**Files:** none new.

- [ ] **Step 1: Push branch**

```bash
git push origin master
```

- [ ] **Step 2: Verify deploy URLs respond**

After Vercel build completes:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://garderoba.vercel.app/onboarding   # expect 307 → /login (no session)
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://garderoba.vercel.app/api/onboarding/chat  # expect 401
```

- [ ] **Step 3: Add `FORCE_ONBOARDING=true` to Vercel production env**

In Vercel dashboard → project → Settings → Environment Variables, add `FORCE_ONBOARDING` with value `true` for Production. Trigger a redeploy (or wait for next deploy).

- [ ] **Step 4: User-coordinated smoke test on production**

Owner runs:
- Open `https://garderoba.vercel.app`, log in with existing account
- Confirm redirect to `/onboarding` happens (forced)
- Run through the onboarding chat
- Verify lands on `/dashboard`, profile populated, no regressions
- Open Profile → click "Vorbește din nou" → confirm `/onboarding` reappears with confirmation-style prompts
- Spot-check that existing wardrobe items are still present

- [ ] **Step 5: If anything regresses, rollback flag**

In Vercel, set `FORCE_ONBOARDING=false` (or remove it). Code can stay deployed — the redirect is gated on the flag, so disabling it returns the app to its current behavior while we investigate.

---

## Out of Scope (deferred to later phases)

- Adam UI (theme tokens, fonts, categories, prompts) — Phase 3
- ChatSession / SessionSummary lifecycle, memory compaction cron — Phase 4
- Migrating legacy `Conversation` rows into `ChatSession`+`ChatMessage` — Phase 4 runs `scripts/migrate-conversations.ts`
- Theme toggle for Ava (light only)
- Voice or image input
- A11y audit pass on the new chat (basic semantic HTML only for Phase 2)
