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
            className="rounded-xl border-border/60 bg-white/80"
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
            className="rounded-xl border-border/60 bg-white/80"
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
