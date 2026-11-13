"use client";
/** Sujets de Rédaction et d’Oral, lus dans le jeu actif publié depuis l’espace éditorial. */
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "../../components/app-shell/icons";
import { api } from "../../lib/student-api";
import { formatDuration, readDraft, type SpeakingTask, type WritingTask } from "./content";
import { SpeakingStudio } from "./speaking-studio";
import { WritingStudio } from "./writing-studio";

type Kind = "writing" | "speaking";
type TaskSetData<K extends Kind> = { title: string; tasks: (K extends "writing" ? WritingTask : SpeakingTask)[]; corrector?: string; examiner?: string };

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

export function TaskStudio(props: { kind: Kind; slug: string }) {
  // L’adresse (?sujet=…) choisit l’écran : il faut une frontière Suspense pour la lire côté client.
  return <Suspense fallback={<p className="student-hint">Chargement du sujet…</p>}><TaskEntry {...props} /></Suspense>;
}

function TaskEntry({ kind, slug }: { kind: Kind; slug: string }) {
  const { data, error } = useTasks(kind);
  const chosen = Number(useSearchParams().get("sujet"));
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p className="student-hint">Chargement du sujet…</p>;
  const task = data.tasks.find(t => t.slug === slug);
  if (!task) return <div className="empty-block"><h3>Cette tâche n’a pas encore de sujet</h3><p><Link href={base(kind)}>Revenir à l’épreuve</Link></p></div>;
  const others = data.tasks.filter(t => t.slug !== slug).map(t => ({ slug: t.slug, number: t.number, title: t.title }));
  const index = task.subjects.findIndex(item => item.id === chosen);
  if (index < 0) return <SubjectPicker kind={kind} task={task} />;
  return kind === "writing"
    ? <WritingStudio key={`${task.slug}-${index}`} task={task as WritingTask} subject={index} others={others} corrector={data.corrector ?? ""} />
    : <SpeakingStudio key={`${task.slug}-${index}`} task={task as SpeakingTask} subject={index} others={others} examiner={data.examiner ?? ""} />;
}

/** Première étape d’une tâche : choisir son sujet, puis commencer. */
function SubjectPicker({ kind, task }: { kind: Kind; task: WritingTask | SpeakingTask }) {
  const writing = kind === "writing";
  const facts = writing
    ? `Entre ${(task as WritingTask).min} et ${(task as WritingTask).max} mots, environ ${(task as WritingTask).minutes} minutes conseillées.`
    : `Durée : ${formatDuration((task as SpeakingTask).seconds)}${(task as SpeakingTask).prepSeconds ? `, précédée de ${(task as SpeakingTask).prepSeconds / 60} minutes de préparation` : ", sans préparation"}.`;
  const [drafts, setDrafts] = useState<boolean[]>([]);
  useEffect(() => { if (writing) setDrafts(task.subjects.map((_, index) => Boolean(readDraft(task.slug, index).trim()))); }, [writing, task]);
  return <>
    <div className="home-top home-top-single">
      <section className="hero-card" aria-labelledby="tache-titre">
        <span className="hero-chip-row"><span className="hero-chip">Tâche {task.number}</span><span>{writing ? "Rédaction · Expression écrite" : "Oral · Expression orale"}</span></span>
        <h1 id="tache-titre" className="epreuve-title"><Icon name={writing ? "pen" : "mic"} size={30} />{task.title}</h1>
        <p>{writing ? `${(task as WritingTask).genre}. ` : `${(task as SpeakingTask).goal} `}{facts}</p>
      </section>
    </div>
    <div className="section-title"><h2>Choisissez votre sujet</h2><span className="student-hint">{task.subjects.length} sujet{task.subjects.length > 1 ? "s" : ""}</span></div>
    <ol className="subject-list">
      {task.subjects.map((item, index) => <li key={item.id ?? item.title} className="subject-row">
        <span className="subject-number" aria-hidden="true">{index + 1}</span>
        <div className="subject-text">
          <h3>{item.title}{drafts[index] && <span className="subject-badge">Brouillon en cours</span>}</h3>
          <p>{item.prompt}</p>
        </div>
        <Link className="button button-primary tile-link" href={`${base(kind)}/${task.slug}?sujet=${item.id}`}>
          {drafts[index] ? "Reprendre" : "Commencer"}<span className="sr-only"> : {item.title}</span><Icon name="arrow" size={15} />
        </Link>
      </li>)}
    </ol>
  </>;
}
