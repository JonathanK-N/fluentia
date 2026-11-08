/** Héro de l’accueil : promesse, appels à l’action et aperçu de l’oral. Propriétaire : Jonathan Kakesa. */
import Link from "next/link";
import { highlights, SIGNUP } from "./content";
import { SessionPreview } from "./session-preview";

export function Hero() {
  return (
    <section className="home-hero" aria-labelledby="hero-title">
      <div className="container home-hero-grid">
        <div className="home-hero-copy">
          <p className="home-pill">
            <span aria-hidden="true" className="home-pill-dot" />
            Nouveau : l’oral avec un examinateur IA vocal
          </p>
          <h1 id="hero-title">
            Préparez le TCF Canada <span>comme le jour de l’examen.</span>
          </h1>
          <p className="home-lead">
            Les quatre épreuves au format officiel, des rédactions corrigées par l’IA et un examinateur
            qui vous parle, vous écoute et vous relance à l’oral.
          </p>
          <div className="home-actions">
            <Link href={SIGNUP} className="button button-primary">
              Créer mon compte gratuit <span aria-hidden="true">→</span>
            </Link>
            <a href="#examinateur" className="button button-secondary">
              Découvrir l’oral
            </a>
          </div>
          <p className="home-reassure">Gratuit pour commencer · Sans carte bancaire · En français, sur tous vos appareils</p>
        </div>
        <SessionPreview />
      </div>
      <div className="container">
        <dl className="home-highlights">
          {highlights.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
