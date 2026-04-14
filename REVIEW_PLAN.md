# Plan: Comprehensive Codebase Review & Quality Audit

This plan is structured to allow the coding agent to exhaustively analyze every aspect of the application, stage by stage. The goal is to identify performance bottlenecks, security vulnerabilities, design inconsistencies, and technical debt.

To ensure context limits are not exceeded and the review remains highly efficient, the agent **MUST utilize subagents** (e.g., using the `Explore` or `coder` subagent) for each phase. Each subagent will handle a specific domain, read the necessary files, and report back actionable insights or direct fixes. 

**Do not wait for user approval between phases.** Execute the review continuously phase by phase, orchestrating the subagents to handle the load and process fixes systematically.

## Orchestration Strategy

1. The main agent reads this plan and initializes the review process.
2. For each phase, the main agent spawns a specialized subagent providing it the exact list of files to read and the specific objective of that phase.
3. The subagent returns its findings and proposed fixes.
4. The main agent applies the fixes, verifies the changes, and immediately proceeds to spawn the next subagent for the next phase.

---

## Phases

### Phase 1: Foundation, Configuration & Database
- **Objective:** Audit global settings, project dependencies, routing setup, and database schema for correctness and optimal performance.
- **Key Constraints:** Next.js 16.2.3, Prisma 7 with libsql adapter.
- **Files to analyze:**
  - `next.config.ts`, `middleware.ts`, `next-env.d.ts`
  - `package.json`, `components.json`, `tsconfig.json`
  - `eslint.config.mjs`, `postcss.config.mjs`, `src/app/globals.css`
  - `prisma/schema.prisma`, `src/lib/prisma.ts`, `prisma.config.ts`

### Phase 2: Core Utilities, Security & Authentication
- **Objective:** Verify shared infrastructure, utility functions, PWA setup, and the NextAuth implementation (ensuring correct JWT handling and middleware integration).
- **Key Constraints:** NextAuth v5 (Auth.js) JWT strategy.
- **Files to analyze:**
  - `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/*`
  - `src/lib/constants.ts`, `src/lib/feature-flags.ts`
  - `src/lib/utils.ts`, `src/components/providers.tsx`
  - `public/sw.js`, `src/components/sw-register.tsx`, `src/app/manifest.ts`

### Phase 3: AI Integration & LLM Context
- **Objective:** Review the Google GenAI implementation, prompt structures, and the memory/context building logic for efficiency and safety.
- **Key Constraints:** SSE streaming format, context token limits.
- **Files to analyze:**
  - `src/lib/ai/client.ts`, `src/lib/ai/context-builder.ts`
  - `src/lib/ai/fashion-system-prompt*.ts`
  - `src/lib/ai/onboarding-extract.ts`, `src/lib/ai/onboarding-system-prompt.ts`
  - `src/lib/onboarding/seed-memory.ts`, `src/lib/onboarding/types.ts`

### Phase 4: API Routes (Backend)
- **Objective:** Analyze all backend endpoints for correct data parsing, robust error handling, efficient Prisma queries, and appropriate caching headers.
- **Key Constraints:** App Router API conventions, proper error responses.
- **Files to analyze:**
  - `src/app/api/assistant/chat/`, `src/app/api/assistant/session/`
  - `src/app/api/clothes/`, `src/app/api/outfits/`
  - `src/app/api/dashboard/`, `src/app/api/profile/`, `src/app/api/register/`
  - `src/app/api/sessions/`, `src/app/api/upload/`
  - `src/app/api/cron/auto-close-sessions/`, `src/app/api/cron/compact-memory/`

### Phase 5: Reusable UI Components (shadcn/ui)
- **Objective:** Audit the component library for accessibility (a11y), Tailwind CSS v4 consistency, and responsive/touch-friendly design.
- **Key Constraints:** Radix UI primitives, proper ref forwarding.
- **Files to analyze:**
  - All files in `src/components/ui/*.tsx`

### Phase 6: Domain-Specific Components
- **Objective:** Analyze complex components handling business logic, state, and complex UI (like Wardrobe filters, Onboarding chat, and Layout components mapping persona).
- **Key Constraints:** Client/Server component boundaries.
- **Files to analyze:**
  - `src/components/layout/header.tsx`, `mobile-nav.tsx`, `sidebar.tsx`
  - `src/components/onboarding/onboarding-chat.tsx`, `quick-replies.tsx`, `rerun-onboarding-button.tsx`
  - `src/components/wardrobe/clothing-card.tsx`, `clothing-filters.tsx`

