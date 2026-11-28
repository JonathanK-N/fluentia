"use client";
/** Séries publiées d’une épreuve, au format de l’examen (simulations seulement), puis page de présentation avant la séance. */
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/primitives";
import { Icon } from "../../components/app-shell/icons";
import { api, type Exam, type FinishedAttempt } from "../../lib/student-api";
import { useSession } from "../../lib/session";
import { attemptHref } from "./content";

type Skill = "reading" | "listening";
export function Catalogue({ skill, title = "Vos séries", emptyText }: { skill?: Skill; title?: string; emptyText?: string }) {
  const [exams, setExams] = useState<Exam[] | null>(null);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  // Dernière séance terminée de chaque série : « Reprendre la série » et lien vers sa correction.
  const { profile } = useSession();
  const [done, setDone] = useState<Record<string, FinishedAttempt>>({});
  useEffect(() => {
    if (!profile) { setDone({}); return; }
    let active = true;
    api<{ results: FinishedAttempt[] }>("attempts/?latest=1&limit=100")
      .then(data => { if (active) setDone(Object.fromEntries(data.results.map(attempt => [attempt.exam_id, attempt]))); })
      .catch(() => { /* sans historique, le catalogue reste utilisable */ });
    return () => { active = false; };
  }, [profile]);
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
    <div className="series-grid">{visible?.map(exam => { const last = done[exam.id]; return <article className="series-card" data-done={last ? "true" : undefined} key={exam.id}>
      <div className="series-card-top">
        <span className="series-kind" data-mode={exam.mode}>{exam.mode === "simulation" ? "Simulation complète" : "Entraînement court"}</span>
        {last && <span className="series-done"><Icon name="check" size={12} />Déjà faite</span>}
      </div>
      <h3>{exam.title}</h3>
      <p>{exam.description}</p>
      <div className="pill-row"><span className="pill"><Icon name="exam" size={13} />{exam.question_count} {exam.question_count > 1 ? "questions" : "question"}</span><span className="pill"><Icon name="clock" size={13} />{Math.ceil(exam.duration_seconds / 60)} min</span>{exam.total_points > exam.question_count && <span className="pill"><Icon name="trophy" size={13} />{exam.total_points} points</span>}</div>
      {last && <Link className="series-last" href={attemptHref(last)}>
        <span>Ma dernière correction</span>
        <small>{score(last)} · {new Date(last.submitted_at).toLocaleDateString("fr-CA", { day: "numeric", month: "long" })}</small>
        <Icon name="arrow" size={13} />
      </Link>}
      <Link className={`button tile-link ${last ? "button-again" : "button-primary"}`} href={`/etudiant/${exam.skill === "listening" ? "comprehension-orale" : "comprehension-ecrite"}/${exam.id}`}>{last ? <><Icon name="refresh" size={15} />Reprendre la série</> : <>Démarrer la série<Icon name="arrow" size={15} /></>}<span className="sr-only"> — {exam.title}</span></Link>
    </article>; })}</div>
    {more && <p><Button variant="secondary" loading={loading} onClick={() => { setError(""); setLoading(true); setOffset(exams?.length ?? 0); }}>Voir d’autres séries</Button></p>}
  </section>;
}

// Score de la dernière séance : points si la série a un barème pondéré, sinon bonnes réponses.
function score(attempt: FinishedAttempt) {
  return attempt.max_score && attempt.max_score !== attempt.question_count
    ? `${attempt.score ?? 0}/${attempt.max_score} points`
    : `${attempt.correct_count}/${attempt.question_count} bonnes réponses`;
}
