"use client";
/** Séries publiées d’une épreuve : filtre par type et démarrage d’une tentative. */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/primitives";
import { Icon } from "../../components/app-shell/icons";
import { api, type Exam } from "../../lib/student-api";

type Skill = "reading" | "listening";
type Mode = "all" | "training" | "simulation";

export function Catalogue({ skill, mode: fixedMode, title = "Vos séries", emptyText }: { skill?: Skill; mode?: Exclude<Mode, "all">; title?: string; emptyText?: string }) {
  const [mode, setMode] = useState<Mode>(fixedMode ?? "all");
  const [exams, setExams] = useState<Exam[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [offset, setOffset] = useState(0);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    let active = true;
    const filter = skill ? `skill=${skill}&` : "";
    api<{ results: Exam[]; next: string | null }>(`exams/?${filter}limit=50&offset=${offset}`).then(data => {
      if (active) { setExams(previous => offset ? [...(previous ?? []), ...data.results] : data.results); setMore(Boolean(data.next)); }
    }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [offset, skill]);
  async function start(exam: Exam) {
    setBusy(true); setError("");
    try { const attempt = await api<{ id: string }>(`exams/${exam.id}/attempts/`, "POST"); router.push(`/etudiant/${exam.skill === "listening" ? "ecoute" : "lecture"}/${attempt.id}`); }
    catch (e) { setError((e as Error).message); setBusy(false); }
  }
  const visible = exams?.filter(exam => mode === "all" || exam.mode === mode);
  return <section aria-labelledby="series" className="series">
    <div className="series-head">
      <h2 id="series">{title}</h2>
      {!fixedMode && <div className="series-filter" role="group" aria-label="Type de série">
        {([["all", "Toutes"], ["training", "Entraînements"], ["simulation", "Simulations"]] as const).map(([value, label]) =>
          <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)}>{label}</button>)}
      </div>}
    </div>
    {error && <p role="alert">{error}</p>}
    {!exams && !error && <p className="student-hint">Recherche des séries…</p>}
    {visible?.length === 0 && <div className="empty-block"><h3>Les prochaines séries se préparent</h3><p>{emptyText ?? "Les séries apparaîtront ici après leur relecture pédagogique. Revenez bientôt."}</p></div>}
    <div className="series-grid">{visible?.map(exam => <article className="series-card" key={exam.id}>
      <div className="series-card-top">
        <span className="series-kind" data-mode={exam.mode}>{exam.mode === "simulation" ? "Simulation complète" : "Entraînement court"}</span>
        <span className="series-version">Version {exam.version}</span>
      </div>
      <h3>{exam.title}</h3>
      <p>{exam.description}</p>
      <div className="pill-row"><span className="pill"><Icon name="exam" size={13} />{exam.question_count} {exam.question_count > 1 ? "questions" : "question"}</span><span className="pill"><Icon name="clock" size={13} />{Math.ceil(exam.duration_seconds / 60)} min</span></div>
      <Button disabled={busy} onClick={() => start(exam)}>Démarrer la série<Icon name="arrow" size={15} /></Button>
    </article>)}</div>
    {more && <p><Button variant="secondary" loading={loading} onClick={() => { setError(""); setLoading(true); setOffset(exams?.length ?? 0); }}>Voir d’autres séries</Button></p>}
  </section>;
}
