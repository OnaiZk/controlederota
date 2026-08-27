import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eletromidia - Controle de Frota",
    short_name: "Controle Frota",
    description: "Sistema digital de checklist e controle de frota da Eletromidia",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#FF4F00",
    orientation: "portrait",
    scope: "/",
    id: "/",
    lang: "pt-BR",
    categories: ["business", "utilities", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
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
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/eletromidia-app logo-1024px.png",
        sizes: "1024x1024",
        type: "image/png",
      },
    ],
  };
}
