"use client";
import { useEffect, useRef, useState, use, useCallback } from "react";
import Link from "next/link";
import { Button } from "../../../../components/ui/primitives";
import { api, type Attempt, type Results, type SavedAnswer } from "../../../../lib/student-api";
import { useSession } from "../../../../lib/session";
import { playVerdict, primeSound } from "../../../../lib/feedback-sound";
import { AudioPlayer } from "../../../../components/student/audio-player";
import { Icon } from "../../../../components/app-shell/icons";
import { formatPoints } from "../../../../features/student/content";
import { exitFullscreen, enterFullscreen } from "../../../../lib/fullscreen";

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
  const [spoken, setSpoken] = useState("");
  const [verdicts, setVerdicts] = useState<Record<string, {correct: boolean; choice: string}>>({});
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [visited, setVisited] = useState<Record<string, true>>({});
  const [fullscreen, setFullscreen] = useState(false);
  const { profile } = useSession();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const navigated = useRef(false);
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
    if (profile?.preferences.live_correction && profile.preferences.answer_sound) primeSound();
    answerVersion.current += 1;
    const previous = answers[question];
    setAnswers(values => ({...values, [question]: choice}));
    pending.current = true; setBusy(true); setError(""); setMessage("Enregistrement en cours…");
    try {
      const saved = await api<SavedAnswer>(`attempts/${id}/answers/`, "PUT", {question_id: question, choice_id: choice});
      setAnswers(previous => ({...previous, [question]: choice}));
      const verdict = saved.correct;
      setVerdicts(values => { const next = {...values}; if (typeof verdict === "boolean") next[question] = {correct: verdict, choice}; else delete next[question]; return next; });
      if (typeof verdict === "boolean") {
        if (profile?.preferences.answer_sound) playVerdict(verdict);
        // Résultat visible par les couleurs et icônes ; annoncé seulement aux lecteurs d’écran.
        setSpoken(verdict ? "Bonne réponse." : "Mauvaise réponse.");
      } else setSpoken("");
      setMessage("Réponse enregistrée. Vous pouvez reprendre depuis cet appareil ou un autre.");
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
  const active = attempt?.status === "active";
  const found = shown.findIndex(q => q.id === currentId);
  const index = found === -1 ? Math.max(0, shown.findIndex(q => !answers[q.id])) : found;
  const question = shown[index];
  // Séance concentrée : le menu disparaît, une seule question à l’écran.
  const finished = Boolean(attempt) && !active;
  useEffect(() => {
    if (!active) return;
    document.documentElement.dataset.examFocus = "";
    return () => { delete document.documentElement.dataset.examFocus; };
  }, [active]);
  // Sortie du plein écran seulement une fois la tentative terminée, pas pendant le chargement.
  useEffect(() => { if (finished) exitFullscreen(); }, [finished]);
  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    sync(); document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  // Questions consultées : gardées sur cet appareil pour la reprise de la tentative.
  useEffect(() => {
    try { setVisited(JSON.parse(localStorage.getItem(`fluentia:consultees:${id}`) ?? "{}")); } catch { /* stockage indisponible */ }
  }, [id]);
  useEffect(() => {
    if (!active || !question) return;
    // La question affichée reste fixe : répondre ne fait pas sauter à la suivante.
    setCurrentId(question.id);
    setVisited(values => {
      if (values[question.id]) return values;
      const next = {...values, [question.id]: true as const};
      try { localStorage.setItem(`fluentia:consultees:${id}`, JSON.stringify(next)); } catch { /* stockage indisponible */ }
      return next;
    });
    if (navigated.current) { navigated.current = false; window.scrollTo({top: 0}); headingRef.current?.focus(); }
  }, [active, question, id]);
  function go(target: number) {
    const next = shown[target];
    if (!next) return;
    navigated.current = true; setConfirm(false); setCurrentId(next.id);
  }
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
        <div className="score-ring" style={{ ["--value" as string]: results.max_score ? results.score / results.max_score * 100 : 0 }}><p className="student-score">{results.score}<small>/ {results.max_score} pts</small></p></div>
        <div><h2 id="resultat">Votre résultat</h2><p><strong>{formatPoints(results.score)}</strong> sur {results.max_score} · {results.correct_count} / {results.question_count} réponses correctes ({results.percentage} %).</p><p>{results.disclaimer}</p>
          <div className="student-nav" style={{ margin: 0 }}><Link className="button button-secondary tile-link" href="/etudiant/progression">Voir mon évolution</Link></div></div>
      </section>
      <section className="student-card" aria-labelledby="corrige"><h2 id="corrige">Correction détaillée</h2>
        {results.details.map((detail, index) => { const ok = detail.selected_choice_id === detail.correct_choice_id; return <article key={detail.question_id} className="student-correction">
          <div className="pill-row" style={{ justifyContent: "space-between", alignItems: "center" }}><h3 style={{ margin: 0 }}>Question {index + 1}</h3><span className="pill-row"><span className="pill">{ok ? detail.points : 0} / {formatPoints(detail.points)}</span><span className={`pill ${ok ? "pill-success" : "pill-warning"}`}>{ok ? "Correct" : detail.selected_label ? "À revoir" : "Sans réponse"}</span></span></div>
          <p style={{ color: "var(--text)", marginTop: ".5rem" }}>{detail.statement}</p><p>Votre réponse : {detail.selected_label ?? "Sans réponse"}</p>
          <p>Réponse attendue : {detail.correct_label}</p><p>{detail.explanation}</p>{detail.transcript && <details><summary>Transcription du document</summary><p>{detail.transcript}</p></details>}</article>; })}
      </section>
    </>}
    {active && attempt && <div className="attempt-layout">
      <div>
        <div className="student-session">
          <p className="session-timer"><Icon name="clock" size={16} />Temps indicatif restant : {Math.floor(remaining / 60)} min {remaining % 60} s</p>
          <span className="session-progress" aria-hidden="true"><span style={{ width: `${total ? answeredCount / total * 100 : 0}%` }} /></span>
          <p>{answeredCount} / {total} réponses {busy ? "(enregistrement en cours)" : "enregistrées"}</p>
          <button type="button" className="session-tool" aria-pressed={fullscreen} onClick={() => fullscreen ? exitFullscreen() : enterFullscreen()}>
            <Icon name={fullscreen ? "shrink" : "expand"} size={16} />{fullscreen ? "Quitter le plein écran" : "Plein écran"}
          </button>
        </div>
        <p role="status" className="student-save-status">{message}</p>
        <p className="sr-only" aria-live="polite">{spoken}</p>
        {question && <section className="student-card question-card" id={`q-${question.id}`} key={question.id} aria-labelledby="question-titre">
          <div className="question-head"><h2 id="question-titre" ref={headingRef} tabIndex={-1}>Question {question.position} <span className="question-of">sur {total}</span></h2><span className="pill question-points">{formatPoints(question.points)}</span></div>
          {question.reading_passage && <p className="student-passage">{question.reading_passage}</p>}
          {attempt.skill === "listening" && (question.audio_available ? <AudioPlayer attemptId={id} questionId={question.id} simulation={attempt.mode === "simulation"} state={question.audio_state} endsAt={question.audio_ends_at} serverOffset={clockOffset.current} refresh={load} /> : <p role="alert">Le document audio n’est pas disponible pour cette version.</p>)}
          {question.transcript && <details><summary>Consulter la transcription</summary><p>{question.transcript}</p></details>}
          <fieldset disabled={remaining === 0 || (attempt.skill === "listening" && attempt.mode === "simulation" && question.audio_state !== "ready")} aria-busy={busy}><legend>{question.statement}</legend>
            {question.choices.map(choice => { const verdict = verdicts[question.id]; const state = verdict?.choice === choice.id ? (verdict.correct ? "right" : "wrong") : undefined; return <label className="student-choice" data-verdict={state} key={choice.id}>
              <input type="radio" name={question.id} value={choice.id} disabled={busy && answers[question.id] !== choice.id} checked={answers[question.id] === choice.id} onChange={() => save(question.id, choice.id)} />{choice.label}
              {state && <Icon name={state === "right" ? "check" : "close"} size={16} className="choice-mark" />}
            </label>; })}
          </fieldset>
          <nav className="question-nav" aria-label="Navigation entre les questions">
            <Button variant="secondary" disabled={index === 0} onClick={() => go(index - 1)}><Icon name="back" size={15} />Précédent</Button>
            {index < shown.length - 1
              ? <Button onClick={() => go(index + 1)}>Suivant<Icon name="arrow" size={15} /></Button>
              : <Button disabled={busy || remaining === 0} onClick={() => setConfirm(true)}>Terminer<Icon name="check" size={15} /></Button>}
          </nav>
        </section>}
        {confirm && <section className="student-card" aria-label="Confirmation de soumission"><h2>Prêt à découvrir le corrigé ?</h2><p>{answeredCount} réponses enregistrées sur {total}. Les questions sans réponse comptent pour zéro. Après la soumission, les réponses seront définitives.</p>
          <div className="student-nav" style={{ margin: 0 }}><Button loading={busy} onClick={submit}>Confirmer la soumission</Button> <Button variant="secondary" disabled={busy} onClick={() => setConfirm(false)}>Continuer ma lecture</Button></div>
        </section>}
      </div>
      <aside className="attempt-aside" aria-label="Suivi de la tentative">
        <nav className="student-card map-card" aria-label="Plan des questions">
          <p className="student-eyebrow">Plan des questions</p>
          <p className="student-hint" style={{ margin: 0 }}>{answeredCount} sur {total} répondues</p>
          <ul className="question-map">{shown.map((item, position) => {
            const state = answers[item.id] ? "answered" : visited[item.id] ? "seen" : undefined;
            return <li key={item.id}><button type="button" data-state={state} aria-current={item.id === question?.id ? "step" : undefined} onClick={() => go(position)}
              aria-label={`Question ${item.position}, ${state === "answered" ? "répondue" : state === "seen" ? "consultée sans réponse" : "non consultée"}`}>{item.position}</button></li>;
          })}</ul>
          <ul className="map-legend" aria-hidden="true"><li data-state="answered">Répondue</li><li data-state="seen">Consultée</li><li>À venir</li></ul>
        </nav>
        <Button variant="secondary" disabled={busy || remaining === 0} onClick={() => setConfirm(true)}>Terminer et vérifier mes réponses</Button>
        <div className="student-card card-muted"><p className="student-eyebrow">Bon à savoir</p><p style={{ margin: 0 }}>{attempt.mode === "simulation" ? "En simulation, avancez sans revenir en arrière : chaque document n’est diffusé qu’une fois." : "En entraînement, prenez le temps de relire : le corrigé explique chaque réponse."}</p></div>
      </aside>
    </div>}
  </>;
}
