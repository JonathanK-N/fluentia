"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/primitives";
import { api, type Exam, type AttemptSummary } from "../../lib/student-api";

export default function CataloguePage() {
  const [exams, setExams] = useState<Exam[] | null>(null);
  const [skill, setSkill] = useState("reading");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [examOffset, setExamOffset] = useState(0);
  const [attemptOffset, setAttemptOffset] = useState(0);
  const [moreExams, setMoreExams] = useState(false);
  const [moreAttempts, setMoreAttempts] = useState(false);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [examRequest, setExamRequest] = useState(0);
  const [attemptRequest, setAttemptRequest] = useState(0);
  const router = useRouter();
  useEffect(() => {
    let active = true;
    api<{results: Exam[]; next: string | null}>(`exams/?skill=${skill}&limit=50&offset=${examOffset}`).then(data => {
      if (active) {setExams(previous => examOffset ? [...(previous ?? []), ...data.results] : data.results); setMoreExams(Boolean(data.next));}
    }).catch(e => {if (active) setError(e.message);}).finally(() => {if (active) setLoadingExams(false);});
    return () => {active = false;};
  }, [examOffset, examRequest, skill]);
  useEffect(() => {
    let active = true;
    api<{results: AttemptSummary[]; next: string | null}>(`attempts/?limit=50&offset=${attemptOffset}`).then(data => {
      if (active) {setAttempts(previous => attemptOffset ? [...previous, ...data.results] : data.results); setMoreAttempts(Boolean(data.next));}
    }).catch(e => {if (active && e.status !== 403) setError(e.message);}).finally(() => {if (active) setLoadingAttempts(false);});
    return () => {active = false;};
  }, [attemptOffset, attemptRequest]);
  async function start(id: string) {
    setBusy(true); setError("");
    try { const attempt = await api<{id: string}>(`exams/${id}/attempts/`, "POST"); router.push(`/etudiant/${skill === "listening" ? "ecoute" : "lecture"}/${attempt.id}`); }
    catch (e) { setError((e as Error).message); setBusy(false); }
  }
  return <><p className="student-eyebrow">Un texte. Une étape. Des progrès.</p><h1>Votre prochain entraînement</h1>
    <p>Choisissez une lecture ou une écoute, puis prenez le temps de comprendre le corrigé. Entraînements et simulations non officiels.</p>
    <div className="student-nav" aria-label="Compétences"><Button variant="secondary" disabled={skill === "reading" || busy} onClick={() => {setSkill("reading"); setExamOffset(0); setExams(null);}}>Compréhension écrite</Button><Button variant="secondary" disabled={skill === "listening" || busy} onClick={() => {setSkill("listening"); setExamOffset(0); setExams(null);}}>Compréhension orale</Button></div>
    <p><Link href="/etudiant/compte">Se connecter ou vérifier mon adresse</Link></p>
    {error && <p role="alert">{error}</p>}
    {attempts.length > 0 && <section className="student-card"><h2>Retrouver mes activités</h2><ul>{attempts.map(attempt => <li key={attempt.id}><Link href={`/etudiant/${attempt.skill === "listening" ? "ecoute" : "lecture"}/${attempt.id}`}>{attempt.exam_title} · {attempt.status === "submitted" ? "Voir mon corrigé" : attempt.status === "expired" ? "Temps écoulé" : "Reprendre"}</Link></li>)}</ul>{moreAttempts && <Button variant="secondary" loading={loadingAttempts} onClick={() => {setError(""); setLoadingAttempts(true); setAttemptOffset(attempts.length); setAttemptRequest(value => value + 1);}}>Afficher mes activités précédentes</Button>}</section>}
    {!exams && !error && <p role="status">Recherche des exercices…</p>}
    {exams?.length === 0 && <section className="student-card"><h2>Les premières lectures se préparent</h2><p>Les exercices apparaîtront ici après leur relecture pédagogique. Revenez bientôt.</p></section>}
    <div className="student-grid">{exams?.map(exam => <article className="student-card" key={exam.id}>
      <p className="student-eyebrow">{exam.skill === "listening" ? "Compréhension orale" : "Compréhension écrite"} · {exam.mode === "simulation" ? "Simulation" : "Entraînement"}</p><h2>{exam.title}</h2><p>{exam.description}</p>
      <p>Version {exam.version} · {exam.question_count} questions · {Math.ceil(exam.duration_seconds / 60)} minutes</p>
      <Button disabled={busy} onClick={() => start(exam.id)}>Commencer cet exercice</Button>
    </article>)}</div>
    {moreExams && <Button variant="secondary" loading={loadingExams} onClick={() => {setError(""); setLoadingExams(true); setExamOffset(exams?.length ?? 0); setExamRequest(value => value + 1);}}>Voir d’autres exercices</Button>}
  </>;
}
