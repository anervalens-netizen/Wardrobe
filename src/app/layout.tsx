import type { Metadata } from "next";
import { DM_Serif_Display, Nunito } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { SwRegister } from "@/components/sw-register";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "AI Stylist Advisor",
  description:
    "Organizează-ți garderoba și primește recomandări de ținute de la asistentul tău AI de stil personal.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI Stylist",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className={`${dmSerifDisplay.variable} ${nunito.variable} h-full`}>
      <body className="min-h-full bg-background text-foreground antialiased">
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
          <SwRegister />
        </Providers>
      </body>
    </html>
  );
}
