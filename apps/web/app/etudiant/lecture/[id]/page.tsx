"use client";
import { useEffect, useRef, useState, use, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../../../../components/ui/primitives";
import { api, type Attempt, type Results, type SavedAnswer } from "../../../../lib/student-api";
import { useSession } from "../../../../lib/session";
import { playVerdict, primeSound } from "../../../../lib/feedback-sound";
import { AudioPlayer } from "../../../../components/student/audio-player";
import { Icon } from "../../../../components/app-shell/icons";
import { Summary } from "../../../../features/student/ui";
import { exitFullscreen, enterFullscreen } from "../../../../lib/fullscreen";

// Préfixe des indices du corrigé, affichés dans « Où le trouver ».
const HINT = "Indice dans le texte : ";

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
  const router = useRouter();
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
  // Nouvelle tentative sur la même série, ouverte directement en plein écran.
  async function retry() {
    if (!attempt) return;
    enterFullscreen();
    setBusy(true); setError("");
    try {
      const next = await api<{ id: string }>(`exams/${attempt.exam_id}/attempts/`, "POST");
      router.push(`/etudiant/${attempt.skill === "listening" ? "ecoute" : "lecture"}/${next.id}`);
    } catch (e) { exitFullscreen(); setError((e as Error).message); setBusy(false); }
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
  const listening = attempt?.skill === "listening";
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
    {!active && !results && <div className="page-head"><div>
      <p className="student-eyebrow">{attempt?.skill === "listening" ? "Écoute" : "Lecture"} · {attempt?.mode === "simulation" ? "Simulation non officielle" : "Entraînement non officiel"}</p>
      <h2 className="page-title">{results ? "Prenons le temps de comprendre" : attempt?.skill === "listening" ? "À vous d’écouter" : "À vous de lire"}</h2>
      {attempt?.exam_title && <p>{attempt.exam_title}</p>}
    </div><p><Link href="/etudiant">Retour aux exercices</Link></p></div>}
    {!active && error && <p role="alert">{error}</p>}
    {!attempt && !error && <p className="student-hint">Chargement de votre lecture…</p>}
    {attempt?.status === "expired" && <section className="student-card"><h2>Le temps est écoulé</h2><p>Les réponses enregistrées sont conservées. Cette tentative n’a pas été soumise et aucun score n’a été calculé. Vous pouvez recommencer depuis le catalogue.</p></section>}
    {results && attempt && <>
      <div className="home-top bilan-top">
        <section className="hero-card bilan-hero" aria-labelledby="resultat">
          <div className="bilan-ring" style={{ ["--value" as string]: results.max_score ? results.score / results.max_score * 100 : 0 }}>
            <p><strong>{results.score}</strong><small>/ {results.max_score} pts</small></p>
          </div>
          <div className="bilan-hero-text">
            <p className="bilan-chips"><span>Épreuve {listening ? "02 · Écoute" : "01 · Lecture"}</span><span>{attempt.mode === "simulation" ? "Simulation non officielle" : "Entraînement non officiel"}</span></p>
            <h1 id="resultat">Séance terminée : place au bilan.</h1>
            <p>Score d’entraînement, sans équivalence TCF ni NCLC. Repassez chaque question ci-dessous pour comprendre où chercher.</p>
            <div><Button className="bilan-retry" loading={busy} onClick={retry}><Icon name="refresh" size={15} />Refaire la série</Button></div>
          </div>
        </section>
        <section className="status-card bilan-next" aria-labelledby="et-maintenant">
          <h2 id="et-maintenant" className="student-eyebrow">Et maintenant ?</h2>
          <p>Comparez ce score à vos séances précédentes pour voir comment vous avancez.</p>
          <Link className="button button-primary tile-link" href="/etudiant/progression">Suivre ma progression<Icon name="trend" size={15} /></Link>
        </section>
      </div>
      <div className="section-title"><h2>Votre score en chiffres</h2></div>
      <Summary label="Votre score en chiffres" items={[
        { label: "Points obtenus", value: results.score, hint: `Sur ${results.max_score} possibles` },
        { label: "Bonnes réponses", value: <>{results.correct_count}<small className="bilan-of"> / {results.question_count}</small></>, hint: "Questions justes" },
        { label: "Taux de réussite", value: `${results.percentage.toLocaleString("fr-CA")} %`, hint: `${results.correct_count} réponse${results.correct_count > 1 ? "s" : ""} juste${results.correct_count > 1 ? "s" : ""} sur ${results.question_count}`, meter: results.percentage },
      ]} />
      <div className="section-title"><h2 id="corrige">Revoir chaque question</h2><p className="section-note">La bonne réponse et où la trouver dans le texte</p></div>
      <ol className="bilan-list" aria-labelledby="corrige">
        {results.details.map((detail, index) => {
          const ok = detail.selected_choice_id === detail.correct_choice_id;
          const state = ok ? "right" : detail.selected_label ? "wrong" : "empty";
          const hint = detail.explanation.startsWith(HINT) ? detail.explanation.slice(HINT.length).replace(/\.$/, "") : null;
          const source = detail.reading_passage || detail.transcript;
          const letter = (choiceId: string | null) => { const rank = detail.choices.findIndex(c => c.id === choiceId); return rank === -1 ? null : "ABCD"[rank]; };
          const what = source ? (detail.reading_passage ? "le texte et les choix" : "la transcription et les choix") : "les choix";
          return <li key={detail.question_id} className="student-card bilan-question">
            <div className="bilan-question-head">
              <h3><span className="bilan-num">{index + 1}</span>{detail.statement}</h3>
              <span className="bilan-tags"><span className="pill">{ok ? detail.points : 0} / {detail.points} pts</span><span className="bilan-state" data-state={state}>{ok ? "Correcte" : detail.selected_label ? "Incorrecte" : "Non répondue"}</span></span>
            </div>
            <details className="bilan-source">
              <summary><Icon name="chevron" size={14} /><span className="when-closed">Afficher {what}</span><span className="when-open">Masquer {what}</span></summary>
              {source && <p className="student-passage">{source}</p>}
              <ul className="bilan-choices" aria-label="Choix proposés">{detail.choices.map((choice, rank) => {
                const mark = choice.id === detail.correct_choice_id ? "right" : choice.id === detail.selected_choice_id ? "wrong" : undefined;
                return <li key={choice.id} data-state={mark}>
                  <span className="choice-letter" aria-hidden="true">{"ABCD"[rank]}</span><span className="sr-only">{"ABCD"[rank]}. </span>{choice.label}
                  <span className="bilan-choice-tags">{choice.id === detail.selected_choice_id && <span>Votre réponse</span>}{choice.id === detail.correct_choice_id && <span>Bonne réponse</span>}</span>
                </li>;
              })}</ul>
            </details>
            <div className="bilan-boxes">
              <div className="bilan-box" data-tone={state === "right" ? "mint" : state === "wrong" ? "red" : undefined}><small>Vous avez répondu</small><p>{detail.selected_label ? <><b className="bilan-letter">{letter(detail.selected_choice_id)}</b><span>{detail.selected_label}</span></> : <em>Aucune réponse</em>}</p></div>
              <div className="bilan-box" data-tone="mint"><small>Bonne réponse</small><p><b className="bilan-letter">{letter(detail.correct_choice_id)}</b><span>{detail.correct_label}</span></p></div>
              <div className="bilan-box" data-tone="lavender"><small>{hint ? "Où le trouver" : "Explication"}</small><p>{hint ?? detail.explanation}</p></div>
            </div>
          </li>;
        })}
      </ol>
    </>}
    {active && attempt && <div className="seance">
      <header className="seance-bar">
        <div className="seance-brand">
          <Image src="/branding/01_Logos_PNG/fluentia-symbole-transparent-256.png" alt="" width={30} height={30} unoptimized />
          <strong>Fluentia</strong><span aria-hidden="true" className="seance-sep" /><span>Séance · {listening ? "Écoute" : "Lecture"}</span>
        </div>
        <Link className="seance-quit" href={listening ? "/etudiant/comprehension-orale" : "/etudiant/comprehension-ecrite"} onClick={exitFullscreen}><Icon name="close" size={14} />Quitter la séance</Link>
      </header>
      <div className="seance-body">
        <div className="seance-head">
          <p className="seance-chips"><span className="seance-chip">Épreuve {listening ? "02" : "01"}</span><span className="seance-chip" data-tone="warn">{attempt.mode === "simulation" ? "Simulation non officielle" : "Entraînement non officiel"}</span></p>
          <h1>{listening ? "Écoutez, choisissez, avancez." : "Lisez, choisissez, avancez."}</h1>
          <p>{attempt.exam_title}</p>
        </div>
        {error && <p role="alert">{error}</p>}
        <div className="seance-status">
          <div className="seance-timer">
            <span className="seance-timer-icon" aria-hidden="true"><Icon name="timer" size={18} /></span>
            <p><small>Chrono indicatif</small><strong aria-label={`${Math.floor(remaining / 60)} minutes ${remaining % 60} secondes restantes`}>{String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}</strong></p>
          </div>
          <div className="seance-saved">
            <p><span>Réponses sauvegardées{busy ? " · enregistrement…" : ""}</span><strong>{answeredCount} / {total}</strong></p>
            <span className="session-progress" aria-hidden="true"><span style={{ width: `${total ? answeredCount / total * 100 : 0}%` }} /></span>
          </div>
          <button type="button" className="session-tool" aria-pressed={fullscreen} onClick={() => fullscreen ? exitFullscreen() : enterFullscreen()}>
            <Icon name={fullscreen ? "shrink" : "expand"} size={15} />Mode focus
          </button>
        </div>
        <p role="status" className="sr-only">{message}</p>
        <p className="sr-only" aria-live="polite">{spoken}</p>
        <div className="attempt-layout">
          <div>
            {question && <section className="student-card question-card" id={`q-${question.id}`} key={question.id} aria-labelledby="question-titre">
              <div className="question-head"><h2 id="question-titre" ref={headingRef} tabIndex={-1}>Question {question.position} <span className="question-of">/ {total}</span></h2><span className="pill question-points">{question.points} pts</span></div>
              {question.reading_passage && <p className="student-passage">{question.reading_passage}</p>}
              {listening && (question.audio_available ? <AudioPlayer attemptId={id} questionId={question.id} simulation={attempt.mode === "simulation"} state={question.audio_state} endsAt={question.audio_ends_at} serverOffset={clockOffset.current} refresh={load} /> : <p role="alert">Le document audio n’est pas disponible pour cette version.</p>)}
              {question.transcript && <details><summary>Consulter la transcription</summary><p>{question.transcript}</p></details>}
              <fieldset disabled={remaining === 0 || (listening && attempt.mode === "simulation" && question.audio_state !== "ready")} aria-busy={busy}><legend>{question.statement}</legend>
                {question.choices.map((choice, rank) => { const verdict = verdicts[question.id]; const state = verdict?.choice === choice.id ? (verdict.correct ? "right" : "wrong") : undefined; return <label className="student-choice" data-verdict={state} key={choice.id}>
                  <input type="radio" name={question.id} value={choice.id} disabled={busy && answers[question.id] !== choice.id} checked={answers[question.id] === choice.id} onChange={() => save(question.id, choice.id)} />
                  <span className="choice-letter" aria-hidden="true">{"ABCD"[rank]}</span>{choice.label}
                  {state && <Icon name={state === "right" ? "check" : "close"} size={16} className="choice-mark" />}
                </label>; })}
              </fieldset>
              <nav className="question-nav" aria-label="Navigation entre les questions">
                <Button variant="secondary" disabled={index === 0} onClick={() => go(index - 1)}><Icon name="back" size={15} />Retour</Button>
                {index < shown.length - 1
                  ? <Button onClick={() => go(index + 1)}>Question suivante<Icon name="arrow" size={15} /></Button>
                  : <Button disabled={busy || remaining === 0} onClick={() => setConfirm(true)}>Terminer<Icon name="check" size={15} /></Button>}
              </nav>
            </section>}
            {confirm && <section className="student-card" aria-label="Confirmation de soumission"><h2>Prêt à découvrir le corrigé ?</h2><p>{answeredCount} réponses enregistrées sur {total}. Les questions sans réponse comptent pour zéro. Après la soumission, les réponses seront définitives.</p>
              <div className="student-nav" style={{ margin: 0 }}><Button loading={busy} onClick={submit}>Confirmer la soumission</Button> <Button variant="secondary" disabled={busy} onClick={() => setConfirm(false)}>Continuer la séance</Button></div>
            </section>}
          </div>
          <aside className="attempt-aside" aria-label="Suivi de la séance">
            <nav className="student-card map-card" aria-labelledby="vue-ensemble">
              <div className="map-head"><h2 id="vue-ensemble">Vue d’ensemble</h2><p>{answeredCount}/{total} répondues</p></div>
              <ul className="question-map">{shown.map((item, position) => {
                const state = answers[item.id] ? "answered" : visited[item.id] ? "seen" : undefined;
                return <li key={item.id}><button type="button" data-state={state} aria-current={item.id === question?.id ? "step" : undefined} onClick={() => go(position)}
                  aria-label={`Question ${item.position}, ${state === "answered" ? "répondue" : state === "seen" ? "vue sans réponse" : "pas encore vue"}`}>{item.position}</button></li>;
              })}</ul>
              <ul className="map-legend" aria-hidden="true"><li data-state="answered">Répondue</li><li data-state="seen">Vue</li><li>Pas encore vue</li></ul>
              <Button className="map-finish" disabled={busy || remaining === 0} onClick={() => setConfirm(true)}>Terminer la séance</Button>
            </nav>
            <div className="student-card seance-tip">
              <p className="badge-warn"><Icon name="clock" size={13} />Bon à savoir</p>
              <p>{attempt.mode === "simulation" ? "En simulation, avancez sans revenir en arrière : le jour J, chaque document n’est présenté qu’une seule fois." : "En entraînement, prenez le temps de relire : le corrigé explique chaque réponse."}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>}
  </>;
}