### Phase 7: Application Pages (App Router)
- **Objective:** Evaluate Server/Client component architecture, state management, data fetching patterns, and overall UX per page.
- **Key Constraints:** Next.js App Router best practices, suspense boundaries, loading states.
- **Files to analyze:**
  - `src/app/layout.tsx`, `src/app/page.tsx`
  - `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`
  - `src/app/(main)/*` (all pages like dashboard, assistant, wardrobe, history, profile)
  - `src/app/onboarding/layout.tsx`, `src/app/onboarding/page.tsx`

---

## Execution Instructions for the Agent
1. Read the global guidelines in `AGENTS.md` before starting to understand project constraints.
2. Do not attempt to process all files in a single pass. **Use subagents** for each phase.
3. For each phase, instruct the subagent to read the specified files, identify issues, and return actionable code changes.
4. Apply the changes continuously. Do not stop to ask for user approval unless a critical architectural ambiguity arises.
5. Provide a summary log of what was fixed after each phase completes, and immediately proceed to the next phase.

---

## Execution Log — 14 April 2026

### Phase 1: Foundation, Configuration & Database ✅

| Fișier | Problemă găsită | Fix aplicat |
|--------|-----------------|-------------|
| `next.config.ts` | Lipsea config pentru image optimization | Adăugat `remotePatterns` pentru Vercel Blob storage |
| `public/sw.js` | Cache name "ava-v1" era hardcodat | Schimbat în "garderoba-v1" (persona-agnostic) |
| `prisma/schema.prisma` | Lipseau indexuri pe `userId` pentru `ClothingItem` și `Outfit` | Adăugat `@@index([userId])` la ambele modele |

### Phase 2: Core Utilities, Security & Authentication ✅

| Fișier | Problemă găsită | Fix aplicat |
|--------|-----------------|-------------|
| `src/lib/ai/context-builder.ts` | `JSON.parse` pe câmpuri profil fără try-catch — risc de crash pe date malformate | Adăugat try-catch pentru `favoriteColors`, `avoidColors`, `stylePreferences` |

### Phase 5: Reusable UI Components ✅

| Fișier | Problemă găsită | Fix aplicat |
|--------|-----------------|-------------|
| `src/components/wardrobe/clothing-card.tsx` | Folosea `CATEGORIES` hardcodat pentru label categorie — nu era gender-aware | Adăugat prop opțional `categories: readonly { value: string; label: string }[]` |

### Phase 6: Domain-Specific Components ✅

| Fișier | Problemă găsită | Fix aplicat |
|--------|-----------------|-------------|
| `src/components/wardrobe/clothing-filters.tsx` | Folosea `CATEGORIES` hardcodat în loc de categoriile Adam | Adăugat prop `sex?: string \| null`; folosește `getCategories(sex)` în loc de `CATEGORIES` constant |

### Phase 7: Application Pages ✅

| Fișier | Problemă găsită | Fix aplicat |
|--------|-----------------|-------------|
| `src/app/(main)/wardrobe/page.tsx` | Nu folosea session pentru sex; nu trecea categories la componente copil | Adăugat `useSession()`, extrage `userSex`, trimite `sex` și `categories` la `ClothingFilters` și `ClothingCard` |
| `src/app/(main)/add-item/page.tsx` | Lista de categorii hardcodată (CATEGORIES) — nu era gender-aware pentru Adam | Adăugat `useSession()`, folosește `getCategories(userSex)` în Select-ul de categorii |
| `src/app/(main)/dashboard/page.tsx` | `setState` apelat sincron în `useEffect` (lint error) + import `MessageSquare` never used | Inițializat `today` direct în `useState()`; eliminat importul nefolosit |

### Phase 8: API Routes Cleanup (lint warnings) ✅

| Fișier | Problemă găsită | Fix aplicat |
|--------|-----------------|-------------|
| `src/app/api/profile/route.ts` | Variabile underscore (`_id`, `_userId`, etc.) generau warnings | Adăugat `eslint-disable-next-line @typescript-eslint/no-unused-vars` |

---

## Rezultate verificare

| Comandă | Rezultat |
|---------|---------|
| `npm run lint` | ✅ 0 errors, 3 warnings (doar `<img>` vs `next/image` — non-blocking) |
| `npx tsc --noEmit` | ✅ TypeScript compilează fără erori |

## Known Issues (non-blocking)

3 warnings rămase — toate despre folosirea `<img>` în loc de `next/image`:
- `src/app/(main)/add-item/page.tsx:143`
- `src/app/(main)/history/page.tsx:191`
- `src/app/(main)/wardrobe/[id]/page.tsx:203`

Acestea sunt warnings de performanță LCP, nu erori. Nu afectează funcționalitatea.
