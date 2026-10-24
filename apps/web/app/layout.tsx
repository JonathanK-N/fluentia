/** Racine française, police locale et métadonnées. Propriétaire : Jonathan Kakesa. */
import type { Metadata, Viewport } from "next";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "./globals.css";
import { brand } from "../lib/brand";
import { Providers } from "../components/layout/providers";
import { Header } from "../components/navigation/header";
import { Footer } from "../features/landing/footer";
import "../features/landing/landing.css";
import "../features/human-centered/pilot.css";
export const metadata: Metadata = {
  title: {
    default: "Fluentia — Préparation au TCF",
    template: "%s | Fluentia",
  },
  description: brand.slogan,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/branding/03_Favicons/favicon.ico",
    apple: "/branding/02_Icons_PWA/apple-touch-icon-180.png",
  },
};
export const viewport: Viewport = { themeColor: "#081B35" };
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={brand.locale}>
      <body>
        <Providers>
          <a className="skip-link" href="#contenu">
            Aller au contenu
          </a>
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
