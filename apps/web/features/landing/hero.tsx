/** Entrée publique du pilote v3, sans décor animé. Propriétaire : Jonathan Kakesa. */
import Link from "next/link";
export function Hero() {
  return (
    <section className="landing-hero" aria-labelledby="hero-title">
      <div className="container landing-hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">Préparer le TCF pour votre projet au Québec</p>
          <h1 id="hero-title">
            Maîtrisez le français,
            <br />
            <span>allez plus loin.</span>
          </h1>
          <p className="lead">
            Une préparation pour comprendre, pratiquer et prendre confiance.
            Retrouvez vos compétences et votre prochaine étape dans un espace
            simple.
          </p>
          <div className="actions">
            <Link href="/etudiant" className="button button-primary">
              Voir le tableau de bord
            </Link>
            <a href="#approche" className="landing-text-link">
              Découvrir la méthode
            </a>
          </div>
          <p className="landing-small">
            Fluentia est en développement. Les aperçus et démonstrations sont
            accessibles sans compte.
          </p>
        </div>
        <aside
          className="learning-preview"
          aria-label="Exemple d’organisation du parcours"
        >
          <div className="learning-preview-header">
            <strong>Une séance, une intention</strong>
            <span className="badge">Exemple de parcours</span>
          </div>
          <ol>
            <li>
              <span>1</span>
              <div>
                <h2>Choisir une compétence</h2>
                <p>Écouter, lire, écrire ou prendre la parole.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <h2>Pratiquer à votre rythme</h2>
                <p>Se concentrer sur une activité et ses consignes.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <h2>Préparer la prochaine étape</h2>
                <p>Revenir sur vos acquis et garder un cap.</p>
              </div>
            </li>
          </ol>
          <p className="landing-small">
            Aucun score ni résultat personnel dans cet aperçu.
          </p>
        </aside>
      </div>
    </section>
  );
}
