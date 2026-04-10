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
