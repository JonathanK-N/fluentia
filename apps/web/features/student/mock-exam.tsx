"use client";
/** Examen TCF : la liste des examens, puis la page d’un passage (épreuve suivante, ou bilan une fois terminé). */
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/primitives";
import { Icon, type IconName } from "../../components/app-shell/icons";
import { api, streamLines, type MockBilan, type MockExamCard, type MockRun, type MockStepKey, type MockTask } from "../../lib/student-api";
import { useSession } from "../../lib/session";
import { enterFullscreen, exitFullscreen } from "../../lib/fullscreen";

export const MOCK_BASE = "/etudiant/examens-blancs/examen";
const ICONS: Record<MockStepKey, IconName> = { listening: "headphones", reading: "book", writing: "pen", speaking: "mic" };
const STATUS = { done: "Terminée", running: "En cours", todo: "À venir" } as const;

/** Les Examens TCF publiés : chaque case contient les 4 épreuves, dans l’ordre du test. */
export function MockExamList() {
  const { profile, ready } = useSession();
  const router = useRouter();
  const [exams, setExams] = useState<MockExamCard[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    api<MockExamCard[]>("mock-exams/").then(data => { if (active) setExams(data); }).catch(e => { if (active) setError((e as Error).message); });
    return () => { active = false; };
  }, [ready, profile]);

  async function start(exam: MockExamCard) {
    setBusy(exam.id); setError("");
    try { const run = await api<{ id: number }>(`mock-exams/${exam.id}/runs/`, "POST"); router.push(`${MOCK_BASE}/${run.id}`); }
    catch (e) { setError((e as Error).message); setBusy(null); }
  }

  return <section aria-labelledby="examens" className="series">
    <div className="series-head"><h2 id="examens">Examens TCF</h2></div>
    {error && <p role="alert">{error}</p>}
    {!exams && !error && <p className="student-hint">Chargement des examens…</p>}
    {exams?.length === 0 && <div className="empty-block"><h3>Les prochains examens se préparent</h3><p>Chaque Examen TCF réunit les 4 épreuves. Ils apparaîtront ici dès leur publication.</p></div>}
    <div className="series-grid mock-grid">{exams?.map(exam => {
      const finished = exam.run?.finished, running = exam.run && !finished;
      return <article className="series-card mock-card" key={exam.id} data-done={finished ? "true" : undefined}>
        <div className="series-card-top">
          <span className="series-kind" data-mode="simulation">Examen complet</span>
          {finished ? <span className="series-done"><Icon name="check" size={12} />Déjà fait</span> : running && <span className="series-running">En cours</span>}
        </div>
        <h3>{exam.title}</h3>
        <ol className="mock-parts">{exam.parts.map((part, index) => <li key={part.key}>
          <span className="mock-part-icon" aria-hidden="true"><Icon name={ICONS[part.key]} size={15} /></span>
          <span><strong>{index + 1}. {part.name}</strong><small>{part.detail}</small></span>
        </li>)}</ol>
        {finished && exam.run && <Link className="series-last" href={`${MOCK_BASE}/${exam.run.id}`}>
          <span>Mon bilan</span>
          <small>{exam.run.finished_at ? new Date(exam.run.finished_at).toLocaleDateString("fr-CA", { day: "numeric", month: "long" }) : ""}</small>
          <Icon name="arrow" size={13} />
        </Link>}
        {ready && !profile
          ? <Link className="button button-primary tile-link" href="/etudiant/compte">Se connecter pour commencer<Icon name="arrow" size={15} /></Link>
          : running && exam.run
            ? <Link className="button button-primary tile-link" href={`${MOCK_BASE}/${exam.run.id}`}>Reprendre l’examen<Icon name="arrow" size={15} /></Link>
            : <Button className={finished ? "button-again" : undefined} loading={busy === exam.id} disabled={!ready} onClick={() => start(exam)}>
              {finished ? <><Icon name="refresh" size={15} />Refaire l’examen</> : <>Commencer l’examen<Icon name="arrow" size={15} /></>}
            </Button>}
      </article>;
    })}</div>
  </section>;
}

