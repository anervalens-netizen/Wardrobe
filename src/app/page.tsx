import Link from "next/link";
import Image from "next/image";
import { Shirt, MessageSquare, CalendarDays, Sparkles, Brain, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-white overflow-hidden">

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col">
        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        >
          <source src="/login-background.mp4" type="video/mp4" />
        </video>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-transparent to-[#0a0a0f]" />
        <div className="absolute inset-0 bg-gradient-to-r from-violet-950/40 via-transparent to-amber-950/40" />

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Ava" width={28} height={28} className="object-contain" unoptimized />
              <span
                className="font-heading text-2xl font-bold tracking-tight"
                style={{
                  background: "linear-gradient(90deg, #7c3aed, #94a3b8, #d97706)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                ADAVA
              </span>
              <Image src="/logo-adam.png" alt="Adam" width={28} height={28} className="object-contain" unoptimized />
            </div>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 rounded-full px-5">
                Autentificare
              </Button>
            </Link>
            <Link href="/register">
              <Button
                className="rounded-full px-6 text-white border-0 shadow-lg"
                style={{ background: "linear-gradient(135deg, #7c3aed, #d97706)" }}
              >
                Creează cont
              </Button>
            </Link>
          </nav>
        </header>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-8 text-xs text-white/70 font-medium tracking-wide uppercase">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            Stilist AI personal
          </div>

          {/* Title */}
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-none mb-6">
            <span
              style={{
                background: "linear-gradient(90deg, #a78bfa, #e2e8f0, #fbbf24)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ADAVA
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-xl mx-auto mb-4 leading-relaxed">
            Doi stilisti AI — <span className="text-violet-400 font-semibold">Ava</span> pentru ea,{" "}
            <span className="text-amber-400 font-semibold">Adam</span> pentru el.
          </p>
          <p className="text-base text-white/40 max-w-lg mx-auto mb-12">
            Organizează-ți garderoba, primește ținute personalizate și descoperă-ți stilul propriu cu ajutorul inteligenței artificiale.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="rounded-full px-8 h-13 text-base font-bold text-white border-0 shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 transition-all duration-300"
                style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #d97706 100%)" }}
              >
                Începe gratuit
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="ghost"
                className="rounded-full px-8 h-13 text-base font-semibold text-white/70 hover:text-white hover:bg-white/10 border border-white/20 hover:border-white/40 transition-all duration-300"
              >
                Am deja cont
              </Button>
            </Link>
          </div>
        </div>

        {/* Persona showcase cards */}
        <div className="relative z-10 flex items-center justify-center gap-6 pb-16 px-6">
          {/* Ava card */}
          <div className="group flex flex-col items-center gap-3 bg-violet-950/50 backdrop-blur-sm border border-violet-500/20 rounded-2xl px-6 py-5 hover:border-violet-500/40 hover:bg-violet-950/70 transition-all duration-300 cursor-default">
            <Image src="/logo.png" alt="Ava" width={40} height={40} className="object-contain group-hover:scale-110 transition-transform duration-300" unoptimized />
            <div className="text-center">
              <p className="text-violet-300 font-bold text-sm tracking-wide">Ava</p>
              <p className="text-violet-400/60 text-xs mt-0.5">Stilistă feminină</p>
            </div>
          </div>

          <div className="h-px w-16 bg-gradient-to-r from-violet-500/30 via-white/20 to-amber-500/30" />

          {/* Adam card */}
          <div className="group flex flex-col items-center gap-3 bg-amber-950/40 backdrop-blur-sm border border-amber-500/20 rounded-2xl px-6 py-5 hover:border-amber-500/40 hover:bg-amber-950/60 transition-all duration-300 cursor-default">
            <Image src="/logo-adam.png" alt="Adam" width={40} height={40} className="object-contain group-hover:scale-110 transition-transform duration-300" unoptimized />
            <div className="text-center">
              <p className="text-amber-300 font-bold text-sm tracking-wide">Adam</p>
              <p className="text-amber-400/60 text-xs mt-0.5">Stilist masculin</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0d0a1a] to-[#0a0a0f]" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-violet-400 text-xs uppercase tracking-[4px] font-bold mb-4">Ce face ADAVA</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white/90">
              Garderoba ta, inteligentă
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group bg-white/4 border border-white/8 rounded-2xl p-7 hover:bg-white/7 hover:border-white/15 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-5"
                style={{ background: "linear-gradient(135deg, #7c3aed22, #7c3aed44)" }}>
                <Shirt className="h-5 w-5 text-violet-400" />
              </div>
              <h3 className="font-semibold text-white/90 text-base mb-2">Cataloghează tot</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Adaugă hainele cu poze, culori și mărimi. Garderoba ta digitală, organizată perfect.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white/4 border border-white/8 rounded-2xl p-7 hover:bg-white/7 hover:border-white/15 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-5"
                style={{ background: "linear-gradient(135deg, #d9770622, #d9770644)" }}>
                <MessageSquare className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="font-semibold text-white/90 text-base mb-2">Asistent AI de modă</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Spune ocazia și primești ținute personalizate direct din garderoba ta, de la stilistul tău.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white/4 border border-white/8 rounded-2xl p-7 hover:bg-white/7 hover:border-white/15 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-5"
                style={{ background: "linear-gradient(135deg, #06b6d422, #06b6d444)" }}>
                <Brain className="h-5 w-5 text-cyan-400" />
              </div>
              <h3 className="font-semibold text-white/90 text-base mb-2">Memorie & învățare</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Stilistul tău își amintește preferințele și evoluează cu tine, sesiune după sesiune.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-white/4 border border-white/8 rounded-2xl p-7 hover:bg-white/7 hover:border-white/15 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-5"
                style={{ background: "linear-gradient(135deg, #10b98122, #10b98144)" }}>
                <CalendarDays className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-white/90 text-base mb-2">Istoric ținute</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Revezi ce ai purtat, ce a mers și ce ar merge mai bine. Stilul tău în timp.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group bg-white/4 border border-white/8 rounded-2xl p-7 hover:bg-white/7 hover:border-white/15 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-5"
                style={{ background: "linear-gradient(135deg, #8b5cf622, #8b5cf644)" }}>
                <Sparkles className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white/90 text-base mb-2">Personalizat complet</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Ava pentru femei, Adam pentru bărbați — fiecare cu paleta lui, stilul lui, vocea lui.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-white/4 border border-white/8 rounded-2xl p-7 hover:bg-white/7 hover:border-white/15 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-5"
                style={{ background: "linear-gradient(135deg, #f4375722, #f4375744)" }}>
                <Lock className="h-5 w-5 text-rose-400" />
              </div>
              <h3 className="font-semibold text-white/90 text-base mb-2">Privat & sigur</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Garderoba ta e a ta. Date locale, autentificare securizată, nicio terță parte.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Bottom ── */}
      <section className="relative py-24 px-6 text-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] to-[#0d0a1a]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-950/30 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6 text-white/90">
            Gata să-ți descoperi stilul?
          </h2>
          <p className="text-white/40 text-base mb-10">
            Creează-ți contul gratuit și lasă-i pe Adam sau Ava să te ghideze.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="rounded-full px-10 h-14 text-base font-bold text-white border-0 shadow-2xl shadow-violet-500/25 hover:shadow-violet-500/45 hover:scale-105 transition-all duration-300"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #d97706 100%)" }}
            >
              Începe gratuit
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/8 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Ava" width={20} height={20} className="object-contain opacity-60" unoptimized />
            <span
              className="font-heading text-lg font-bold opacity-60"
              style={{
                background: "linear-gradient(90deg, #7c3aed, #94a3b8, #d97706)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ADAVA
            </span>
            <Image src="/logo-adam.png" alt="Adam" width={20} height={20} className="object-contain opacity-60" unoptimized />
          </div>
          <p className="text-white/25 text-xs">
            © {new Date().getFullYear()} ADAVA — Stilul tău, personalizat de AI.
          </p>
        </div>
      </footer>

    </div>
  );
}
