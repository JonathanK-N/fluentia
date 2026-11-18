/** Mise en page des pages légales : titre, date de mise à jour, sections numérotées. */
import Link from "next/link";
import type { ReactNode } from "react";
import { legal } from "../../lib/legal";
import "./legal.css";

export function LegalPage({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  return <main id="contenu" tabIndex={-1} className="container legal-page">
    <p className="eyebrow">Fluentia · Information légale</p>
    <h1>{title}</h1>
    <p className="legal-updated">Dernière mise à jour : {legal.updated}</p>
    <p className="legal-intro">{intro}</p>
    {children}
    <nav className="legal-links" aria-label="Pages légales">
      <Link href="/confidentialite">Politique de confidentialité</Link>
      <Link href="/conditions">Conditions d’utilisation</Link>
      <a href={`mailto:${legal.contact}`}>{legal.contact}</a>
    </nav>
  </main>;
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="legal-section"><h2>{title}</h2>{children}</section>;
}
