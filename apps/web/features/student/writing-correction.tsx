"use client";
/**
 * Page de correction d’une tâche de Rédaction ou d’Oral : niveau NCLC, ce qu’il manque pour le NCLC 7, détail, puis
 * réessayer ou passer au sujet suivant. La correction arrive au fil de l’eau : la note d’abord, le détail ensuite.
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../../components/app-shell/icons";
import { api, streamLines, type CorrectionPage, type WritingCorrection } from "../../lib/student-api";
import { countWords, formatDuration } from "./content";
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
// Niveaux de A1 à C2, barème officiel du TCF (fiche France Compétences RS 6460) ; la correction s’arrête à 18/20.
const LEVELS = [
  { name: "A1", hint: "Débutant", from: 0 },
  { name: "A2", hint: "Élémentaire", from: 2 },
  { name: "B1", hint: "Intermédiaire", from: 6 },
  { name: "B2", hint: "Avancé", from: 10 },
  { name: "C1", hint: "Autonome", from: 14 },
  { name: "C2", hint: "Maîtrise", from: 18 },
];
// Déduit de la note : toujours cohérent avec la colonne NCLC, même pour une correction faite avant le barème officiel.
const levelOf = (score: number) => [...LEVELS].reverse().find(step => score >= step.from)!.name;
const GOAL = "7";
const MAX_SCORE = 18; // note la plus haute donnée par la correction automatique
const nclc = (score: number) => [...SCALE].reverse().find(step => score >= step.from)!.nclc;
type Partial = { [K in keyof WritingCorrection]?: WritingCorrection[K] };
type Kind = "writing" | "speaking";

// Ce qui change entre la Rédaction et l’Oral ; tout le reste de la page est commun.
const KINDS = {
  writing: {
    base: "/etudiant/expression-ecrite", page: (id: string) => `tasks/writing/corrections/${id}/`, stream: (id: string) => `tasks/writing/corrections/${id}/stream/`,
    home: "Retour à la Rédaction", scale: "Barème du TCF Canada, expression écrite", reading: "Votre texte est en cours de lecture.",
    offTopic: "Texte hors sujet.", offTopicNote: "Un texte hors sujet est classé A1, note ramenée à 1/20 au maximum.", offTopicFallback: "Votre texte ne traite pas la situation demandée par la consigne.",
    improvedTitle: "Version améliorée de votre texte", improvedHint: "Votre texte réécrit par un excellent rédacteur, avec vos idées : comparez les tournures, le vocabulaire et les liens entre les phrases.",
    modelTitle: "Ce qu’il fallait écrire", perfect: "Votre texte est déjà parfait : il n’y a rien à améliorer.", failed: "Elle n’est pas comptée dans vos corrections du jour.",
  },
  speaking: {
    base: "/etudiant/expression-orale", page: (id: string) => `speaking/sessions/${id}/`, stream: (id: string) => `speaking/sessions/${id}/correction/`,
    home: "Retour à l’Oral", scale: "Barème du TCF Canada, expression orale", reading: "La transcription de votre échange est en cours de lecture.",
    offTopic: "Réponse hors sujet.", offTopicNote: "Une réponse hors sujet obtient 5/20 et le niveau A1.", offTopicFallback: "Vos réponses ne traitent pas la situation demandée par la tâche.",
    improvedTitle: "Ce que vous auriez pu dire", improvedHint: "Vos réponses reformulées par un excellent locuteur, avec vos idées : repérez les tournures, le vocabulaire et les liens à réutiliser à l’oral.",
    modelTitle: "Ce qu’il fallait dire", perfect: "Votre prestation est déjà excellente : il n’y a rien à reformuler.", failed: "Vous pouvez relancer la correction depuis cette page.",
  },
};

export function WritingCorrectionPage({ id }: { id: string }) { return <CorrectionView id={id} kind="writing" />; }
export function SpeakingCorrectionPage({ id }: { id: string }) { return <CorrectionView id={id} kind="speaking" />; }

function CorrectionView({ id, kind }: { id: string; kind: Kind }) {
  const copy = KINDS[kind];
  const subjectHref = (link: { task_slug: string; id: number }) => `${copy.base}/${link.task_slug}?sujet=${link.id}`;
  const [data, setData] = useState<CorrectionPage | null>(null);
  const [partial, setPartial] = useState<Partial>({});
  const [error, setError] = useState("");
  const started = useRef("");

  useEffect(() => {
    let active = true, timer: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      try {
        const page = await api<CorrectionPage>(copy.page(id));
        if (!active) return;
        setData(page);
        if (page.status === "pending" && started.current !== id) {
          started.current = id;  // une seule correction, même si React relance l’effet
          let ended = false;
          await streamLines(copy.stream(id), line => {
            if (line.partial) setPartial(line.partial as Partial);
            if (line.error) { ended = true; setError(line.error as string); }
            if (line.done) { ended = true; setData(current => current && { ...current, status: "done", result: line.result as WritingCorrection, remaining: (line.remaining as number | undefined) ?? current.remaining }); }
          });
          if (!ended && active) setError("La connexion a été coupée pendant la correction.");
        } else if (page.status === "running") {
          timer = setTimeout(load, 2000);  // correction lancée depuis un autre onglet : on attend qu’elle se termine
        }
      } catch (e) { if (active) setError((e as Error).message); }
    }
    load();
    return () => { active = false; clearTimeout(timer); };
  }, [id, copy]);

  if (error) return <div className="empty-block"><h2>La correction n’a pas pu se terminer</h2><p>{error} {copy.failed}</p>
    {kind === "speaking" && <button type="button" className="button button-secondary tile-link" onClick={() => window.location.reload()}><Icon name="refresh" size={15} />Relancer la correction</button>}
    <Link className="button button-primary tile-link" href={copy.base}>{copy.home}</Link></div>;
  if (!data) return <p className="student-hint">Chargement de la correction…</p>;
  const result: Partial = data.result ?? partial;
  const scored = typeof result.score === "number";
  // À l’oral, la note Fluentia encourage ; le niveau et le NCLC suivent toujours le barème officiel.
  const speaking = kind === "speaking";
  const official = scored ? (speaking ? result.tcf_score ?? result.score! : result.score!) : 0;
  const level = scored ? nclc(official) : null;
  const band = scored ? levelOf(official) : null;
  const missing = scored ? Math.max(0, data.nclc_goal - official) : 0;
  const hint = band ? LEVELS.find(step => step.name === band)!.hint.toLowerCase() : "";
  return <>
    <div className="home-top">
      <section className="hero-card" aria-labelledby="correction-titre" aria-busy={!scored}>
        <span className="hero-chip-row"><span className="hero-chip">{data.subject ? `Tâche ${data.subject.task_number}` : kind === "writing" ? "Rédaction" : "Oral"}</span><span>Correction{data.subject ? ` · ${data.subject.title}` : ""}</span>{result.off_topic && <span className="hero-chip hero-chip-alert">Hors sujet</span>}</span>
        <h1 id="correction-titre" className="epreuve-title"><Icon name="trophy" size={30} />{!scored ? "Correction en cours…" : speaking ? `Votre note : ${result.score} / 20` : `Votre niveau : NCLC ${level}`}</h1>
        <p aria-live="polite">{scored
          ? speaking
            ? <>Niveau estimé {band} ({hint}) · NCLC {level}. {result.off_topic ? copy.offTopicNote : result.summary}</>
            : <>{result.score} / 20{` · niveau ${band} (${hint})`}. {result.off_topic ? copy.offTopicNote : result.summary}</>
          : `${copy.reading} La note s’affiche dans quelques secondes.`}</p>
      </section>
      <section className="status-card" aria-labelledby="objectif">
        <div className="status-head"><h2 id="objectif" className="badge-warn"><Icon name="target" size={14} />{scored && !missing ? "NCLC 7 atteint" : "Objectif NCLC 7"}</h2></div>
        <p className="correction-goal">{result.goal ?? "Ce qu’il vous faut pour l’atteindre arrive avec la note."}</p>
        {scored && !speaking && <p className="status-text">{missing ? `Il vous manque ${missing} point${missing > 1 ? "s" : ""} sur 20.` : result.score! >= MAX_SCORE ? "Vous avez la note la plus haute." : "Visez maintenant le niveau suivant."}</p>}
      </section>
    </div>

    {result.off_topic && <div className="off-topic" role="note">
      <Icon name="flag" size={18} />
      <p><strong>{copy.offTopic}</strong> {result.off_topic_reason || copy.offTopicFallback}{data.subject && <><br /><span className="student-hint">Consigne : {data.subject.prompt}</span></>}</p>
    </div>}
    <SectionTitle title="Votre niveau" note={copy.scale} />
    <section className="student-card result-level" aria-label="Votre niveau parmi tous les niveaux" aria-busy={!scored}>
      <ol className="level-scale" aria-label="Niveaux de A1 à C2">{LEVELS.map(step => {
        const current = step.name === band;
        return <li key={step.name} data-current={current || undefined} aria-current={current ? "step" : undefined}>
          <strong>{step.name}</strong><span>{step.hint}</span>{!speaking && <small>{bandRange(step.name)} / 20</small>}
        </li>;
      })}</ol>
      <ol className="nclc-scale" aria-label="Niveaux NCLC">{SCALE.map(step => {
        const current = step.nclc === level;
        return <li key={step.nclc} data-current={current || undefined} data-goal={step.nclc === GOAL || undefined} aria-current={current ? "step" : undefined}>
          <strong>NCLC {step.label}</strong>
          {!speaking && <span>{step.range} / 20</span>}
          {current ? <em>Vous</em> : step.nclc === GOAL ? <em>Objectif</em> : null}
        </li>;
      })}</ol>
      {scored && <>
        <dl className="result-facts">
          <div><dt>{speaking ? "Niveau estimé" : "Niveau obtenu"}</dt><dd>{band} · {LEVELS[levelIndex(band!)]!.hint}</dd></div>
          <div><dt>Équivalent NCLC</dt><dd>{level}</dd></div>
          {!speaking && <div><dt>Plage du niveau</dt><dd>{bandRange(band!)} / 20</dd></div>}
          {!speaking && <div><dt>Pour le niveau suivant</dt><dd>{nextStep(result.score!)}</dd></div>}
        </dl>
        <div className="result-score">
          <span className="result-score-head"><span>{speaking ? "Note Fluentia" : "Note"}</span><strong>{result.score} / 20</strong></span>
          <span className="bar-track" aria-hidden="true"><span className="bar-fill" style={{ width: `${result.score! * 5}%` }} /></span>
        </div>
      </>}
    </section>

    {data.subject && <>
      <SectionTitle title="Sujet" note={`Tâche ${data.subject.task_number} · ${data.subject.title}`} />
      <section className="student-card result-block" aria-label="Sujet">
        <p className="result-prompt">{data.subject.prompt}</p>
        {data.subject.min_words && data.subject.max_words && <p className="student-hint">{data.subject.min_words} mots minimum, {data.subject.max_words} mots maximum.</p>}
        {data.subject.cues && data.subject.cues.length > 0 && <div className="pill-row">{data.subject.cues.map(cue => <span className="pill" key={cue}>{cue}</span>)}</div>}
      </section>
    </>}

    {kind === "writing"
      ? <>
        <SectionTitle title="Votre réponse" note={`${countWords(data.text)} mots`} />
        <section className="student-card result-block" aria-label="Votre réponse">
          <p className="correction-text result-answer">{data.text}</p>
        </section>
      </>
      : <>
        <SectionTitle title="Votre échange" note={`${formatDuration(data.seconds ?? 0)} de parole · ${countWords(data.text)} mots de votre part`} />
        <section className="student-card result-block" aria-label="Votre échange">
          {data.transcript?.length
            ? <ol className="examiner-transcript result-transcript">{data.transcript.map((turn, index) => <li key={index} data-role={turn.role}><span>{turn.role === "candidate" ? "Vous" : "Examinateur"}</span>{turn.text}</li>)}</ol>
            : <p className="student-hint">Aucune transcription n’a été reçue pour cette séance.</p>}
        </section>
      </>}

    <SectionTitle title="Retour du correcteur" note={data.status !== "done" ? "En préparation…" : result.demo ? "Correction de démonstration" : data.remaining == null ? "Correction de la transcription" : `${data.remaining} correction${data.remaining > 1 ? "s" : ""} restante${data.remaining > 1 ? "s" : ""} sur 24 h`} />
    <section className="student-card correction result-feedback" aria-label="Retour du correcteur" aria-busy={data.status !== "done"}>
      <Feedback result={result} />
    </section>

    <SectionTitle title={result.off_topic ? copy.modelTitle : copy.improvedTitle} />
    <section className="student-card result-block" aria-label="Version améliorée">
      {result.improved
        ? <>
          <p className="student-hint">{result.off_topic ? "Un exemple de réponse qui traite la consigne : repérez ce qu’elle demande, puis réessayez avec vos propres mots." : copy.improvedHint}</p>
          <p className="correction-text">{result.improved}</p>
        </>
        : data.status === "done"
          ? <p className="student-hint">{official === 0 ? "Pas assez de matière pour proposer une version améliorée." : copy.perfect}</p>
          : <Waiting />}
    </section>


    <section className="student-card correction-next" aria-label="Suite">
      <Link className="button button-secondary tile-link" href={data.subject ? `${subjectHref(data.subject)}${kind === "writing" ? "&vide=1" : ""}` : copy.base}><Icon name="refresh" size={15} />Réessayer ce sujet</Link>
      {data.next
        ? <Link className="button button-primary tile-link" href={subjectHref(data.next)}>Sujet suivant : {data.next.title}<Icon name="arrow" size={15} /></Link>
        : <Link className="button button-primary tile-link" href={copy.base}>Toutes les tâches<Icon name="arrow" size={15} /></Link>}
    </section>
  </>;
}

const levelIndex = (name?: string) => LEVELS.findIndex(step => step.name === name);
const bandRange = (name: string) => {
  const index = levelIndex(name), next = LEVELS[index + 1];
  const low = LEVELS[index]!.from, high = next ? next.from - 1 : MAX_SCORE;
  return low === high ? `${low}` : `${low}–${high}`;
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
