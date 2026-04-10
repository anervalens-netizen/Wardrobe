# Ava — Personal AI Stylist

Aplicație de gestionare a garderobei cu asistent AI de modă. Organizează hainele, creează ținute și primești recomandări personalizate de la Ava, stilistul tău AI.

**Live:** https://garderoba.vercel.app

---

## Stack

| Layer | Tehnologie |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Baza de date | Turso (cloud SQLite) via Prisma 7 + `@prisma/adapter-libsql` |
| Auth | NextAuth v5 / Auth.js (JWT strategy) |
| AI | Google GenAI SDK — model `gemini-flash-lite-latest` |
| Storage | Vercel Blob — upload imagini haine |
| UI | shadcn/ui + Tailwind CSS |
| Fonturi | DM Serif Display (headings) + Nunito (body) |
| PWA | Web App Manifest + Service Worker |

---

## Features

- **Garderobă** — catalogarea hainelor cu poze, categorii, culori, mărimi
- **Ținute** — combinații de haine salvate
- **Asistent AI (Ava)** — chat streaming cu memorie pe sesiunea zilei (reset la 02:00)
- **Dashboard** — statistici garderobă
- **Profil** — preferințe stil personal
- **Istoric chat** — conversații anterioare cu Ava
- **PWA** — instalabil pe Android, iOS și desktop

---

## Structura proiectului

```
src/
├── app/
│   ├── (main)/               # Rute protejate (layout cu sidebar + nav)
│   │   ├── dashboard/
│   │   ├── wardrobe/         # Lista + detalii haine
│   │   ├── add-item/         # Adaugă haină nouă
│   │   ├── assistant/        # Chat AI (Ava)
│   │   ├── history/          # Istoric conversații
│   │   └── profile/
│   ├── api/
│   │   ├── auth/             # NextAuth handlers
│   │   ├── register/
│   │   ├── clothes/          # CRUD haine
│   │   ├── outfits/          # CRUD ținute
│   │   ├── upload/           # Upload imagini → Vercel Blob
│   │   ├── assistant/
│   │   │   ├── chat/         # Streaming SSE cu Gemini
│   │   │   └── session/      # Sesiunea de azi
│   │   ├── dashboard/
│   │   └── profile/
│   ├── login/
│   ├── register/
│   └── layout.tsx            # Root layout + PWA metadata
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── providers.tsx          # SessionProvider + ThemeProvider
│   └── sw-register.tsx       # Service Worker registration
├── lib/
│   ├── auth.ts               # NextAuth config
│   ├── prisma.ts             # Prisma client cu adapter Turso
│   ├── constants.ts
│   └── ai/
│       ├── client.ts         # Google GenAI client
│       ├── fashion-system-prompt.ts
│       └── context-builder.ts
├── middleware.ts             # Auth middleware (exclude PWA files)
└── types/
prisma/
└── schema.prisma             # 9 modele: User, ClothingItem, Outfit, Conversation...
scripts/
└── push-schema.mjs           # Schema push pentru Turso (Prisma 7 workaround)
public/
├── sw.js                     # Service Worker
├── manifest.webmanifest      # (generat de src/app/manifest.ts)
├── icon-192.png
├── icon-512.png
├── apple-touch-icon.png
└── favicon-32.png
```

---

## Development local

```bash
npm install
```

Creează `.env.local`:
```env
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
TURSO_DATABASE_URL=libsql://wardrobe-andvast.aws-eu-west-1.turso.io
TURSO_AUTH_TOKEN=...
GOOGLE_AI_API_KEY=...
BLOB_READ_WRITE_TOKEN=...
```

```bash
npm run dev
```

---

## Schema database

Modificările de schema se fac prin:
```bash
node scripts/push-schema.mjs
```

> **Atenție:** `prisma db push` nu suportă `libsql://` — folosește scriptul de mai sus.

---

## Deploy (Vercel)

Build-ul rulează automat `prisma generate` înainte de `next build` (clientul generat nu e în git):

```json
"build": "prisma generate && next build"
```

Variabile de environment setate pe Vercel:
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- `GOOGLE_AI_API_KEY`
- `BLOB_READ_WRITE_TOKEN` (setat automat de Vercel Blob store)

---

## Note importante

- **Vercel filesystem e read-only** — toate upload-urile de fișiere merg prin Vercel Blob
- **NextAuth v5** — cookie-ul se numește `authjs.session-token` (nu `next-auth`)
- **Prisma 7** — necesită `@prisma/adapter-libsql`, nu suportă `url` direct în schema
- **Middleware** — exclude fișierele PWA (`/manifest.webmanifest`, `/sw.js`, iconele) de la auth check
