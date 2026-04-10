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
