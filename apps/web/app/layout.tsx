/** Fluentia — racine des pages et métadonnées. Auteur : Jonathan Kakesa. */
import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Fluentia — TCF Canada", description: "Préparez les quatre compétences du TCF Canada avec Fluentia." };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="fr"><body>{children}</body></html>}
