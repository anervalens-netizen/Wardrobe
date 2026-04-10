"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
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

const QUICK_ACTIONS: {
  href: string;
  label: string;
  icon: React.ElementType;
  style: React.CSSProperties;
  textDark?: boolean;
}[] = [
  {
    href: "/add-item",
    label: "Adaugă piesă",
    icon: PlusCircle,
    style: { background: "linear-gradient(135deg, oklch(0.59 0.21 293), oklch(0.70 0.18 293))" },
  },
  {
    href: "/assistant",
    label: "Cere sfat Ava",
    icon: Sparkles,
    style: { background: "linear-gradient(135deg, oklch(0.70 0.14 185), oklch(0.78 0.12 185))" },
  },
  {
    href: "/wardrobe",
    label: "Garderobă",
    icon: Shirt,
    style: { background: "linear-gradient(135deg, oklch(0.75 0.12 330), oklch(0.82 0.09 330))" },
  },
  {
    href: "/history",
    label: "Istoric",
    icon: Clock,
    style: { background: "linear-gradient(135deg, oklch(0.88 0.06 20), oklch(0.93 0.04 20))" },
    textDark: true,
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState("");

  const firstName = session?.user?.name?.split(" ")[0] || "tu";

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("ro-RO", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    );
  }, []);

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
            {today}
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
                className="rounded-2xl p-4 flex items-center gap-3 shadow-ava-sm hover:shadow-ava transition-all duration-200 hover:-translate-y-0.5"
                style={action.style}
              >
                <action.icon
                  className={`h-5 w-5 shrink-0 ${action.textDark ? "text-gray-700" : "text-white"}`}
                />
                <span
                  className={`text-sm font-bold ${action.textDark ? "text-gray-700" : "text-white"}`}
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
                    <div className="relative w-full h-28">
                      <Image
                        src={item.imagePath}
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
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
