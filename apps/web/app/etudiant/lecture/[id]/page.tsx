"use client";
import { useEffect, useRef, useState, use, useCallback } from "react";
import Link from "next/link";
import { Button } from "../../../../components/ui/primitives";
import { api, type Attempt, type Results } from "../../../../lib/student-api";

export default function ReadingPage({params}: {params: Promise<{id: string}>}) {
  const {id} = use(params);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const pending = useRef(false);
  const clockOffset = useRef(0);
  const load = useCallback(async () => {
    const data = await api<Attempt>(`attempts/${id}/`);
    clockOffset.current = Date.parse(data.server_now) - Date.now();
    setAttempt(data);
    setAnswers(Object.fromEntries(data.answers.map(a => [a.question_id, a.choice_id])));
    if (data.status === "submitted") setResults(await api<Results>(`attempts/${id}/results/`));
  }, [id]);
  useEffect(() => { load().catch(e => setError(e.message)); }, [load]);
  useEffect(() => {
    if (!attempt || attempt.status !== "active") return;
    const tick = () => {
      const value = Math.max(0, Math.ceil((Date.parse(attempt.expires_at) - Date.now() - clockOffset.current) / 1000));
      setRemaining(value);
      if (!value) load().catch(e => setError(e.message));
    };
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [attempt, load]);
  useEffect(() => {
    const before = (event: BeforeUnloadEvent) => { if (pending.current) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", before); return () => window.removeEventListener("beforeunload", before);
  }, []);
  async function save(question: string, choice: string) {
    if (pending.current) return;
    const previous = answers[question];
    setAnswers(values => ({...values, [question]: choice}));
    pending.current = true; setBusy(true); setError(""); setMessage("Enregistrement en cours…");
    try {
      await api(`attempts/${id}/answers/`, "PUT", {question_id: question, choice_id: choice});
      setAnswers(previous => ({...previous, [question]: choice})); setMessage("Réponse enregistrée. Vous pouvez reprendre depuis cet appareil ou un autre.");
    } catch (e) {
      setAnswers(values => { const restored = {...values}; if (previous) restored[question] = previous; else delete restored[question]; return restored; });
      setError((e as Error).message); setMessage("Réponse non enregistrée. Sélectionnez de nouveau votre choix pour réessayer.");
    }
    finally { pending.current = false; setBusy(false); }
  }
  async function submit() {
    setBusy(true); setError("");
    try { await api(`attempts/${id}/submit/`, "POST"); setConfirm(false); await load(); }
    catch (e) { setError((e as Error).message); await load().catch(() => {}); }
    finally { setBusy(false); }
  }
  return <>
    <p className="student-eyebrow">Compréhension écrite · Entraînement non officiel</p>
    <h1>{results ? "Prenons le temps de comprendre" : "À vous de lire"}</h1>
    <p><Link href="/etudiant">Retour aux exercices</Link></p>
    {error && <p role="alert">{error}</p>}
    {!attempt && !error && <p role="status">Chargement de votre lecture…</p>}
    {attempt?.status === "expired" && <section className="student-card"><h2>Le temps est écoulé</h2><p>Les réponses enregistrées sont conservées. Cette tentative n’a pas été soumise et aucun score n’a été calculé. Vous pouvez recommencer depuis le catalogue.</p></section>}
    {results && <section className="student-card"><h2>Votre résultat</h2><p className="student-score">{results.correct_count} / {results.question_count}</p><p>{results.disclaimer}</p>
      {results.details.map((detail, index) => <article key={detail.question_id} className="student-correction"><h3>Question {index + 1}</h3>
        <p>{detail.statement}</p><p>Votre réponse : {detail.selected_label ?? "Sans réponse"}</p>
        <p>Réponse attendue : {detail.correct_label}</p><p>{detail.explanation}</p></article>)}
    </section>}
    {attempt?.status === "active" && <>
      <div className="student-session"><p>Temps indicatif restant : {Math.floor(remaining / 60)} min {remaining % 60} s</p><p>{Object.keys(answers).length} / {attempt.questions?.length} réponses {busy ? "(enregistrement en cours)" : "enregistrées"}</p></div>
      <p>Le délai est contrôlé par le serveur. Chaque choix confirmé est enregistré immédiatement.</p>
      <p role="status" className="student-save-status">{message}</p>
      {attempt.questions?.map((question, index) => <section className="student-card" key={question.id}>
        <h2>Lecture {index + 1}</h2><p className="student-passage">{question.reading_passage}</p>
        <fieldset disabled={remaining === 0} aria-busy={busy}><legend>{question.statement}</legend>
          {question.choices.map(choice => <label className="student-choice" key={choice.id}>
            <input type="radio" name={question.id} value={choice.id} disabled={busy && answers[question.id] !== choice.id} checked={answers[question.id] === choice.id} onChange={() => save(question.id, choice.id)} />{choice.label}
          </label>)}
        </fieldset>
      </section>)}
      {!confirm ? <Button disabled={busy || remaining === 0} onClick={() => setConfirm(true)}>Terminer et vérifier mes réponses</Button> :
        <section className="student-card" aria-label="Confirmation de soumission"><h2>Prêt à découvrir le corrigé ?</h2><p>{Object.keys(answers).length} réponses enregistrées. Les questions sans réponse comptent pour zéro. Après la soumission, les réponses seront définitives.</p>
          <Button loading={busy} onClick={submit}>Confirmer la soumission</Button> <Button variant="secondary" disabled={busy} onClick={() => setConfirm(false)}>Continuer ma lecture</Button>
        </section>}
    </>}
  </>;
}
