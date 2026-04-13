import { Sparkles } from "lucide-react";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center gap-2 px-4 py-4">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="font-semibold">AI Stylist Advisor</span>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
