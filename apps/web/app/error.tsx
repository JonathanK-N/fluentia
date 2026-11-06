"use client";
/** Repli d’erreur sans divulgation de détails internes. Propriétaire : Jonathan Kakesa. */
import { Button } from "../components/ui/primitives";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="contenu" className="container section">
      <h1>Une difficulté passagère</h1>
      <p>Cette page ne peut pas être affichée pour le moment.</p>
      <Button onClick={reset}>Réessayer</Button>
    </main>
  );
}
