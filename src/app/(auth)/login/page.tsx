"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FocusedField = "email" | "password" | null;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<FocusedField>(null);

  useEffect(() => {
    let rafId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        document.documentElement.style.setProperty("--mx", x.toFixed(3));
        document.documentElement.style.setProperty("--my", y.toFixed(3));
        rafId = null;
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Timeout fallback - if signIn hangs for more than 15s, show error
    const timeoutId = setTimeout(() => {
      setError("Conexiunea a expirat. Te rugăm să încerci din nou.");
      setLoading(false);
    }, 15000);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        // Add callback URL explicitly for NextAuth v5
        callbackUrl: "/dashboard",
      });

      clearTimeout(timeoutId);

      if (result?.error) {
        setError("Email sau parolă incorecte");
        setLoading(false);
      } else if (result?.url) {
        // Success - redirect to the URL returned by signIn
        router.push(result.url);
        router.refresh();
      } else {
        // Fallback redirect
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Login error:", err);
      setError("A apărut o eroare. Te rugăm să încerci din nou.");
      setLoading(false);
    }
  }

  const adamActive = focused === "email";
  const avaActive = focused === "password";

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Split background */}
      <div className="absolute inset-0 flex">
        {/* Ava side — violet/lavandă */}
        <div
          className={cn(
            "w-1/2 h-full bg-gradient-to-br from-[#ede9fe] via-[#ddd6fe] to-[#c4b5fd] relative overflow-hidden transition-all duration-700",
            avaActive && "persona-active-ava"
          )}
        >
          <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-2 px-6 pointer-events-none">
            <p className={cn("text-violet-600/70 text-xs uppercase tracking-[4px] font-bold transition-all duration-500", avaActive && "text-violet-700 tracking-[5px]")}>
              Stilistă
            </p>
            <p className="text-violet-800/60 text-sm font-medium text-center">Consultantă de modă feminină</p>
          </div>
        </div>

        {/* Adam side — navy/cognac */}
        <div
          className={cn(
            "w-1/2 h-full bg-gradient-to-bl from-[#0f172a] via-[#1e293b] to-[#1a2744] relative overflow-hidden transition-all duration-700",
            adamActive && "persona-active-adam"
          )}
        >
          <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-2 px-6 pointer-events-none">
            <p className={cn("text-amber-400/70 text-xs uppercase tracking-[4px] font-bold transition-all duration-500", adamActive && "text-amber-300 tracking-[5px]")}>
              Stilist
            </p>
            <p className="text-amber-100/50 text-sm font-medium text-center">Consultant de modă masculină</p>
          </div>
        </div>
      </div>

      {/* Center divider */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-px w-px bg-gradient-to-b from-transparent via-white/40 to-transparent" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-sm mx-4 animate-card-float">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/80 px-8 py-9">

          {/* ADAVA branding */}
          <div className="flex flex-col items-center mb-7">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("flex flex-col items-center gap-1 transition-all duration-500", avaActive && "scale-110")}>
                <Image
                  src="/logo.png"
                  alt="Ava"
                  width={36}
                  height={36}
                  className={cn("object-contain ava-logo-hover cursor-pointer transition-transform", avaActive && "persona-logo-active")}
                  unoptimized
                  priority
                />
                <span className={cn("text-[9px] uppercase tracking-[2px] font-bold transition-colors", avaActive ? "text-violet-600" : "text-violet-400")}>
                  Ava
                </span>
              </div>
              <h1 className="animate-gradient-shift font-heading text-4xl font-bold tracking-tight leading-none bg-gradient-to-r from-violet-600 via-slate-700 to-amber-700 bg-clip-text text-transparent">
                ADAVA
              </h1>
              <div className={cn("flex flex-col items-center gap-1 transition-all duration-500", adamActive && "scale-110")}>
                <Image
                  src="/logo-adam.png"
                  alt="Adam"
                  width={36}
                  height={36}
                  className={cn("object-contain adam-logo-hover cursor-pointer transition-transform", adamActive && "adam-logo-active")}
                  unoptimized
                  priority
                />
                <span className={cn("text-[9px] uppercase tracking-[2px] font-bold transition-colors", adamActive ? "text-amber-700" : "text-amber-600")}>
                  Adam
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-500 text-center leading-relaxed">
              Stilul tău, personalizat de{" "}
              <span className={cn("font-semibold transition-colors", adamActive ? "text-amber-700" : "text-amber-600")}>Adam</span>
              {" "}&amp;{" "}
              <span className={cn("font-semibold transition-colors", avaActive ? "text-violet-700" : "text-violet-500")}>Ava</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className={cn("text-xs font-bold uppercase tracking-wider transition-colors duration-300", adamActive ? "text-amber-700" : "text-slate-400")}
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplu.ro"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                required
                className="rounded-xl border-slate-200 bg-slate-50/80 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className={cn("text-xs font-bold uppercase tracking-wider transition-colors duration-300", avaActive ? "text-violet-700" : "text-slate-400")}
              >
                Parolă
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                required
                className="rounded-xl border-slate-200 bg-slate-50/80 focus:border-violet-500 focus:ring-violet-500/20 transition-all duration-300"
              />
            </div>

            <Button
              type="submit"
              className="animate-gradient-shift w-full rounded-full h-11 font-bold text-sm mt-1 text-white border-0 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 active:scale-[0.98]"
              style={{ backgroundImage: "linear-gradient(90deg, #7c3aed, #6366f1, #d97706, #7c3aed)" }}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Intră în garderobă
            </Button>
          </form>

          <p className="text-[11px] text-center text-slate-400 mt-4 italic">
            Cine te va consilia azi, Adam sau Ava?
          </p>

          <p className="text-sm text-center text-slate-500 mt-4">
            Nu ai cont?{" "}
            <Link href="/register" className="text-violet-600 hover:text-violet-700 hover:underline font-bold">
              Creează unul
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
