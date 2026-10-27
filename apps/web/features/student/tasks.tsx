"use client";
/** Sujets de Rédaction et d’Oral, lus dans le jeu actif publié depuis l’espace éditorial. */
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "../../components/app-shell/icons";
import { api } from "../../lib/student-api";
import { formatDuration, type SpeakingTask, type WritingTask } from "./content";
import { SpeakingStudio } from "./speaking-studio";
import { WritingStudio } from "./writing-studio";

type Kind = "writing" | "speaking";
type TaskSetData<K extends Kind> = { title: string; tasks: (K extends "writing" ? WritingTask : SpeakingTask)[] };

export function useTasks<K extends Kind>(kind: K) {
  const [data, setData] = useState<TaskSetData<K> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api<TaskSetData<K>>(`tasks/${kind}/`).then(value => { if (active) setData(value); }).catch(e => { if (active) setError((e as Error).message); });
    return () => { active = false; };
  }, [kind]);
  return { data, error };
}

const base = (kind: Kind) => kind === "writing" ? "/etudiant/expression-ecrite" : "/etudiant/expression-orale";

const writingCard = (t: WritingTask) => ({ slug: t.slug, number: t.number, title: t.title, detail: t.genre, facts: [`${t.min}–${t.max} mots`, `${t.minutes} min`] });
const speakingCard = (t: SpeakingTask) => ({ slug: t.slug, number: t.number, title: t.title, detail: t.goal, facts: [formatDuration(t.seconds), t.prepSeconds ? `${t.prepSeconds / 60} min de préparation` : "Sans préparation"] });

export function TaskCards({ kind }: { kind: Kind }) {
  const { data, error } = useTasks(kind);
  const cards = (data?.tasks ?? []).map(task => kind === "writing" ? writingCard(task as WritingTask) : speakingCard(task as SpeakingTask));
  return <section aria-labelledby="series" className="series">
    <div className="series-head"><h2 id="series">Vos tâches</h2></div>
    {error && <p role="alert">{error}</p>}
    {!data && !error && <p className="student-hint">Chargement des sujets…</p>}
    {data && !cards.length && <div className="empty-block"><h3>Les prochains sujets se préparent</h3><p>Ils apparaîtront ici après leur relecture pédagogique.</p></div>}
    <div className="series-grid series-grid-3">{cards.map(card => <article className="series-card" key={card.slug}>
      <div className="series-card-top"><span className="series-kind" data-mode={card.number === 3 ? "simulation" : "training"}>Tâche {card.number}</span></div>
      <h3>{card.title}</h3>
      <p>{card.detail}</p>
      <div className="pill-row">{card.facts.map(fact => <span className="pill" key={fact}>{fact}</span>)}</div>
      <Link className="button button-primary tile-link" href={`${base(kind)}/${card.slug}`}>Ouvrir la tâche<span className="sr-only"> {card.number}</span><Icon name="arrow" size={15} /></Link>
    </article>)}</div>
  </section>;
}

export function TaskStudio({ kind, slug }: { kind: Kind; slug: string }) {
  const { data, error } = useTasks(kind);
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p className="student-hint">Chargement du sujet…</p>;
  const task = data.tasks.find(t => t.slug === slug);
  if (!task) return <div className="empty-block"><h3>Cette tâche n’a pas encore de sujet</h3><p><Link href={base(kind)}>Revenir à l’épreuve</Link></p></div>;
  const others = data.tasks.filter(t => t.slug !== slug).map(t => ({ slug: t.slug, number: t.number, title: t.title }));
  return kind === "writing"
    ? <WritingStudio key={task.slug} task={task as WritingTask} others={others} />
    : <SpeakingStudio key={task.slug} task={task as SpeakingTask} others={others} />;
}
