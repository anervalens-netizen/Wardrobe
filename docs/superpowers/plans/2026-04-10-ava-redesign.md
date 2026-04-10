# Ava — Redesign UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand aplicația din "Garderoba" în "Ava — Your personal AI stylist" cu un design system complet nou: lavender + teal, DM Serif Display + Nunito, layout editorial.

**Architecture:** Pure UI redesign — fără schimbări de logică sau API. Fiecare task modifică stiluri și layout-uri existente. Fundația (Task 1) trebuie finalizată prima — toate celelalte task-uri depind de variabilele CSS definite acolo.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4, shadcn/ui, Google Fonts (DM Serif Display + Nunito)

**Design Spec:** `docs/superpowers/specs/2026-04-10-ava-design-system.md`

---

## Task 1: Fundație — Culori, Fonturi, Variabile CSS

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

### Scopul task-ului
Înlocuiește tema shadcn implicită (alb/negru) cu paleta Ava (lavender + teal). Importă fonturile DM Serif Display și Nunito. Elimină dark mode — aplicația este light-only.

- [ ] **Step 1: Modifică `src/app/layout.tsx` pentru a importa fonturile noi**

Înlocuiește tot conținutul fișierului cu:

```tsx
import type { Metadata } from "next";
import { DM_Serif_Display, Nunito } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Ava — Your personal AI stylist",
  description:
    "Organizează-ți garderoba și primește recomandări de ținute de la asistentul tău AI de stil personal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className={`${dmSerifDisplay.variable} ${nunito.variable} h-full`}>
      <body className="min-h-full bg-background text-foreground antialiased">
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Înlocuiește `src/app/globals.css` cu paleta Ava**

Înlocuiește tot conținutul fișierului cu:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-geist-mono);
  --font-heading: var(--font-heading);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

:root {
  /* Culori principale Ava */
  --background: oklch(0.985 0.008 300);
  --foreground: oklch(0.18 0.03 300);

  --card: oklch(1 0 0);
  --card-foreground: oklch(0.18 0.03 300);

  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.18 0.03 300);

  /* Primary — Violet lavender */
  --primary: oklch(0.59 0.21 293);
  --primary-foreground: oklch(0.99 0 0);

  /* Secondary — Teal/mint */
  --secondary: oklch(0.70 0.14 185);
  --secondary-foreground: oklch(0.99 0 0);

  --muted: oklch(0.96 0.015 300);
  --muted-foreground: oklch(0.50 0.05 300);

  --accent: oklch(0.94 0.025 300);
  --accent-foreground: oklch(0.40 0.10 293);

  --destructive: oklch(0.577 0.245 27.325);

  --border: oklch(0.91 0.02 300);
  --input: oklch(0.93 0.015 300);
  --ring: oklch(0.59 0.21 293);

  --radius: 0.875rem;

  /* Sidebar */
  --sidebar: oklch(0.975 0.012 300);
  --sidebar-foreground: oklch(0.18 0.03 300);
  --sidebar-primary: oklch(0.59 0.21 293);
  --sidebar-primary-foreground: oklch(0.99 0 0);
  --sidebar-accent: oklch(0.94 0.025 300);
  --sidebar-accent-foreground: oklch(0.40 0.10 293);
  --sidebar-border: oklch(0.91 0.02 300);
  --sidebar-ring: oklch(0.59 0.21 293);

  /* Charts */
  --chart-1: oklch(0.59 0.21 293);
  --chart-2: oklch(0.70 0.14 185);
  --chart-3: oklch(0.75 0.12 330);
  --chart-4: oklch(0.80 0.10 60);
  --chart-5: oklch(0.65 0.15 240);
}

/* Nu există dark mode — Ava e light-only */

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-sans), sans-serif;
  }
  h1, h2, h3 {
    font-family: var(--font-heading), serif;
  }
}

/* Utilitare custom Ava */
@layer utilities {
  .font-heading {
    font-family: var(--font-heading), serif;
  }
  .gradient-primary {
    background: linear-gradient(135deg, oklch(0.59 0.21 293), oklch(0.70 0.18 293));
  }
  .gradient-teal {
    background: linear-gradient(135deg, oklch(0.70 0.14 185), oklch(0.78 0.12 185));
  }
  .gradient-hero {
    background: linear-gradient(180deg, oklch(0.93 0.04 300) 0%, oklch(0.97 0.015 300) 100%);
  }
  .gradient-hero-banner {
    background: linear-gradient(135deg, oklch(0.59 0.21 293) 0%, oklch(0.70 0.18 293) 50%, oklch(0.70 0.14 185) 100%);
  }
  .shadow-ava-sm {
    box-shadow: 0 2px 8px oklch(0.59 0.21 293 / 0.08);
  }
  .shadow-ava {
    box-shadow: 0 4px 20px oklch(0.59 0.21 293 / 0.12);
  }
  .shadow-ava-lg {
    box-shadow: 0 8px 32px oklch(0.59 0.21 293 / 0.18);
  }
  .ring-ava {
    box-shadow: 0 0 0 4px oklch(0.59 0.21 293 / 0.2);
  }
}
```

