"use client";
/** Séries publiées d’une épreuve, au format de l’examen (simulations seulement), puis page de présentation avant la séance. */
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/primitives";
import { Icon } from "../../components/app-shell/icons";
import { api, type Exam } from "../../lib/student-api";

type Skill = "reading" | "listening";
export function Catalogue({ skill, title = "Vos séries", emptyText }: { skill?: Skill; title?: string; emptyText?: string }) {
  const [exams, setExams] = useState<Exam[] | null>(null);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const filter = skill ? `skill=${skill}&` : "";
    api<{ results: Exam[]; next: string | null }>(`exams/?${filter}limit=50&offset=${offset}`).then(data => {
      if (active) { setExams(previous => offset ? [...(previous ?? []), ...data.results] : data.results); setMore(Boolean(data.next)); }
    }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [offset, skill]);
  // Les séries d’entraînement ne sont plus proposées : seulement les simulations au format de l’examen.
  const visible = exams?.filter(exam => exam.mode === "simulation");
  return <section aria-labelledby="series" className="series">
    <div className="series-head">
      <h2 id="series">{title}</h2>
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
      <div className="pill-row"><span className="pill"><Icon name="exam" size={13} />{exam.question_count} {exam.question_count > 1 ? "questions" : "question"}</span><span className="pill"><Icon name="clock" size={13} />{Math.ceil(exam.duration_seconds / 60)} min</span>{exam.total_points > exam.question_count && <span className="pill"><Icon name="trophy" size={13} />{exam.total_points} points</span>}</div>
      <Link className="button button-primary tile-link" href={`/etudiant/${exam.skill === "listening" ? "comprehension-orale" : "comprehension-ecrite"}/${exam.id}`}>Démarrer la série<span className="sr-only"> — {exam.title}</span><Icon name="arrow" size={15} /></Link>
    </article>)}</div>
    {more && <p><Button variant="secondary" loading={loading} onClick={() => { setError(""); setLoading(true); setOffset(exams?.length ?? 0); }}>Voir d’autres séries</Button></p>}
  </section>;
}
