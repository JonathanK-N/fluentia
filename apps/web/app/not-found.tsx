/** Repli de navigation. Propriétaire : Jonathan Kakesa. */
import Link from "next/link";
export default function NotFound() {
  return (
    <main id="contenu" className="container section">
      <p className="eyebrow">404</p>
      <h1>Cette page reste à écrire.</h1>
      <Link className="button button-primary" href="/">
        Retour à l’accueil
      </Link>
    </main>
  );
}
