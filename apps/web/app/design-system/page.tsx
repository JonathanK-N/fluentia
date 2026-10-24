/** Catalogue du socle, isolé des fonctionnalités métier. Propriétaire : Jonathan Kakesa. */
import type { Metadata } from "next";
import { Showcase } from "../../features/design-system/showcase";
export const metadata: Metadata = { title: "Design system" };
export default function DesignSystemPage() {
  return (
    <main id="contenu" className="container section">
      <p className="eyebrow">FLUENTIA · FONDATIONS V1.0</p>
      <h1 className="catalog-title">
        Un langage commun.
        <br />
        <span>Des expériences cohérentes.</span>
      </h1>
      <p className="lead">
        Composants interactifs de démonstration. Aucune donnée n’est envoyée ni
        enregistrée.
      </p>
      <Showcase />
    </main>
  );
}
