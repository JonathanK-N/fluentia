"use client";
/** Catalogue des versions publiées : filtre de compétence et de mode, démarrage d’une tentative. */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/primitives";
import { Icon } from "../../components/app-shell/icons";
import { api, type Exam } from "../../lib/student-api";
import { skillLabel } from "./content";

type Skill = "reading" | "listening";
type Mode = "all" | "training" | "simulation";

export function Catalogue({ skill: fixedSkill, mode: fixedMode, emptyText }: { skill?: Skill | "all"; mode?: Exclude<Mode, "all">; emptyText?: string }) {
  const [skill, setSkill] = useState<Skill | "all">(fixedSkill ?? "reading");
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
    const filter = skill === "all" ? "" : `skill=${skill}&`;
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
  function chooseSkill(value: Skill) {
    if (value === skill) return;
    setSkill(value); setOffset(0); setExams(null); setLoading(true);
  }
  const visible = exams?.filter(exam => mode === "all" || exam.mode === mode);
  return <div>
    <div className="student-nav">
      {!fixedSkill && <div className="segmented" aria-label="Compétences" role="group">
        {(["reading", "listening"] as const).map(value => <Button key={value} variant="ghost" aria-pressed={skill === value} disabled={busy} onClick={() => chooseSkill(value)}>{skillLabel(value)}</Button>)}
      </div>}
      {!fixedMode && <div className="segmented" aria-label="Type d’exercice" role="group">
        {([["all", "Tous"], ["training", "Entraînements"], ["simulation", "Simulations"]] as const).map(([value, label]) => <Button key={value} variant="ghost" aria-pressed={mode === value} onClick={() => setMode(value)}>{label}</Button>)}
      </div>}
    </div>
    {error && <p role="alert">{error}</p>}
    {!exams && !error && <p className="student-hint">Recherche des exercices…</p>}
    {visible?.length === 0 && <div className="empty-block"><h3>Les prochains exercices se préparent</h3><p>{emptyText ?? "Les exercices apparaîtront ici après leur relecture pédagogique. Revenez bientôt."}</p></div>}
    <div className="student-grid">{visible?.map(exam => <article className="student-card exam-card" key={exam.id}>
      <div className="pill-row"><span className="pill">{skillLabel(exam.skill)}</span><span className="pill">{exam.mode === "simulation" ? "Simulation" : "Entraînement"}</span></div>
      <h3>{exam.title}</h3>
      <p>{exam.description}</p>
      <span className="exam-spacer" />
      <p className="exam-meta"><span><Icon name="exam" size={15} />{exam.question_count} questions</span><span><Icon name="clock" size={15} />{Math.ceil(exam.duration_seconds / 60)} minutes</span><span>Version {exam.version}</span></p>
      <Button disabled={busy} onClick={() => start(exam)}>Commencer cet exercice</Button>
    </article>)}</div>
    {more && <p><Button variant="secondary" loading={loading} onClick={() => { setError(""); setLoading(true); setOffset(exams?.length ?? 0); }}>Voir d’autres exercices</Button></p>}
  </div>;
}
