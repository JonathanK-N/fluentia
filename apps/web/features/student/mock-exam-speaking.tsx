"use client";
/** Oral de l’Examen TCF : les trois tâches s’enchaînent avec l’examinateur, sans correction avant le bilan. */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/primitives";
import { Icon } from "../../components/app-shell/icons";
import { api, type MockRun } from "../../lib/student-api";
import { formatDuration, type SpeakingTask } from "./content";
import { ExaminerSession } from "./examiner-session";
import { MOCK_BASE } from "./mock-exam";

type OralTask = { number: number; status: "done" | "skipped" | "todo"; task: SpeakingTask };
type OralData = { title: string; examiner: string; tasks: OralTask[]; finished: boolean };

export function MockExamSpeaking({ run }: { run: string }) {
  const router = useRouter();
  const [data, setData] = useState<OralData | null>(null);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);
  const load = useCallback(async () => {
    try {
      const value = await api<OralData>(`mock-exam-runs/${run}/speaking/`);
      // Trois tâches faites (ou passées) : retour à l’examen, qui affiche le bilan.
      if (value.finished || value.tasks.every(task => task.status !== "todo")) return router.replace(`${MOCK_BASE}/${run}`);
      setData(value);
    } catch (e) { setError((e as Error).message); }
  }, [router, run]);
  useEffect(() => { load(); }, [load]);

  const next = useCallback(() => { setLive(false); load(); }, [load]);
  async function skip(number: number) {
    setLive(false); setError("");
    try { await api<MockRun>(`mock-exam-runs/${run}/speaking/skip/`, "POST", { task: number }); }
    catch (e) { setError((e as Error).message); }
    load();
  }

  if (error && !data) return <div className="empty-block"><h2>Oral indisponible</h2><p>{error}</p><Link className="button button-primary tile-link" href={`${MOCK_BASE}/${run}`}>Revenir à l’examen</Link></div>;
  if (!data) return <p className="student-hint">Chargement de l’Oral…</p>;
  const current = data.tasks.find(task => task.status === "todo")!;
  const { task } = current;
  const subject = task.subjects[0]!;

  return <>
    <div className="home-top home-top-single">
      <section className="hero-card" aria-labelledby="oral-titre">
        <span className="hero-chip-row"><span className="hero-chip">{data.title}</span><span>Oral · tâche {current.number} sur 3</span></span>
        <h1 id="oral-titre" className="epreuve-title"><Icon name="mic" size={30} />{task.title}</h1>
        <p>{task.goal} Durée : {formatDuration(task.seconds)}{task.prepSeconds ? `, après ${task.prepSeconds / 60} minutes de préparation` : ""}.</p>
      </section>
    </div>

    <ol className="mock-steps" aria-label="Tâches de l’Oral">{data.tasks.map(item => <li key={item.number} className="mock-step" data-status={item.status === "todo" ? (item === current ? "running" : "todo") : "done"} aria-current={item === current ? "step" : undefined}>
      <span className="mock-step-number" aria-hidden="true">{item.status === "todo" ? item.number : <Icon name="check" size={16} />}</span>
      <span className="mock-step-text"><strong>Tâche {item.number} · {item.task.title}</strong><small>{formatDuration(item.task.seconds)}</small></span>
      <span className="mock-step-status">{item.status === "done" ? "Terminée" : item.status === "skipped" ? "Passée" : item === current ? "Maintenant" : "À venir"}</span>
    </li>)}</ol>

    {error && <p role="alert">{error}</p>}
    <section className="student-card mock-next" aria-labelledby="tache">
      <span className="mock-next-icon" aria-hidden="true"><Icon name="mic" size={26} /></span>
      <div>
        <small>Tâche {current.number} · {subject.title}</small>
        <h2 id="tache">{subject.prompt}</h2>
        <p>L’examinateur vous parle, vous écoute et vous relance. Aucune correction pendant l’examen : elle arrive avec votre bilan.</p>
      </div>
      <div className="mock-next-actions">
        <Button onClick={() => setLive(true)}><Icon name="mic" size={16} />Commencer la tâche {current.number}</Button>
        <Link className="button button-secondary tile-link" href={`${MOCK_BASE}/${run}`}>Continuer plus tard</Link>
      </div>
    </section>

    {live && <ExaminerSession key={current.number} task={task} subject={subject} examiner={data.examiner} runId={Number(run)}
      onExit={() => { setLive(false); load(); }} onDone={next} onSkip={() => skip(current.number)} />}
  </>;
}