/** Page d’un passage : les 4 épreuves avec leur état, l’épreuve suivante à lancer, puis le bilan. */
export function MockExamRunPage({ id }: { id: string }) {
  const router = useRouter();
  const [run, setRun] = useState<MockRun | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => api<MockRun>(`mock-exam-runs/${id}/`).then(setRun).catch(e => setError((e as Error).message)), [id]);
  useEffect(() => { exitFullscreen(); load(); }, [load]);

  async function startStep(key: MockStepKey) {
    setBusy(true); setError("");
    try {
      if (key === "listening" || key === "reading") {
        enterFullscreen();
        const opened = await api<{ attempt_id: string }>(`mock-exam-runs/${id}/qcm/${key}/`, "POST");
        router.push(`/etudiant/${key === "listening" ? "ecoute" : "lecture"}/${opened.attempt_id}`);
      } else if (key === "writing") {
        enterFullscreen();
        await api(`mock-exam-runs/${id}/writing/`, "POST");
        router.push(`${MOCK_BASE}/${id}/redaction`);
      } else router.push(`${MOCK_BASE}/${id}/oral`);
    } catch (e) { exitFullscreen(); setError((e as Error).message); setBusy(false); }
  }

  if (error && !run) return <div className="empty-block"><h2>Examen introuvable</h2><p>{error}</p><Link className="button button-primary tile-link" href="/etudiant/examens-blancs">Revenir aux examens</Link></div>;
  if (!run) return <p className="student-hint">Chargement de l’examen…</p>;
  const next = run.steps.find(step => step.key === run.current);
  const doneCount = run.steps.filter(step => step.status === "done").length;

  return <>
    <div className="home-top home-top-single">
      <section className="hero-card" aria-labelledby="examen-titre">
        <span className="hero-chip-row"><span className="hero-chip">Examen TCF</span><span>{run.finished_at ? "Terminé" : `${doneCount} épreuve${doneCount > 1 ? "s" : ""} sur 4 terminée${doneCount > 1 ? "s" : ""}`}</span></span>
        <h1 id="examen-titre" className="epreuve-title"><Icon name="exam" size={30} />{run.title}</h1>
        <p>Les 4 épreuves dans l’ordre du test, chacune avec son chrono. Aucune correction pendant l’examen : votre bilan complet s’affiche à la fin.</p>
      </section>
    </div>

    <ol className="mock-steps" aria-label="Épreuves de l’examen">{run.steps.map((step, index) => <li key={step.key} className="mock-step" data-status={step.status} aria-current={step.key === run.current ? "step" : undefined}>
      <span className="mock-step-number" aria-hidden="true">{step.status === "done" ? <Icon name="check" size={16} /> : index + 1}</span>
      <span className="mock-step-text">
        <strong>{step.name} <small>· {step.subtitle}</small></strong>
        <small>{step.detail}</small>
      </span>
      <span className="mock-step-status">{STATUS[step.status]}</span>
    </li>)}</ol>

    {error && <p role="alert">{error}</p>}
    {next && <section className="student-card mock-next" aria-labelledby="suivante">
      <span className="mock-next-icon" aria-hidden="true"><Icon name={ICONS[next.key]} size={26} /></span>
      <div>
        <small>{next.status === "running" ? "Épreuve en cours" : run.steps[0]!.key === next.key ? "Première épreuve" : "Épreuve suivante"}</small>
        <h2 id="suivante">{next.name} · {next.subtitle}</h2>
        <p>{next.detail}. {RULES[next.key]}</p>
      </div>
      <div className="mock-next-actions">
        <Button loading={busy} onClick={() => startStep(next.key)}>{next.status === "running" ? "Reprendre l’épreuve" : "Commencer l’épreuve"}<Icon name="arrow" size={15} /></Button>
        <Link className="button button-secondary tile-link" href="/etudiant/examens-blancs">Continuer plus tard</Link>
      </div>
    </section>}

    {run.bilan && <Bilan bilan={run.bilan} onCorrected={load} />}
  </>;
}

const RULES: Record<MockStepKey, string> = {
  listening: "Le chrono démarre dès que vous commencez et continue même si vous fermez la page.",
  reading: "Le chrono démarre dès que vous commencez et continue même si vous fermez la page.",
  writing: "Un seul chrono de 60 minutes pour les trois tâches : gérez votre temps entre elles.",
  speaking: "Les trois tâches s’enchaînent avec l’examinateur. Prévoyez un endroit calme et votre micro.",
};

