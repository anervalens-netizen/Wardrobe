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
  { href: "/assistant", label: "AI", icon: MessageSquare },
  { href: "/history", label: "Istoric", icon: CalendarDays },
  { href: "/profile", label: "Profil", icon: User },
];

export function Sidebar({ persona = "ava" }: { persona?: "ava" | "adam" }) {
  const pathname = usePathname();
  const isAdam = persona === "adam";

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-sidebar">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5">
          <Image
            src="/logo.png"
            alt={isAdam ? "Adam" : "Ava"}
            width={32}
            height={32}
            className={isAdam ? "object-contain grayscale opacity-70" : "object-contain"}
          />
          <div>
            <span className="font-heading italic text-xl text-primary">
              {isAdam ? "Adam" : "Ava"}
            </span>
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
            const label =
              item.href === "/assistant"
                ? isAdam
                  ? "Adam AI"
                  : "Ava AI"
                : item.label;
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
                    "h-[18px] w-[18px] shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                {label}
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
            <LogOut className="h-[18px] w-[18px]" />
            Deconectare
          </Button>
        </div>
      </div>
    </aside>
  );
}
