"use client";
/**
 * Page de correction d’un texte de Rédaction : niveau NCLC, ce qu’il manque pour le NCLC 7, détail, puis réessayer
 * ou passer au sujet suivant. La correction arrive au fil de l’eau : la note d’abord, le détail ensuite.
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../../components/app-shell/icons";
import { api, streamLines, type CorrectionPage, type WritingCorrection } from "../../lib/student-api";
import { countWords } from "./content";
import { SectionTitle } from "./ui";

// Barème IRCC du TCF Canada, expression écrite (note sur 20) : note minimale de chaque niveau.
const SCALE = [
  { nclc: "3 ou moins", label: "≤ 3", range: "0–3", from: 0 },
  { nclc: "4", label: "4", range: "4–5", from: 4 },
  { nclc: "5", label: "5", range: "6", from: 6 },
  { nclc: "6", label: "6", range: "7–9", from: 7 },
  { nclc: "7", label: "7", range: "10–11", from: 10 },
  { nclc: "8", label: "8", range: "12–13", from: 12 },
  { nclc: "9", label: "9", range: "14–15", from: 14 },
  { nclc: "10+", label: "10+", range: "16–20", from: 16 },
];
// Niveaux de A1 à C2 : chacun couvre une ou deux colonnes NCLC, car leurs fourchettes de notes s’emboîtent.
const LEVELS = [
  { name: "A1", hint: "Débutant", span: 1, from: 0 },
  { name: "A2", hint: "Élémentaire", span: 1, from: 4 },
  { name: "B1", hint: "Intermédiaire", span: 2, from: 6 },
  { name: "B2", hint: "Avancé", span: 2, from: 10 },
  { name: "C1", hint: "Autonome", span: 1, from: 14 },
  { name: "C2", hint: "Maîtrise", span: 1, from: 16 },
];
// Déduit de la note : toujours cohérent avec la colonne NCLC, même pour une correction faite avant le barème officiel.
const levelOf = (score: number) => [...LEVELS].reverse().find(step => score >= step.from)!.name;
const GOAL = "7";
const MAX_SCORE = 18; // note la plus haute donnée par la correction automatique
const nclc = (score: number) => [...SCALE].reverse().find(step => score >= step.from)!.nclc;
const subjectHref = (link: { task_slug: string; id: number }) => `/etudiant/expression-ecrite/${link.task_slug}?sujet=${link.id}`;
type Partial = { [K in keyof WritingCorrection]?: WritingCorrection[K] };

export function WritingCorrectionPage({ id }: { id: string }) {
  const [data, setData] = useState<CorrectionPage | null>(null);
  const [partial, setPartial] = useState<Partial>({});
  const [error, setError] = useState("");
  const started = useRef("");

  useEffect(() => {
    let active = true, timer: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      try {
        const page = await api<CorrectionPage>(`tasks/writing/corrections/${id}/`);
        if (!active) return;
        setData(page);
        if (page.status === "pending" && started.current !== id) {
          started.current = id;  // une seule correction, même si React relance l’effet
          await streamLines(`tasks/writing/corrections/${id}/stream/`, line => {
            if (line.partial) setPartial(line.partial as Partial);
            if (line.error) setError(line.error as string);
            if (line.done) setData(current => current && { ...current, status: "done", result: line.result as WritingCorrection, remaining: line.remaining as number });
          });
        } else if (page.status === "running") {
          timer = setTimeout(load, 2000);  // correction lancée depuis un autre onglet : on attend qu’elle se termine
        }
      } catch (e) { if (active) setError((e as Error).message); }
    }
    load();
    return () => { active = false; clearTimeout(timer); };
  }, [id]);

  if (error) return <div className="empty-block"><h2>La correction n’a pas pu se terminer</h2><p>{error} Elle n’est pas comptée dans vos corrections du jour.</p><Link className="button button-primary tile-link" href="/etudiant/expression-ecrite">Retour à la Rédaction</Link></div>;
  if (!data) return <p className="student-hint">Chargement de la correction…</p>;
  const result: Partial = data.result ?? partial;
  const scored = typeof result.score === "number";
  const level = scored ? nclc(result.score!) : null;
  const band = scored ? levelOf(result.score!) : null;
  const missing = scored ? Math.max(0, data.nclc_goal - result.score!) : 0;
  return <>
    <div className="home-top">
      <section className="hero-card" aria-labelledby="correction-titre" aria-busy={!scored}>
        <span className="hero-chip-row"><span className="hero-chip">{data.subject ? `Tâche ${data.subject.task_number}` : "Rédaction"}</span><span>Correction{data.subject ? ` · ${data.subject.title}` : ""}</span>{result.off_topic && <span className="hero-chip hero-chip-alert">Hors sujet</span>}</span>
        <h1 id="correction-titre" className="epreuve-title"><Icon name="trophy" size={30} />{scored ? `Votre niveau : NCLC ${level}` : "Correction en cours…"}</h1>
        <p aria-live="polite">{scored
          ? <>{result.score} / 20{` · niveau ${band} (${LEVELS.find(step => step.name === band)!.hint.toLowerCase()})`}. {result.off_topic ? "Un texte hors sujet est classé A1, note ramenée à 3/20 au maximum." : result.summary}</>
          : "Votre texte est en cours de lecture. La note s’affiche dans quelques secondes."}</p>
      </section>
      <section className="status-card" aria-labelledby="objectif">
        <div className="status-head"><h2 id="objectif" className="badge-warn"><Icon name="target" size={14} />{scored && !missing ? "NCLC 7 atteint" : "Objectif NCLC 7"}</h2></div>
        <p className="correction-goal">{result.goal ?? "Ce qu’il vous faut pour l’atteindre arrive avec la note."}</p>
        {scored && <p className="status-text">{missing ? `Il vous manque ${missing} point${missing > 1 ? "s" : ""} sur 20.` : result.score! >= MAX_SCORE ? "Vous avez la note la plus haute." : "Visez maintenant le niveau suivant."}</p>}
      </section>
    </div>

    {result.off_topic && <div className="off-topic" role="note">
      <Icon name="flag" size={18} />
      <p><strong>Texte hors sujet.</strong> {result.off_topic_reason || "Votre texte ne traite pas la situation demandée par la consigne."}{data.subject && <><br /><span className="student-hint">Consigne : {data.subject.prompt}</span></>}</p>
    </div>}
    <SectionTitle title="Votre niveau" note="Barème du TCF Canada, expression écrite" />
    <section className="student-card result-level" aria-label="Votre niveau parmi tous les niveaux" aria-busy={!scored}>
      <ol className="level-scale" aria-label="Niveaux de A1 à C2">{LEVELS.map(step => {
        const current = step.name === band;
        return <li key={step.name} style={{ gridColumn: `span ${step.span}` }} data-current={current || undefined} aria-current={current ? "step" : undefined}>
          <strong>{step.name}</strong><span>{step.hint}</span>
        </li>;
      })}</ol>
      <ol className="nclc-scale" aria-label="Niveaux NCLC">{SCALE.map(step => {
        const current = step.nclc === level;
        return <li key={step.nclc} data-current={current || undefined} data-goal={step.nclc === GOAL || undefined} aria-current={current ? "step" : undefined}>
          <strong>NCLC {step.label}</strong>
          <span>{step.range} / 20</span>
          {current ? <em>Vous</em> : step.nclc === GOAL ? <em>Objectif</em> : null}
        </li>;
      })}</ol>
      {scored && <>
        <dl className="result-facts">
          <div><dt>Niveau obtenu</dt><dd>{band} · {LEVELS[levelIndex(band!)]!.hint}</dd></div>
          <div><dt>Équivalent NCLC</dt><dd>{level}</dd></div>
          <div><dt>Plage du niveau</dt><dd>{bandRange(band!)} / 20</dd></div>
          <div><dt>Pour le niveau suivant</dt><dd>{nextStep(result.score!)}</dd></div>
        </dl>
        <div className="result-score">
          <span className="result-score-head"><span>Note</span><strong>{result.score} / 20</strong></span>
          <span className="bar-track" aria-hidden="true"><span className="bar-fill" style={{ width: `${result.score! * 5}%` }} /></span>
        </div>
      </>}
    </section>

    {data.subject && <>
      <SectionTitle title="Sujet" note={`Tâche ${data.subject.task_number} · ${data.subject.title}`} />
      <section className="student-card result-block" aria-label="Sujet">
        <p className="result-prompt">{data.subject.prompt}</p>
        {data.subject.min_words && data.subject.max_words && <p className="student-hint">{data.subject.min_words} mots minimum, {data.subject.max_words} mots maximum.</p>}
      </section>
    </>}

    <SectionTitle title="Votre réponse" note={`${countWords(data.text)} mots`} />
    <section className="student-card result-block" aria-label="Votre réponse">
      <p className="correction-text result-answer">{data.text}</p>
    </section>

    <SectionTitle title="Retour du correcteur" note={data.status !== "done" ? "En préparation…" : result.demo ? "Correction de démonstration" : `${data.remaining} correction${data.remaining > 1 ? "s" : ""} restante${data.remaining > 1 ? "s" : ""} sur 24 h`} />
    <section className="student-card correction result-feedback" aria-label="Retour du correcteur" aria-busy={data.status !== "done"}>
      <Feedback result={result} />
    </section>

    <SectionTitle title={result.off_topic ? "Ce qu’il fallait écrire" : "Version améliorée de votre texte"} />
    <section className="student-card result-block" aria-label="Version améliorée">
      {result.improved
        ? <>
          <p className="student-hint">{result.off_topic ? "Un exemple de réponse qui traite la consigne : repérez ce qu’elle demande, puis réessayez avec vos propres mots." : "Votre texte avec les fautes corrigées et un vocabulaire plus précis : comparez-le au vôtre pour repérer chaque changement."}</p>
          <p className="correction-text">{result.improved}</p>
        </>
        : <Waiting />}
    </section>


    <section className="student-card correction-next" aria-label="Suite">
      <Link className="button button-secondary tile-link" href={data.subject ? `${subjectHref(data.subject)}&vide=1` : "/etudiant/expression-ecrite"}><Icon name="refresh" size={15} />Réessayer ce sujet</Link>
      {data.next
        ? <Link className="button button-primary tile-link" href={subjectHref(data.next)}>Sujet suivant : {data.next.title}<Icon name="arrow" size={15} /></Link>
        : <Link className="button button-primary tile-link" href="/etudiant/expression-ecrite">Toutes les tâches<Icon name="arrow" size={15} /></Link>}
    </section>
  </>;
}

const levelIndex = (name?: string) => LEVELS.findIndex(step => step.name === name);
const bandRange = (name: string) => {
  const index = levelIndex(name), next = LEVELS[index + 1];
  return `${LEVELS[index]!.from}–${next ? next.from - 1 : MAX_SCORE}`;
};
const nextStep = (score: number) => {
  const next = LEVELS.find(step => step.from > score);
  if (!next) return "Niveau maximum atteint";
  const gap = next.from - score;
  return `${next.name} dès ${next.from}/20, encore ${gap} point${gap > 1 ? "s" : ""}`;
};

const Waiting = () => <p className="student-hint correction-waiting">En préparation…</p>;

function Feedback({ result }: { result: Partial }) {
  // Explication sans note : le paragraphe de l’IA, ou les commentaires par critère des corrections plus anciennes.
  const explanation = result.feedback || result.criteria?.map(c => c.comment).filter(Boolean).join(" ");
  return <>
    {result.summary ? <p className="result-summary">{result.summary}</p> : <Waiting />}
    {explanation ? <p className="result-explanation">{explanation}</p> : result.summary && <Waiting />}
    <h3>À corriger</h3>
    {result.errors
      ? result.errors.length
        ? <ul className="correction-errors">{result.errors.map((e, index) => <li key={index}>
          <span><del>{e.original}</del><Icon name="arrow" size={13} aria-hidden="true" /><ins>{e.correction}</ins></span>
          <small>{e.explanation}</small>
        </li>)}</ul>
        : <p className="student-hint">Aucune erreur importante relevée.</p>
      : <Waiting />}
    <h3>Pour progresser</h3>
    {result.advice ? <ul className="checklist">{result.advice.map(item => <li key={item}>{item}</li>)}</ul> : <Waiting />}
    {result.disclaimer && <p className="student-hint">{result.disclaimer}</p>}
  </>;
}
