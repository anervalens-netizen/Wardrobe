import Link from "next/link";
import { Sparkles, Shirt, MessageSquare, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">AI Stylist Advisor</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Autentificare</Button>
            </Link>
            <Link href="/register">
              <Button>Creează cont</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 md:py-32 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Stilistul tău AI personal
            <br />
            <span className="text-muted-foreground">pentru garderoba ta digitală</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Organizează-ți hainele, primește recomandări personalizate de ținute
            și nu mai sta niciodată în fața dulapului fără să știi cu ce să te
            îmbraci.
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-8 py-6">
              Începe gratuit
            </Button>
          </Link>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 pb-20">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <Shirt className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Cataloghează tot</h3>
              <p className="text-muted-foreground">
                Adaugă hainele cu poze, culori, mărimi și caracteristici. Totul
                organizat frumos.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Asistent AI fashion</h3>
              <p className="text-muted-foreground">
                Spune-i ocazia și primești recomandări de ținute direct din
                garderoba ta.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Istoric & învățare</h3>
              <p className="text-muted-foreground">
                Aplicația învață din ce porți și îți oferă sugestii din ce în ce
                mai bune.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>AI Stylist Advisor &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
