# Garderoba — Personal AI Stylist

Aplicație PWA de gestionare a garderobei cu asistent AI de modă. Organizează hainele, creează ținute și primești recomandări personalizate de la Ava (feminin) sau Adam (masculin).

---

## Stack

| Layer | Tehnologie |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Baza de date | SQLite local via Prisma 7 + `@prisma/adapter-libsql` |
| Auth | NextAuth v5 / Auth.js (JWT strategy) |
| AI | Google GenAI SDK — model `gemini-flash-lite-latest` |
| Storage | Local filesystem (`public/uploads/`) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Runtime | PM2 (Windows 11) |
| PWA | Web App Manifest + Service Worker |

---

## Rulare locală

```bash
npm install
npm run build
pm2 start node_modules/next/dist/bin/next --name garderoba -- start -p 4821
```

App disponibilă la `http://localhost:4821`.

### Env vars necesare (`.env.local`)

```env
TURSO_DATABASE_URL=file:./prisma/garderoba.db
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:4821
GOOGLE_AI_API_KEY=...
BLOB_READ_WRITE_TOKEN=...
CRON_SECRET=...
NEXT_PUBLIC_PERSONA_ADAM_ENABLED=true
```

---

## Features

- **Garderobă** — catalogarea hainelor cu poze, categorii, culori, mărimi
- **Ținute** — combinații de haine salvate
- **Asistent AI** — chat streaming cu memorie (Ava pentru feminin, Adam pentru masculin)
- **Dashboard** — statistici garderobă
- **Profil** — preferințe stil personal, temă light/dark (Adam)
- **Istoric chat** — conversații + rezumate anterioare
- **Onboarding** — flow conversațional la prima autentificare
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
│   │   ├── assistant/        # Chat AI
│   │   ├── history/          # Istoric conversații + ținute
│   │   └── profile/
│   ├── api/
│   │   ├── auth/             # NextAuth handlers
│   │   ├── register/
│   │   ├── clothes/          # CRUD haine
│   │   ├── outfits/          # CRUD ținute
│   │   ├── upload/           # Upload imagini
│   │   ├── assistant/chat/   # Streaming SSE cu Gemini
│   │   ├── sessions/         # Sesiuni chat + close
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── onboarding/
│   │   └── cron/             # auto-close-sessions, compact-memory
│   ├── onboarding/           # Flow onboarding conversațional
│   ├── login/
│   └── register/
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── layout/               # Sidebar, Header, MobileNav
│   └── onboarding/
├── lib/
│   ├── auth.ts               # NextAuth config (trustHost: true pentru local)
│   ├── prisma.ts             # Prisma client cu adapter libsql
│   ├── constants.ts
│   └── ai/                   # Gemini client, prompts, context builder
├── middleware.ts
└── types/
prisma/
├── schema.prisma             # Schema DB
└── garderoba.db              # SQLite local (exclus din git)
```

---

## Cron jobs

Configurate în Windows Task Scheduler, zilnic:

```bash
# 02:00 — închide sesiuni inactive
curl -H "Authorization: Bearer CRON_SECRET" http://localhost:4821/api/cron/auto-close-sessions

# 03:00 — compactare memorie AI
curl -H "Authorization: Bearer CRON_SECRET" http://localhost:4821/api/cron/compact-memory
```

---

## Note importante

- **NextAuth v5** — `trustHost: true` necesar pentru localhost; cookie `authjs.session-token`
- **Prisma 7** — necesită `@prisma/adapter-libsql`, nu suportă `url` direct în schema
- **Schema changes** — modificările de schema se aplică manual cu script SQL pe `prisma/garderoba.db`
- **PM2** — `pm2 restart garderoba --update-env` după modificări `.env.local`
