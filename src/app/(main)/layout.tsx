import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdam =
    process.env.NEXT_PUBLIC_PERSONA_ADAM_ENABLED === "true" &&
    session?.user?.sex === "male";
  const persona = isAdam ? "adam" : "ava";

  return (
    <div className="min-h-screen" data-persona={isAdam ? "adam" : undefined}>
      <Sidebar persona={persona} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>
      <MobileNav persona={persona} />
    </div>
  );
}
