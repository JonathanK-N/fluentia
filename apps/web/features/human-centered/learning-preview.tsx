/** Lien vers le pilote étudiant, sans fausses statistiques. Propriétaire : Jonathan Kakesa. */
import Link from "next/link";
export function DashboardPreview() {
  return (
    <section
      id="apercu"
      className="landing-section preview-section"
      aria-labelledby="preview-title"
    >
      <div className="container dashboard-intro">
        <div>
          <p className="eyebrow">Votre espace d’apprentissage</p>
          <h2 id="preview-title">
            L’essentiel pour
            <br />
            reprendre votre parcours.
          </h2>
          <p>
            Vos compétences, vos activités et votre prochaine étape : au même
            endroit. Découvrez l’aperçu d’un premier accès, sans résultat
            inventé.
          </p>
          <Link href="/apercu/etudiant" className="button button-primary">
            Ouvrir l’aperçu étudiant
          </Link>
        </div>
        <div className="dashboard-outline">
          <h3>Un tableau de bord qui vous aide à choisir</h3>
          <ul>
            <li>Des accès directs aux quatre compétences.</li>
            <li>Un état vide utile quand vous commencez.</li>
            <li>
              Un historique uniquement quand des activités sont disponibles.
            </li>
          </ul>
          <p className="landing-small">
            Maquette de conception. Aucun compte personnel connecté.
          </p>
        </div>
      </div>
    </section>
  );
}
