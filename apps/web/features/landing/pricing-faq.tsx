/** Offres, FAQ native et appel final. Propriétaire : Jonathan Kakesa. */
import Link from "next/link";
import { Reveal } from "../../components/animations/reveal";
import { faqs, plans, SIGNUP, SUPPORT_EMAIL } from "./content";

export function Pricing() {
  return (
    <section id="tarifs" className="home-section home-tinted" aria-labelledby="pricing-title">
      <div className="container">
        <Reveal subtle>
          <div className="home-heading home-heading-center">
            <p className="eyebrow">Tarifs</p>
            <h2 id="pricing-title">Commencez gratuitement. Passez à Premium pour l’oral.</h2>
            <p>Prix en dollars canadiens, taxes en sus. Sans engagement.</p>
          </div>
        </Reveal>
        <div className="plan-grid">
          {plans.map((plan) => (
            <article key={plan.name} className={`plan-card${plan.featured ? " plan-featured" : ""}`} aria-labelledby={`plan-${plan.name}`}>
              <div className="plan-head">
                <h3 id={`plan-${plan.name}`}>{plan.name}</h3>
                {plan.featured && <span className="plan-badge">Recommandé</span>}
              </div>
              <p className="plan-description">{plan.description}</p>
              <p className="plan-price">
                <strong>{plan.price}</strong> <span>{plan.period}</span>
              </p>
              <ul className="check-list">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {plan.cta.href.startsWith("mailto:") ? (
                <a className={`button ${plan.featured ? "button-primary" : "button-secondary"}`} href={plan.cta.href}>
                  {plan.cta.label}
                </a>
              ) : (
                <Link className={`button ${plan.featured ? "button-primary" : "button-secondary"}`} href={plan.cta.href}>
                  {plan.cta.label}
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section id="faq" className="home-section" aria-labelledby="faq-title">
      <div className="container faq-layout">
        <div className="home-heading">
          <p className="eyebrow">Questions fréquentes</p>
          <h2 id="faq-title">Vos questions, nos réponses.</h2>
          <p>
            Une autre question ? Écrivez-nous à <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </p>
        </div>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.question}>
              <summary>
                {item.question}
                <span aria-hidden="true" className="faq-icon" />
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
    <section id="commencer" className="home-section" aria-labelledby="final-title">
      <div className="container">
        <div className="home-final">
          <h2 id="final-title">Votre prochaine étape commence aujourd’hui.</h2>
          <p>Créez votre compte en deux minutes et faites votre première série dès maintenant.</p>
          <div className="home-actions">
            <Link href={SIGNUP} className="button button-light">
              Créer mon compte gratuit <span aria-hidden="true">→</span>
            </Link>
            <Link href="/etudiant/compte" className="button button-outline-light">
              J’ai déjà un compte
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
