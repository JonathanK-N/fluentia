"use client";
import { useEffect, useRef, useState, use, useCallback } from "react";
import Link from "next/link";
import { Button } from "../../../../components/ui/primitives";
import { api, type Attempt, type Results } from "../../../../lib/student-api";
import { AudioPlayer } from "../../../../components/student/audio-player";
import { Icon } from "../../../../components/app-shell/icons";

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
  const loadVersion = useRef(0);
  const answerVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    const answerSnapshot = answerVersion.current;
    const data = await api<Attempt>(`attempts/${id}/`);
    if (version !== loadVersion.current) return;
    clockOffset.current = Date.parse(data.server_now) - Date.now();
    setAttempt(data);
    if (!pending.current && answerSnapshot === answerVersion.current) setAnswers(Object.fromEntries(data.answers.map(a => [a.question_id, a.choice_id])));
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
    answerVersion.current += 1;
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
    finally { answerVersion.current += 1; pending.current = false; setBusy(false); }
  }
  async function submit() {
    setBusy(true); setError("");
    try { await api(`attempts/${id}/submit/`, "POST"); setConfirm(false); await load(); }
    catch (e) { setError((e as Error).message); await load().catch(() => {}); }
    finally { setBusy(false); }
  }
  const shown = attempt?.questions?.filter(q => attempt.skill !== "listening" || attempt.mode !== "simulation" || !["past", "locked"].includes(q.audio_state)) ?? [];
  const answeredCount = Object.keys(answers).length;
  const total = attempt?.questions?.length ?? 0;
  return <>
    <div className="page-head"><div>
      <p className="student-eyebrow">{attempt?.skill === "listening" ? "Écoute" : "Lecture"} · {attempt?.mode === "simulation" ? "Simulation non officielle" : "Entraînement non officiel"}</p>
      <h2 className="page-title">{results ? "Prenons le temps de comprendre" : attempt?.skill === "listening" ? "À vous d’écouter" : "À vous de lire"}</h2>
      {attempt?.exam_title && <p>{attempt.exam_title}</p>}
    </div><p><Link href="/etudiant">Retour aux exercices</Link></p></div>
    {error && <p role="alert">{error}</p>}
    {!attempt && !error && <p className="student-hint">Chargement de votre lecture…</p>}
    {attempt?.status === "expired" && <section className="student-card"><h2>Le temps est écoulé</h2><p>Les réponses enregistrées sont conservées. Cette tentative n’a pas été soumise et aucun score n’a été calculé. Vous pouvez recommencer depuis le catalogue.</p></section>}
    {results && <>
      <section className="student-card result-hero" aria-labelledby="resultat">
        <div className="score-ring" style={{ ["--value" as string]: results.percentage }}><p className="student-score">{results.correct_count} / {results.question_count}</p></div>
        <div><h2 id="resultat">Votre résultat</h2><p><strong>{results.percentage} %</strong> de réponses correctes.</p><p>{results.disclaimer}</p>
          <div className="student-nav" style={{ margin: 0 }}><Link className="button button-secondary tile-link" href="/etudiant/progression">Voir mon évolution</Link></div></div>
      </section>
      <section className="student-card" aria-labelledby="corrige"><h2 id="corrige">Correction détaillée</h2>
        {results.details.map((detail, index) => { const ok = detail.selected_choice_id === detail.correct_choice_id; return <article key={detail.question_id} className="student-correction">
          <div className="pill-row" style={{ justifyContent: "space-between", alignItems: "center" }}><h3 style={{ margin: 0 }}>Question {index + 1}</h3><span className={`pill ${ok ? "pill-success" : "pill-warning"}`}>{ok ? "Correct" : detail.selected_label ? "À revoir" : "Sans réponse"}</span></div>
          <p style={{ color: "var(--text)", marginTop: ".5rem" }}>{detail.statement}</p><p>Votre réponse : {detail.selected_label ?? "Sans réponse"}</p>
          <p>Réponse attendue : {detail.correct_label}</p><p>{detail.explanation}</p>{detail.transcript && <details><summary>Transcription du document</summary><p>{detail.transcript}</p></details>}</article>; })}
      </section>
    </>}
    {attempt?.status === "active" && <div className="attempt-layout">
      <div>
        <div className="student-session">
          <p className="session-timer"><Icon name="clock" size={16} />Temps indicatif restant : {Math.floor(remaining / 60)} min {remaining % 60} s</p>
          <span className="session-progress" aria-hidden="true"><span style={{ width: `${total ? answeredCount / total * 100 : 0}%` }} /></span>
          <p>{answeredCount} / {attempt.questions?.length} réponses {busy ? "(enregistrement en cours)" : "enregistrées"}</p>
        </div>
        <p className="student-hint">Le délai est contrôlé par le serveur. Chaque choix confirmé est enregistré immédiatement.</p>
        <p role="status" className="student-save-status">{message}</p>
        {shown.map((question) => <section className="student-card question-card" id={`q-${question.id}`} key={question.id}>
          <h2>{attempt.skill === "listening" ? "Document" : "Lecture"} {question.position}</h2>{question.reading_passage && <p className="student-passage">{question.reading_passage}</p>}
          {attempt.skill === "listening" && (question.audio_available ? <AudioPlayer attemptId={id} questionId={question.id} simulation={attempt.mode === "simulation"} state={question.audio_state} endsAt={question.audio_ends_at} serverOffset={clockOffset.current} refresh={load} /> : <p role="alert">Le document audio n’est pas disponible pour cette version.</p>)}
          {question.transcript && <details><summary>Consulter la transcription</summary><p>{question.transcript}</p></details>}
          <fieldset disabled={remaining === 0 || (attempt.skill === "listening" && attempt.mode === "simulation" && question.audio_state !== "ready")} aria-busy={busy}><legend>{question.statement}</legend>
            {question.choices.map(choice => <label className="student-choice" key={choice.id}>
              <input type="radio" name={question.id} value={choice.id} disabled={busy && answers[question.id] !== choice.id} checked={answers[question.id] === choice.id} onChange={() => save(question.id, choice.id)} />{choice.label}
            </label>)}
          </fieldset>
        </section>)}
        {!confirm ? <Button disabled={busy || remaining === 0} onClick={() => setConfirm(true)}>Terminer et vérifier mes réponses</Button> :
          <section className="student-card" aria-label="Confirmation de soumission"><h2>Prêt à découvrir le corrigé ?</h2><p>{answeredCount} réponses enregistrées. Les questions sans réponse comptent pour zéro. Après la soumission, les réponses seront définitives.</p>
            <div className="student-nav" style={{ margin: 0 }}><Button loading={busy} onClick={submit}>Confirmer la soumission</Button> <Button variant="secondary" disabled={busy} onClick={() => setConfirm(false)}>Continuer ma lecture</Button></div>
          </section>}
      </div>
      <aside className="attempt-aside" aria-label="Suivi de la tentative">
        <nav className="student-card map-card" aria-label="Plan des questions">
          <p className="student-eyebrow">Plan des questions</p>
          <p className="student-hint" style={{ margin: 0 }}>{answeredCount} sur {total} répondues</p>
          <ul className="question-map">{shown.map(question => <li key={question.id}><a href={`#q-${question.id}`} data-answered={answers[question.id] ? "" : undefined} aria-label={`Aller au numéro ${question.position}${answers[question.id] ? ", répondu" : ""}`}>{question.position}</a></li>)}</ul>
        </nav>
        <div className="student-card card-muted"><p className="student-eyebrow">Bon à savoir</p><p style={{ margin: 0 }}>{attempt.mode === "simulation" ? "En simulation, avancez sans revenir en arrière : chaque document n’est diffusé qu’une fois." : "En entraînement, prenez le temps de relire : le corrigé explique chaque réponse."}</p></div>
      </aside>
    </div>}
  </>;
}
