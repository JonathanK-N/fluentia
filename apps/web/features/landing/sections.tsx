import { SkillIcon } from "../../components/ui/skill-icon";
/** Sections éditoriales et cartes réutilisables. Propriétaire : Jonathan Kakesa. */
import { competencies } from "../../lib/brand";
import { Card } from "../../components/ui/primitives";
import { Reveal } from "../../components/animations/reveal";
import { CoachDemo } from "./coach-demo";
import { journey } from "./content";
export function CompetencyCard({
  item,
  order,
}: {
  item: (typeof competencies)[number];
  order?: number;
}) {
  return (
    <Card className="skill-card">
      <div className="skill-top">
        <SkillIcon id={item.id} />
        <span>{order ? String(order).padStart(2, "0") : item.number}</span>
      </div>
      <h3>{item.title}</h3>
      <p>{item.detail}</p>
      <span className="skill-bottom">{item.label}</span>
    </Card>
  );
}
export function Competencies() {
  return (
    <section
      id="fonctionnalites"
      className="landing-section"
      aria-labelledby="skills-title"
    >
      <div className="container" id="modules">
        <Reveal subtle>
          <div className="landing-section-heading">
            <div>
              <p className="eyebrow">Les quatre compétences</p>
              <h2 id="skills-title">
                Le français dans
                <br />
                <span>toutes ses dimensions.</span>
              </h2>
            </div>
            <p>
              Une préparation cohérente pour comprendre, vous exprimer et
              trouver votre aisance. Chaque compétence nourrit les autres.
            </p>
          </div>
          <div className="skills-grid">
            {[...competencies]
              .sort(
                (a, b) =>
                  (a.id === "parole"
                    ? 2
                    : a.id === "redaction"
                      ? 3
                      : Number(a.number) - 1) -
                  (b.id === "parole"
                    ? 2
                    : b.id === "redaction"
                      ? 3
                      : Number(b.number) - 1),
              )
              .map((item, index) => (
                <CompetencyCard item={item} order={index + 1} key={item.id} />
              ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
export function Coach() {
  return (
    <section
      className="landing-section coach-section"
      id="coach"
      aria-labelledby="coach-title"
    >
      <div className="container coach-grid">
        <Reveal subtle>
          <p className="eyebrow">Un accompagnement pensé pour vous</p>
          <h2 id="coach-title">
            Comprendre vos erreurs.
            <br />
            <span>Essayer autrement.</span>
          </h2>
          <p className="lead">
            Des repères pour savoir quoi retravailler. Découvrez le type
            d’accompagnement envisagé, avec un exemple concret.
          </p>
          <ul className="editorial-list">
            <li>Des objectifs lisibles, une étape à la fois.</li>
            <li>Des retours pour comprendre et réessayer.</li>
            <li>Un rythme qui laisse la place d’apprendre.</li>
          </ul>
          <p className="landing-small">
            Accompagnement envisagé. L’exemple ci-contre est prédéfini et
            fonctionne localement.
          </p>
        </Reveal>
        <Reveal subtle>
          <CoachDemo />
        </Reveal>
      </div>
    </section>
  );
}
export function Journey() {
  return (
    <section
      className="landing-section journey-section"
      id="approche"
      aria-labelledby="journey-title"
    >
      <div className="container">
        <Reveal subtle>
          <div className="landing-section-heading">
            <div>
              <p className="eyebrow">Une méthode progressive</p>
              <h2 id="journey-title">
                Un parcours simple,
                <br />
                <span>étape par étape.</span>
              </h2>
            </div>
            <p>
              Du premier repère à la prochaine simulation, un chemin pour
              progresser avec intention. Voici la méthode envisagée.
            </p>
          </div>
          <ol className="journey-grid">
            {journey.map(([label, title, detail], index) => (
              <li key={label}>
                <span className="journey-number">0{index + 1}</span>
                <p className="journey-label">{label}</p>
                <h3>{title}</h3>
                <p>{detail}</p>
              </li>
            ))}
          </ol>
        </Reveal>
        <div className="exam-note" id="examens">
          <div>
            <p className="eyebrow">SE PRÉPARER, SANS FAUSSE PROMESSE</p>
            <h3>Comprendre le format. Garder votre singularité.</h3>
          </div>
          <p>
            Les simulations seront des entraînements pédagogiques, sans
            certification officielle ni garantie de résultat au TCF. Elles ne
            sont pas encore disponibles.
          </p>
        </div>
      </div>
    </section>
  );
}
export { DashboardPreview } from "../human-centered/learning-preview";
