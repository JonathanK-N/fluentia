/** Manifest et icônes fournis ; aucun mode hors ligne annoncé. Propriétaire : Jonathan Kakesa. */
import type { MetadataRoute } from "next";
import { brand } from "../lib/brand";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.name,
    description: brand.slogan,
    lang: brand.locale,
    start_url: "/",
    display: "standalone",
    background_color: "#F7FAFF",
    theme_color: "#081B35",
    icons: [
      {
        src: "/branding/02_Icons_PWA/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/branding/02_Icons_PWA/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/branding/02_Icons_PWA/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
