"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/primitives";
import { api, type Exam, type Attempt } from "../../lib/student-api";

export default function CataloguePage() {
  const [exams, setExams] = useState<Exam[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const router = useRouter();
  useEffect(() => { api<{results: Exam[]}>("exams/").then(data => setExams(data.results.filter(e => e.skill === "reading"))).catch(e => setError(e.message)); }, []);
  useEffect(() => { api<{results: Attempt[]}>("attempts/").then(data => setAttempts(data.results)).catch(() => {}); }, []);
  async function start(id: string) {
    setBusy(true); setError("");
    try { const attempt = await api<{id: string}>(`exams/${id}/attempts/`, "POST"); router.push(`/etudiant/lecture/${attempt.id}`); }
    catch (e) { setError((e as Error).message); setBusy(false); }
  }
  return <><p className="student-eyebrow">Un texte. Une étape. Des progrès.</p><h1>Votre prochain entraînement</h1>
    <p>Choisissez une lecture, répondez aux questions puis prenez le temps de comprendre le corrigé. Entraînements non officiels.</p>
    <p><Link href="/etudiant/compte">Se connecter ou vérifier mon adresse</Link></p>
    {error && <p role="alert">{error}</p>}
    {attempts.length > 0 && <section className="student-card"><h2>Retrouver mes lectures</h2><ul>{attempts.map((attempt, index) => <li key={attempt.id}><Link href={`/etudiant/lecture/${attempt.id}`}>Lecture {index + 1} · {attempt.status === "submitted" ? "Voir mon corrigé" : attempt.status === "expired" ? "Temps écoulé" : "Reprendre"}</Link></li>)}</ul></section>}
    {!exams && !error && <p role="status">Recherche des exercices…</p>}
    {exams?.length === 0 && <section className="student-card"><h2>Les premières lectures se préparent</h2><p>Les exercices apparaîtront ici après leur relecture pédagogique. Revenez bientôt.</p></section>}
    <div className="student-grid">{exams?.map(exam => <article className="student-card" key={exam.id}>
      <p className="student-eyebrow">Compréhension écrite</p><h2>{exam.title}</h2><p>{exam.description}</p>
      <p>{exam.question_count} questions · {Math.ceil(exam.duration_seconds / 60)} minutes</p>
      <Button disabled={busy} onClick={() => start(exam.id)}>Commencer cet exercice</Button>
    </article>)}</div>
  </>;
}
