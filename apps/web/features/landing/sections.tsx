/** Sections éditoriales et cartes réutilisables. Propriétaire : Jonathan Kakesa. */
import { competencies } from "../../lib/brand";
import { Card, Badge, Progress } from "../../components/ui/primitives";
import { Reveal } from "../../components/animations/reveal";
import { CoachDemo } from "./coach-demo";
import { journey } from "./content";
function SkillIcon({ id }: { id: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {id === "ecoute" ? (
        <>
          <path d="M7 16v-5a7 7 0 0 1 14 0c0 5-5 5-5 9a3 3 0 0 1-6 0" />
          <path d="M11 12a3 3 0 0 1 6 0c0 2-3 2-3 5" />
        </>
      ) : id === "lecture" ? (
        <>
          <path d="M3 5c4-1 8 0 11 2 3-2 7-3 11-2v17c-4-1-8 0-11 2-3-2-7-3-11-2Z" />
          <path d="M14 7v17M7 10l3 1M18 11l3-1M7 15l3 1M18 16l3-1" />
        </>
      ) : id === "parole" ? (
        <>
          <rect x="10" y="3" width="8" height="14" rx="4" />
          <path d="M6 12v2a8 8 0 0 0 16 0v-2M14 22v4M10 26h8" />
        </>
      ) : (
        <>
          <path d="m5 19-1 6 6-1L24 10l-5-5ZM16 8l5 5M5 19l5 5" />
          <path d="M15 25h10" />
        </>
      )}
    </svg>
  );
}
export function CompetencyCard({
  item,
}: {
  item: (typeof competencies)[number];
}) {
  return (
    <Card className="skill-card">
      <div className="skill-top">
        <SkillIcon id={item.id} />
        <span>{item.number}</span>
      </div>
      <h3>{item.title}</h3>
      <p>{item.detail}</p>
      <span className="skill-bottom">
        {item.label}
        <span aria-hidden="true">↗</span>
      </span>
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
        <Reveal>
          <div className="landing-section-heading">
            <div>
              <p className="eyebrow">01 / LES QUATRE COMPÉTENCES</p>
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
              .map((item) => (
                <CompetencyCard item={item} key={item.id} />
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
      aria-labelledby="coach-title"
    >
      <div className="container coach-grid">
        <Reveal>
          <p className="eyebrow">02 / VOTRE COACH INTELLIGENT</p>
          <h2 id="coach-title">
            Une direction claire.
            <br />
            <span>Votre propre élan.</span>
          </h2>
          <p className="lead">
            Pas seulement des exercices. Un accompagnement pensé pour comprendre
            où vous en êtes et vous aider à choisir la suite.
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
        <Reveal>
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
        <Reveal>
          <div className="landing-section-heading">
            <div>
              <p className="eyebrow">04 / UN PARCOURS QUI A DU SENS</p>
              <h2 id="journey-title">
                Un cap.
                <br />
                <span>Des petites victoires.</span>
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
export function DashboardPreview() {
  return (
    <section
      className="landing-section preview-section"
      id="apercu"
      aria-labelledby="preview-title"
    >
      <div className="container">
        <Reveal>
          <div className="landing-section-heading">
            <div>
              <p className="eyebrow">05 / VOTRE ESPACE, VOTRE RYTHME</p>
              <h2 id="preview-title">
                Moins de dispersion.
                <br />
                <span>Plus de place pour vous.</span>
              </h2>
            </div>
            <p>
              Un espace lisible pour retrouver votre objectif et reprendre là où
              vous en étiez. Aperçu visuel avec données fictives.
            </p>
          </div>
          <div className="dashboard-preview learn-preview">
            <div className="preview-sidebar" aria-hidden="true">
              <span className="preview-symbol">F</span>
              <span className="preview-nav-active">Vue d’ensemble</span>
              <span>Mon parcours</span>
              <span>Mes entraînements</span>
              <span>Fluentia Voice</span>
              <span>Ma progression</span>
              <span className="preview-sidebar-foot">LEARN / APERÇU</span>
            </div>
            <div className="preview-content">
              <div className="preview-topline">
                <span>VOTRE ESPACE D’APPRENTISSAGE</span>
                <Badge>Données fictives</Badge>
              </div>
              <h3>Une petite étape, chaque jour.</h3>
              <p>Votre prochaine séance vous attend.</p>
              <div className="preview-stats">
                <div>
                  <span>Objectif de la semaine</span>
                  <strong>3 séances</strong>
                </div>
                <div>
                  <span>Rythme illustratif</span>
                  <strong>15 min</strong>
                </div>
                <div>
                  <span>Prochaine étape</span>
                  <strong>Écouter</strong>
                </div>
              </div>
              <div className="preview-cards">
                <Card>
                  <span className="eyebrow">
                    VOTRE PROCHAINE PETITE VICTOIRE
                  </span>
                  <h4>Prendre le temps d’écouter.</h4>
                  <p>
                    Une activité de compréhension orale pour retrouver votre
                    élan.
                  </p>
                  <span className="preview-action">
                    Séance illustrative <span aria-hidden="true">↗</span>
                  </span>
                </Card>
                <Card>
                  <h4>Votre progression illustrative</h4>
                  <Progress value={35} label="Objectif de démonstration" />
                  <p className="landing-small">
                    Aucune estimation de niveau ou de score officiel.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
