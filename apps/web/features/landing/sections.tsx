/** Sections de l’accueil : épreuves, examinateur IA et fonctionnement. Propriétaire : Jonathan Kakesa. */
import Link from "next/link";
import { SkillIcon } from "../../components/ui/skill-icon";
import { Reveal } from "../../components/animations/reveal";
import { examinerPromises, exams, speakingTasks, steps, SIGNUP } from "./content";

function Heading({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="home-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}

export function Exams() {
  return (
    <section id="epreuves" className="home-section" aria-labelledby="exams-title">
      <div className="container">
        <Reveal subtle>
          <Heading id="exams-title" eyebrow="Les 4 épreuves" title="Tout le TCF Canada, au même endroit.">
            Chaque épreuve reprend le format, la durée et le type de documents de l’examen, avec une
            correction pour comprendre vos erreurs.
          </Heading>
        </Reveal>
        <ul className="exam-grid">
          {exams.map((exam) => (
            <li key={exam.id} className="exam-card" data-skill={exam.id}>
              <div className="exam-card-top">
                <span className="exam-icon">
                  <SkillIcon id={exam.id} />
                </span>
                <span className="exam-format">{exam.format}</span>
              </div>
              <h3>{exam.title}</h3>
              <p>{exam.detail}</p>
              <ul className="check-list">
                {exam.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Link href={exam.href} className="exam-link" aria-label={`S’entraîner en ${exam.title.toLowerCase()}`}>
                S’entraîner <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Examiner() {
  return (
    <section id="examinateur" className="home-section home-dark" aria-labelledby="examiner-title">
      <div className="container examiner-grid">
        <div>
          <Heading id="examiner-title" eyebrow="Expression orale" title="Un examinateur qui vous écoute, vous répond et vous relance.">
            L’épreuve la plus redoutée devient la plus facile à travailler. Prenez la parole à voix haute,
            dans les conditions de l’examen, aussi souvent que nécessaire.
          </Heading>
          <ul className="promise-list">
            {examinerPromises.map(([title, detail]) => (
              <li key={title}>
                <strong>{title}</strong>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
          <Link href="/etudiant/expression-orale" className="button button-light">
            Essayer la tâche 1 gratuitement <span aria-hidden="true">→</span>
          </Link>
        </div>
        <ol className="task-timeline" aria-label="Les trois tâches de l’oral">
          {speakingTasks.map((task) => (
            <li key={task.number}>
              <div className="task-timeline-head">
                <span>{task.number}</span>
                <span className="task-duration">{task.duration}</span>
              </div>
              <h3>{task.title}</h3>
              <p>{task.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Steps() {
  return (
    <section id="fonctionnement" className="home-section" aria-labelledby="steps-title">
      <div className="container">
        <Reveal subtle>
          <Heading id="steps-title" eyebrow="Comment ça marche" title="Quatre étapes pour être prêt." />
        </Reveal>
        <ol className="step-grid">
          {steps.map(([title, detail], index) => (
            <li key={title}>
              <span className="step-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{title}</h3>
              <p>{detail}</p>
            </li>
          ))}
        </ol>
        <div className="step-action">
          <Link href={SIGNUP} className="button button-primary">
            Commencer maintenant <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
