import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  let themeVariant: string | null = null;
  if (isAdam && session?.user?.id) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: { themeVariant: true },
    });
    themeVariant = profile?.themeVariant ?? null;
  }

  const classes = [
    "min-h-screen",
    isAdam && themeVariant === "dark" ? "dark" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} data-persona={isAdam ? "adam" : undefined}>
      <Sidebar persona={persona} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>
      <MobileNav persona={persona} />
    </div>
  );
}
