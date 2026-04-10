import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ava — Your personal AI stylist",
    short_name: "Ava",
    description:
      "Organizează-ți garderoba și primește recomandări de ținute de la asistentul tău AI de stil personal.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8ff",
    theme_color: "#8b5cf6",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