- [ ] **Step 3: Pornește dev server și verifică vizual**

```bash
npm run dev
```

Deschide http://localhost:3000. Verifică:
- Fundalul paginii are nuanță ușor lavender (nu alb pur)
- Butoanele primary sunt violet/lavender
- Fontul body e Nunito (rotunjit, NU Geist)
- H1/H2 sunt DM Serif Display (serif elegant)

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: Ava design foundation — lavender palette + DM Serif/Nunito fonts"
```

---

## Task 2: Sidebar Desktop Redesign

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

### Scopul task-ului
Înlocuiește iconița Sparkles cu logo-ul Ava (PNG auriu), schimbă culorile link-urilor active, adaugă subtitlul brandului.

- [ ] **Step 1: Înlocuiește `src/components/layout/sidebar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Shirt,
  PlusCircle,
  MessageSquare,
  CalendarDays,
  User,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/dashboard", label: "Acasă", icon: LayoutDashboard },
  { href: "/wardrobe", label: "Garderobă", icon: Shirt },
  { href: "/add-item", label: "Adaugă piesă", icon: PlusCircle },
  { href: "/assistant", label: "Ava AI", icon: MessageSquare },
  { href: "/history", label: "Istoric", icon: CalendarDays },
  { href: "/profile", label: "Profil", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-sidebar">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5">
          <Image
            src="/logo.png"
            alt="Ava"
            width={32}
            height={32}
            className="object-contain"
          />
          <div>
            <span className="font-heading italic text-xl text-primary">Ava</span>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground leading-none mt-0.5">
              AI Stylist
            </p>
          </div>
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                {item.label}
                {item.href === "/assistant" && (
                  <span className="ml-auto text-[9px] bg-secondary/20 text-secondary font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                    AI
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4.5 w-4.5" />
            Deconectare
          </Button>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Copiază logo-ul în `public/`**

Logo-ul se află la `Img/logo.png`. Copiază-l în `public/logo.png` ca Next.js să-l servească:

```bash
cp Img/logo.png public/logo.png
```

- [ ] **Step 3: Verifică vizual**

Deschide http://localhost:3000/dashboard. Verifică sidebar-ul:
- Logo auriu vizibil stânga sus
- "Ava" în italic serif violet
- "AI STYLIST" subtitlu mic uppercase
- Link activ are fundal lavender pal, text violet
- Badge "AI" pe Ava AI

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/sidebar.tsx public/logo.png
git commit -m "feat: Ava sidebar — logo auriu, culori lavender, badge AI"
```

---

## Task 3: Header + Mobile Navigation Redesign

**Files:**
- Modify: `src/components/layout/header.tsx`
- Modify: `src/components/layout/mobile-nav.tsx`

### Scopul task-ului
Header: elimină dark mode toggle (light-only), adaugă logo mic pe mobil. Mobile nav: FAB central ridicat, 5 iteme, stil Ava.

- [ ] **Step 1: Înlocuiește `src/components/layout/header.tsx`**

```tsx
"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const { data: session } = useSession();

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "A";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Logo mobil */}
        <div className="md:hidden flex items-center gap-2">
          <Image src="/logo.png" alt="Ava" width={24} height={24} className="object-contain" />
          <span className="font-heading italic text-lg text-primary">Ava</span>
        </div>
        <div className="hidden md:block" />

        {/* Avatar user */}
        <Avatar className="h-8 w-8 ring-2 ring-primary/20">
          <AvatarImage src={session?.user?.image || ""} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Înlocuiește `src/components/layout/mobile-nav.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Shirt,
  PlusCircle,
  MessageSquare,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Acasă", icon: LayoutDashboard },
  { href: "/wardrobe", label: "Garderobă", icon: Shirt },
  { href: "/add-item", label: null, icon: PlusCircle, isFab: true },
  { href: "/assistant", label: "Ava AI", icon: MessageSquare },
  { href: "/profile", label: "Profil", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-ava">
      <div className="flex items-end justify-around px-2 pb-safe-bottom">
        {navItems.map((item) => {
          if (item.isFab) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-5 mb-1"
              >
                <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-ava-lg ring-4 ring-background">
                  <PlusCircle className="h-6 w-6 text-white" />
                </div>
              </Link>
            );
          }

          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-3 px-3 text-[10px] font-semibold transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Verifică vizual pe mobil**

În browser, deschide DevTools → Toggle device toolbar (Ctrl+Shift+M) → selectează iPhone 14. Verifică:
- FAB (buton +) violet cu gradient, ridicat față de bara de navigare
- Logo "Ava" italic violet în header pe mobil
- Link activ violet, restul gri

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/header.tsx src/components/layout/mobile-nav.tsx
git commit -m "feat: Ava header + bottom nav cu FAB central"
```

---

## Task 4: Dashboard — Layout Editorial

**Files:**
- Modify: `src/app/(main)/dashboard/page.tsx`

### Scopul task-ului
Transformă dashboard-ul din grid generic în layout editorial "Ediția ta de azi" — stil revistă de modă personalizată.

- [ ] **Step 1: Înlocuiește `src/app/(main)/dashboard/page.tsx`**

```tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Shirt, PlusCircle, MessageSquare, Clock, Star, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalItems: number;
  favoriteItems: number;
  totalOutfits: number;
  recentItems: {
    id: string;
    name: string;
    category: string;
    colorPrimary: string;
    imagePath: string | null;
  }[];
  unwornItems: { id: string; name: string; category: string }[];
}

const TODAY = new Date().toLocaleDateString("ro-RO", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const QUICK_ACTIONS = [
  {
    href: "/add-item",
    label: "Adaugă piesă",
    icon: PlusCircle,
    gradient: "from-violet-500 to-purple-400",
  },
  {
    href: "/assistant",
    label: "Cere sfat Ava",
    icon: Sparkles,
    gradient: "from-teal-500 to-cyan-400",
  },
  {
    href: "/wardrobe",
    label: "Garderobă",
    icon: Shirt,
    gradient: "from-fuchsia-400 to-pink-300",
  },
  {
    href: "/history",
    label: "Istoric",
    icon: Clock,
    gradient: "from-rose-300 to-pink-200",
    textDark: true,
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const firstName = session?.user?.name?.split(" ")[0] || "tu";

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header editorial */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
            {TODAY}
          </p>
          <h1 className="font-heading italic text-3xl text-foreground leading-tight">
            Ediția ta de azi
          </h1>
        </div>
      </div>

      {/* Hero card editorial */}
      <div className="gradient-hero rounded-2xl p-6 text-center border border-border/50 shadow-ava-sm">
        <p className="text-[10px] uppercase tracking-[3px] text-primary font-bold mb-3">
          ✦ Stilul tău personal
        </p>
        <h2 className="font-heading italic text-2xl text-foreground mb-2">
          Ce porți azi, {firstName}?
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          Ava îți poate recomanda ținuta perfectă bazată pe garderoba ta
        </p>
        <Link href="/assistant">
          <Button className="rounded-full gradient-primary text-white border-0 shadow-ava px-6 hover:opacity-90 transition-opacity">
            <Sparkles className="h-4 w-4 mr-2" />
            Cere sfat Ava
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {loading ? (
          <>
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </>
        ) : (
          <>
            <div className="bg-card rounded-2xl p-4 text-center shadow-ava-sm border border-border/50">
              <Shirt className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="font-heading text-2xl text-primary">{stats?.totalItems ?? 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Piese</p>
            </div>
            <div className="bg-card rounded-2xl p-4 text-center shadow-ava-sm border border-border/50">
              <Star className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="font-heading text-2xl text-primary">{stats?.favoriteItems ?? 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Favorite</p>
            </div>
            <div className="bg-card rounded-2xl p-4 text-center shadow-ava-sm border border-border/50">
              <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="font-heading text-2xl text-primary">{stats?.totalOutfits ?? 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Ținute</p>
            </div>
          </>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
          Acțiuni rapide
        </p>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href}>
              <div
                className={`bg-gradient-to-br ${action.gradient} rounded-2xl p-4 flex items-center gap-3 shadow-ava-sm hover:shadow-ava transition-all duration-200 hover:-translate-y-0.5`}
              >
                <action.icon
                  className={`h-5 w-5 shrink-0 ${action.textDark ? "text-rose-600" : "text-white"}`}
                />
                <span
                  className={`text-sm font-bold ${action.textDark ? "text-rose-700" : "text-white"}`}
                >
                  {action.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent items */}
      {!loading && stats && stats.recentItems.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
            Adăugate recent
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.recentItems.map((item) => (
              <Link key={item.id} href={`/wardrobe/${item.id}`}>
                <div className="rounded-2xl border border-border/50 overflow-hidden hover:shadow-ava hover:-translate-y-0.5 transition-all duration-200 bg-card">
                  {item.imagePath ? (
                    <img
                      src={item.imagePath}
                      alt={item.name}
                      className="w-full h-28 object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-28 flex items-center justify-center"
                      style={{ backgroundColor: item.colorPrimary }}
                    >
                      <Shirt className="h-8 w-8 text-white/60" />
                    </div>
                  )}
                  <div className="p-2.5">
                    <p className="text-xs font-bold truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.category}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && stats && stats.totalItems === 0 && (
        <div className="gradient-hero rounded-2xl p-10 flex flex-col items-center text-center border border-border/50">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shirt className="h-8 w-8 text-primary/50" />
          </div>
          <h3 className="font-heading italic text-xl mb-2">Garderoba ta e goală</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-xs">
            Adaugă primele piese și Ava va începe să-ți creeze ținute personalizate
          </p>
          <Link href="/add-item">
            <Button className="rounded-full gradient-primary text-white border-0 shadow-ava">
              <PlusCircle className="h-4 w-4 mr-2" />
              Adaugă prima piesă
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verifică vizual**

Deschide http://localhost:3000/dashboard. Verifică:
- Data curentă afișată în uppercase mic deasupra titlului
- Titlu italic serif "Ediția ta de azi"
- Hero card cu gradient lavender pal + buton violet
- Stats cu numere serif violet
- Quick actions tiles colorate cu gradient diferit fiecare
- Recent items cu carduri rotunjite

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/dashboard/page.tsx
git commit -m "feat: Ava dashboard — layout editorial cu hero card si tiles colorate"
```

---

## Task 5: Auth Pages — Login & Register Full-Screen

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/register/page.tsx`
- Modify: `src/app/(auth)/layout.tsx`

### Scopul task-ului
Transformă paginile de auth din card generic pe fundal alb în full-screen cu gradient lavender + card glassmorphism.

- [ ] **Step 1: Citește `src/app/(auth)/register/page.tsx`**

(Necesar înainte de a-l edita)

- [ ] **Step 2: Înlocuiește `src/app/(auth)/layout.tsx`**

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, oklch(0.93 0.04 300) 0%, oklch(0.88 0.06 300) 40%, oklch(0.88 0.06 185) 100%)"
      }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "oklch(0.70 0.14 185)" }}
      />
      <div
        className="absolute bottom-[-10%] left-[-5%] w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "oklch(0.59 0.21 293)" }}
      />
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Înlocuiește `src/app/(auth)/login/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError("Email sau parolă incorecte");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="bg-white/75 backdrop-blur-md rounded-3xl shadow-ava-lg border border-white/60 p-8">
      {/* Brand */}
      <div className="flex flex-col items-center mb-8">
        <Image src="/logo.png" alt="Ava" width={56} height={56} className="object-contain mb-3" />
        <h1 className="font-heading italic text-4xl text-primary">Ava</h1>
        <p className="text-[11px] uppercase tracking-[3px] text-muted-foreground font-semibold mt-1">
          Your personal AI stylist
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="email@exemplu.ro"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl border-border/60 bg-white/80 focus:border-primary focus:ring-primary/20"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Parolă
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-xl border-border/60 bg-white/80 focus:border-primary focus:ring-primary/20"
          />
        </div>

        <Button
          type="submit"
          className="w-full rounded-full gradient-primary text-white border-0 shadow-ava h-11 font-bold text-sm mt-2"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Intră în cont
        </Button>
      </form>

      <p className="text-sm text-center text-muted-foreground mt-6">
        Nu ai cont?{" "}
        <Link href="/register" className="text-primary hover:underline font-bold">
          Creează unul
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Înlocuiește `src/app/(auth)/register/page.tsx`**

Citește mai întâi conținutul actual al fișierului, apoi înlocuiește cu versiunea stilizată păstrând TOATĂ logica existentă (câmpuri form, validare, handleSubmit). Modifică doar:
- Wrapper-ul exterior: `<div className="bg-white/75 backdrop-blur-md rounded-3xl shadow-ava-lg border border-white/60 p-8">`
- Header brand (același ca login: logo PNG + "Ava" italic + tagline)
- Labels: `className="text-xs font-bold uppercase tracking-wider text-muted-foreground"`
- Inputs: `className="rounded-xl border-border/60 bg-white/80"`
- Submit button: `className="w-full rounded-full gradient-primary text-white border-0 shadow-ava h-11 font-bold text-sm"`
- Link spre login: `className="text-primary hover:underline font-bold"`

- [ ] **Step 5: Verifică vizual**

Deschide http://localhost:3000/login. Verifică:
- Fundal gradient lavender → teal diagonal
- Blob decorativ teal sus-dreapta, violet jos-stânga
- Card glassmorphism (alb semi-transparent cu blur)
- Logo auriu mare centrat
- "Ava" italic violet 4xl
- "YOUR PERSONAL AI STYLIST" uppercase spacing
- Form curat cu labels uppercase mici

- [ ] **Step 6: Commit**

```bash
git add src/app/(auth)/
git commit -m "feat: Ava auth pages — full-screen gradient cu glassmorphism card"
```

---

## Task 6: ClothingCard Redesign + Badge Categorii Colorate

**Files:**
- Modify: `src/components/wardrobe/clothing-card.tsx`
- Read: `src/lib/constants.ts` (pentru valorile CATEGORIES)

### Scopul task-ului
Cards mai rotunjite cu umbră ava, badge categorii colorate per tip, hover lift mai pronunțat, favorite button mereu vizibil pe mobile.

- [ ] **Step 1: Citește `src/lib/constants.ts` pentru a vedea categoriile disponibile**

- [ ] **Step 2: Înlocuiește `src/components/wardrobe/clothing-card.tsx`**

```tsx
"use client";

import Link from "next/link";
import { Heart, Shirt } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";

interface ClothingCardProps {
  item: {
    id: string;
    name: string;
    category: string;
    colorPrimary: string;
    pattern?: string | null;
    formality?: string | null;
    imagePath?: string | null;
    favorite: boolean;
  };
  onToggleFavorite?: (id: string, favorite: boolean) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  dresses: "bg-violet-100 text-violet-700",
  tops: "bg-teal-100 text-teal-700",
  bottoms: "bg-purple-100 text-purple-700",
  outerwear: "bg-pink-100 text-pink-700",
  shoes: "bg-emerald-100 text-emerald-700",
  accessories: "bg-amber-100 text-amber-700",
  bags: "bg-rose-100 text-rose-700",
  underwear: "bg-fuchsia-100 text-fuchsia-700",
};

export function ClothingCard({ item, onToggleFavorite }: ClothingCardProps) {
  const categoryLabel =
    CATEGORIES.find((c) => c.value === item.category)?.label || item.category;
  const categoryColor = CATEGORY_COLORS[item.category] || "bg-primary/10 text-primary";

  return (
    <Link href={`/wardrobe/${item.id}`}>
      <div className="group rounded-2xl border border-border/50 bg-card overflow-hidden shadow-ava-sm hover:shadow-ava hover:-translate-y-1 transition-all duration-200">
        {/* Image */}
        <div className="relative aspect-square">
          {item.imagePath ? (
            <img
              src={item.imagePath}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: item.colorPrimary }}
            >
              <Shirt className="h-10 w-10 text-white/50" />
            </div>
          )}

          {/* Favorite button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite?.(item.id, !item.favorite);
            }}
            className={cn(
              "absolute top-2 right-2 p-1.5 rounded-full bg-white/85 backdrop-blur-sm shadow-sm transition-all duration-200",
              item.favorite
                ? "text-rose-500 opacity-100"
                : "text-muted-foreground opacity-0 group-hover:opacity-100"
            )}
          >
            <Heart
              className={cn("h-3.5 w-3.5", item.favorite && "fill-current")}
            />
          </button>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="font-semibold truncate text-sm mb-1.5">{item.name}</p>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
                categoryColor
              )}
            >
              {categoryLabel}
            </span>
            <div
              className="w-3 h-3 rounded-full border border-white shadow-sm shrink-0"
              style={{ backgroundColor: item.colorPrimary }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Verifică vizual**

Deschide http://localhost:3000/wardrobe. Verifică:
- Cards cu colțuri mai rotunjite (rounded-2xl)
- Umbră violet subtilă pe cards
- Hover: card se ridică ușor + umbră mai mare
- Badge categorie colorat specific (rochii = violet, topuri = teal, etc.)
- Buton favorite vizibil la hover

- [ ] **Step 4: Aplică filtre chips pe pagina garderobă**

Citește `src/components/wardrobe/clothing-filters.tsx` și modifică orice `<Select>` sau `<DropdownMenu>` folosit pentru filtrare cu chips pill scrollabile orizontal:

```tsx
{/* Înlocuiește dropdown-urile cu chips scrollabile */}
<div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
  {CATEGORIES.map((cat) => (
    <button
      key={cat.value}
      onClick={() => setFilter(cat.value)}
      className={cn(
        "shrink-0 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all",
        activeFilter === cat.value
          ? "gradient-primary text-white shadow-ava-sm"
          : "bg-muted text-muted-foreground hover:bg-accent"
      )}
    >
      {cat.label}
    </button>
  ))}
</div>
```

> Notă: Adaptează la props/state existente în clothing-filters.tsx. Păstrează logica de filtrare, schimbă doar UI-ul.

- [ ] **Step 5: Commit**

```bash
git add src/components/wardrobe/clothing-card.tsx src/components/wardrobe/clothing-filters.tsx
git commit -m "feat: ClothingCard redesign — badge-uri colorate per categorie, hover lift, chips filtre"
```

---

## Task 7: Assistant Page — Chat UI Ava

**Files:**
- Modify: `src/app/(main)/assistant/page.tsx`

### Scopul task-ului
Citește pagina curentă și aplică stilul Ava pe chat: header editorial, bule de chat colorate, avatar Ava cu gradient teal.

- [ ] **Step 1: Citește `src/app/(main)/assistant/page.tsx`**

(Fișierul trebuie citit înainte de editare)

- [ ] **Step 2: Aplică stilul Ava pe chat**

Modificările de aplicat pe componenta existentă (păstrează TOATĂ logica):

**Header chat** — înlocuiește orice header existent cu:
```tsx
<div className="border-b border-border/50 bg-card px-4 py-3 flex items-center gap-3">
  <div className="w-9 h-9 rounded-full gradient-teal flex items-center justify-center shadow-ava-sm">
    <Sparkles className="h-4 w-4 text-white" />
  </div>
  <div>
    <h2 className="font-heading italic text-lg text-foreground leading-tight">Ava</h2>
    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
      AI Stylist · Online
    </p>
  </div>
</div>
```

**Bule mesaj user** — className pentru mesajele utilizatorului:
```
"ml-auto max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm gradient-primary text-white shadow-ava-sm"
```

**Bule mesaj Ava** — className pentru mesajele asistentului:
```
"mr-auto max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm bg-muted text-foreground shadow-ava-sm"
```

**Input area** — wrapper + input + buton:
```tsx
<div className="border-t border-border/50 bg-card p-3 flex gap-2">
  <Input
    className="rounded-full border-border/60 bg-background flex-1"
    placeholder="Întreab-o pe Ava..."
  />
  <Button className="rounded-full gradient-teal text-white border-0 shadow-ava-sm px-4" type="submit">
    Trimite
  </Button>
</div>
```

- [ ] **Step 3: Verifică vizual**

Deschide http://localhost:3000/assistant. Verifică:
- Header cu avatar teal și "Ava" italic
- Bule user: gradient violet, dreapta, colț dreapta-jos drept
- Bule Ava: lavender pal, stânga, colț stânga-jos drept
- Input rotunjit cu buton teal "Trimite"

- [ ] **Step 4: Commit**

```bash
git add src/app/(main)/assistant/page.tsx
git commit -m "feat: Ava assistant — chat UI cu bule colorate si header editorial"
```

---

## Verificare Finală

- [ ] Parcurge toate paginile aplicației: login → dashboard → garderobă → asistent → profil
- [ ] Verifică pe mobil (DevTools): bottom nav cu FAB, header cu logo
- [ ] Verifică că nu există referințe la "Garderoba" în UI (title, sidebar, header)
- [ ] Verifică că dark mode toggle a dispărut din header
