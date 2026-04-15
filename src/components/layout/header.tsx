"use client";

import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data: session } = useSession();

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Logo mobil */}
        <div className="md:hidden flex items-center gap-2">
          <Image src="/logo.png" alt="Ava" width={24} height={24} className="object-contain" />
          <span className="font-heading italic text-lg text-primary">Ava</span>
        </div>
        <div className="hidden md:block" />

        {/* Mobile: logout button | Desktop: avatar user */}
        <div className="flex items-center gap-2">
          {/* Logout button — mobile only */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label="Ieșire din cont"
          >
            <LogOut className="h-4 w-4" />
          </Button>
          {/* Avatar — desktop only */}
          <Avatar className="hidden md:flex h-8 w-8 ring-2 ring-primary/20">
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
