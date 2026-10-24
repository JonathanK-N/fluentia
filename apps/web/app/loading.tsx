/** Repli de chargement de route. Propriétaire : Jonathan Kakesa. */
import { Skeleton } from "../components/ui/primitives";
export default function Loading() {
  return (
    <main id="contenu" className="container section">
      <h1>Chargement de votre espace</h1>
      <Skeleton />
    </main>
  );
}
