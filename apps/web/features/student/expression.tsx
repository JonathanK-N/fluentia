/** Présentation des trois tâches d’une épreuve d’expression. */
import Link from "next/link";
import { Icon } from "../../components/app-shell/icons";
import { formatDuration, officialSource, speakingTasks, writingTasks } from "./content";
import { Notice, PageHead } from "./ui";

export function ExpressionOverview({ kind }: { kind: "writing" | "speaking" }) {
  const writing = kind === "writing";
  const base = writing ? "/etudiant/expression-ecrite" : "/etudiant/expression-orale";
  const cards = writing
    ? writingTasks.map(t => ({ slug: t.slug, number: t.number, title: t.title, detail: t.genre, meta: `${t.min}–${t.max} mots · ${t.minutes} min conseillées` }))
    : speakingTasks.map(t => ({ slug: t.slug, number: t.number, title: t.title, detail: t.goal, meta: `${formatDuration(t.seconds)} de parole${t.prepSeconds ? ` · ${t.prepSeconds / 60} min de préparation` : " · sans préparation"}` }));
  return <>
    <PageHead eyebrow="Expression" title={writing ? "Expression écrite" : "Expression orale"}>
      {writing ? "Trois tâches en 60 minutes : un message, un récit, puis une argumentation à partir de deux documents. Rédigez dans un studio qui compte vos mots et garde votre brouillon." : "Trois tâches en 12 minutes environ : un entretien, une interaction, puis un point de vue. Enregistrez-vous, réécoutez-vous, recommencez."}
    </PageHead>
    <div className="skill-grid">{cards.map(card => <article className="learn-card" key={card.slug}>
      <span className="skill-icon"><Icon name={writing ? "pen" : "mic"} size={22} /></span>
      <span className="skill-meta">Tâche {card.number}</span>
      <h2 style={{ margin: 0 }}>{card.title}</h2>
      <p>{card.detail}</p>
      <span className="skill-meta">{card.meta}</span>
      <Link className="button button-primary tile-link" href={`${base}/${card.slug}`}>Ouvrir le studio<span className="sr-only"> — tâche {card.number}</span></Link>
    </article>)}</div>
    <div style={{ marginTop: "1.5rem" }}><Notice icon="flag">{writing ? "Vos textes restent enregistrés sur cet appareil. La correction détaillée par un évaluateur sera proposée dans une prochaine version ; aucune note n’est simulée." : "Les enregistrements restent dans votre navigateur. L’évaluation par un examinateur sera proposée dans une prochaine version ; aucune note n’est simulée."} Format de référence : <a href={officialSource} target="_blank" rel="noreferrer">France Éducation international</a>.</Notice></div>
  </>;
}