/** Bilan : niveau global, puis chaque épreuve avec son niveau et le lien vers sa correction détaillée. */
function Bilan({ bilan, onCorrected }: { bilan: MockBilan; onCorrected: () => void }) {
  // Les textes et l’oral se corrigent à l’ouverture du bilan, un par un.
  const [correcting, setCorrecting] = useState(0);
  const [problem, setProblem] = useState("");
  const started = useRef(false);
  useEffect(() => {
    if (!bilan.pending.length || started.current) return;
    started.current = true;
    (async () => {
      let left = bilan.pending.length;
      setCorrecting(left);
      for (const item of bilan.pending) {
        const path = item.kind === "writing" ? `tasks/writing/corrections/${item.id}/stream/` : `speaking/sessions/${item.id}/correction/`;
        try { await streamLines(path, line => { if (typeof line.error === "string") setProblem(line.error); }); }
        catch (e) { setProblem((e as Error).message); }
        setCorrecting(--left);
      }
      onCorrected();
    })();
  }, [bilan.pending, onCorrected]);

  const rows: { key: MockStepKey; name: string; level?: string; detail: string; tasks?: MockTask[]; href?: string | null }[] = [
    { key: "listening", name: "Écoute", level: bilan.listening.level, detail: qcmDetail(bilan.listening), href: bilan.listening.attempt_id && `/etudiant/ecoute/${bilan.listening.attempt_id}` },
    { key: "reading", name: "Lecture", level: bilan.reading.level, detail: qcmDetail(bilan.reading), href: bilan.reading.attempt_id && `/etudiant/lecture/${bilan.reading.attempt_id}` },
    { key: "writing", name: "Rédaction", level: bilan.writing.level, detail: bilan.writing.score != null ? `${bilan.writing.score}/20 en moyenne · NCLC ${bilan.writing.nclc}` : "Correction en cours…", tasks: bilan.writing.tasks },
    { key: "speaking", name: "Oral", level: bilan.speaking.level, detail: bilan.speaking.score != null ? `${bilan.speaking.score}/20 en moyenne · NCLC ${bilan.speaking.nclc}` : "Correction en cours…", tasks: bilan.speaking.tasks },
  ];
  return <section aria-labelledby="bilan" className="mock-bilan">
    <div className="section-title"><h2 id="bilan">Votre bilan</h2><span className="section-note">Estimation non officielle</span></div>
    <div className="student-card mock-overall">
      <span className="mock-overall-level" aria-hidden="true">{bilan.overall ?? "…"}</span>
      <div>
        <h3>{bilan.overall ? `Niveau global estimé : ${bilan.overall}` : "Correction de vos textes et de votre oral…"}</h3>
        <p>{bilan.overall
          ? "Moyenne des niveaux de vos 4 épreuves. Ouvrez chaque correction pour voir le détail de vos réponses."
          : `Encore ${correcting || bilan.pending.length} correction${(correcting || bilan.pending.length) > 1 ? "s" : ""} à calculer : restez sur cette page, cela prend quelques instants.`}</p>
        {problem && <p role="alert" className="examiner-error">{problem} Rechargez la page pour relancer la correction.</p>}
      </div>
    </div>
    <ul className="mock-results">{rows.map(row => <li key={row.key} className="student-card">
      <div className="mock-result-head">
        <span className="mock-part-icon" aria-hidden="true"><Icon name={ICONS[row.key]} size={16} /></span>
        <h3>{row.name}</h3>
        <span className="mock-level">{row.level ?? "…"}</span>
      </div>
      <p className="student-hint">{row.detail}</p>
      {row.href && <Link className="mock-link" href={row.href}>Voir la correction<Icon name="arrow" size={13} /></Link>}
      {row.tasks && <ul className="mock-task-results">{row.tasks.map(task => <li key={task.number}>
        <span>Tâche {task.number} · {task.title}</span>
        {task.skipped || !task.id
          ? <small>Non passée · 0/20</small>
          : task.pending
            ? <small>Correction en cours…</small>
            : <Link className="mock-link" href={`${row.key === "writing" ? "/etudiant/expression-ecrite" : "/etudiant/expression-orale"}/correction/${task.id}`}>{task.level} · {task.score}/20<Icon name="arrow" size={13} /></Link>}
      </li>)}</ul>}
    </li>)}</ul>
  </section>;
}

function qcmDetail(part: MockBilan["listening"]) {
  if (!part.questions) return "Épreuve non passée · 0 point";
  return `${part.correct}/${part.questions} bonnes réponses · ${part.score}/${part.max_score} points${part.nclc ? ` · NCLC ${part.nclc}` : ""}`;
}
