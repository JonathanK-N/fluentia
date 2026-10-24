/** Offres non commerciales et FAQ native. Propriétaire : Jonathan Kakesa. */
import { Card } from "../../components/ui/primitives";
import { Reveal } from "../../components/animations/reveal";
import { faqs, plans } from "./content";
export function Pricing() {
  return (
    <section
      className="landing-section"
      id="tarifs"
      aria-labelledby="pricing-title"
    >
      <div className="container">
        <Reveal subtle>
          <div className="landing-section-heading">
            <div>
              <p className="eyebrow">Des offres en préparation</p>
              <h2 id="pricing-title">
                Choisir votre rythme.
                <br />
                <span>Préparer la suite.</span>
              </h2>
            </div>
            <p>
              Trois pistes d’accompagnement à l’étude. Les prix et conditions ne
              sont pas encore approuvés ; aucune offre n’est commercialisée.
            </p>
          </div>
          <div className="pricing-grid">
            {plans.map((plan, index) => (
              <Card
                key={plan.name}
                className={`pricing-card ${index === 1 ? "pricing-featured" : ""}`}
              >
                <span className="pricing-index">FORMULE / 0{index + 1}</span>
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
                <div className="price-label">
                  {plan.price === null
                    ? "Prix à confirmer"
                    : new Intl.NumberFormat("fr-CA", {
                        style: "currency",
                        currency: "CAD",
                      }).format(plan.price)}
                </div>
                <p className="landing-small">
                  Structure de démonstration · À venir
                </p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <span aria-hidden="true">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  className={`button button-${index === 1 ? "primary" : "secondary"}`}
                  href="#disponibilite"
                >
                  Consulter la disponibilité <span aria-hidden="true">↗</span>
                </a>
              </Card>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
export function Faq() {
  return (
    <section
      className="landing-section faq-section"
      id="faq"
      aria-labelledby="faq-title"
    >
      <div className="container faq-grid">
        <div>
          <p className="eyebrow">Questions fréquentes</p>
          <h2 id="faq-title">Questions fréquentes.</h2>
          <p>
            Quelques repères pour découvrir Fluentia, ses ambitions et ses
            limites actuelles.
          </p>
        </div>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.question}>
              <summary>
                {item.question}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
export function FinalCallToAction() {
  return (
    <section
      className="landing-section landing-final"
      id="disponibilite"
      aria-labelledby="availability-title"
    >
      <div className="container">
        <p className="eyebrow">Et ensuite ?</p>
        <h2 id="availability-title">
          Fluentia se prépare.
          <br />
          <span>Vous pouvez déjà explorer.</span>
        </h2>
        <p className="lead">
          Fluentia prend forme. Explorez l’expérience aujourd’hui ;
          l’inscription, les entraînements et les abonnements ouvriront
          ultérieurement.
        </p>
        <div className="actions">
          <a className="button button-primary" href="#voice">
            Explorer la démo Voice <span aria-hidden="true">↗</span>
          </a>
          <a className="button button-secondary" href="#apercu">
            Voir l’aperçu de l’application
          </a>
        </div>
        <p className="landing-small">
          Aucune inscription ni collecte de coordonnées sur cette page.
        </p>
      </div>
    </section>
  );
}
