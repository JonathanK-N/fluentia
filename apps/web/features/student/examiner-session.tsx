"use client";
/** Passage d’une tâche d’Oral face à l’examinateur IA : préparation, conversation vocale, conclusion, transcription. */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "../../components/ui/primitives";
import { Icon } from "../../components/app-shell/icons";
import { api, ApiError } from "../../lib/student-api";
import { enterFullscreen, exitFullscreen } from "../../lib/fullscreen";
import {
  addUsage, connectDemo, connectRealtime, emptyUsage, upsertTurn, watchLevel,
  type Activity, type ExaminerConnection, type SpeakingSession, type Turn, type Usage,
} from "../../lib/examiner";
import { formatDuration, type SpeakingTask } from "./content";

type Subject = SpeakingTask["subjects"][number];
type Phase = "intro" | "prep" | "connecting" | "live" | "closing" | "done" | "error";

const ACTIVITY: Record<Activity, string> = {
  connecting: "Connexion à l’examinateur…",
  examiner: "L’examinateur parle",
  candidate: "Vous parlez",
  waiting: "À vous",
};

export function ExaminerSession({ task, subject, examiner, onExit }: { task: SpeakingTask; subject: Subject; examiner: string; onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [error, setError] = useState("");
  const [session, setSession] = useState<SpeakingSession | null>(null);
  const [left, setLeft] = useState(0);
  const [activity, setActivity] = useState<Activity>("connecting");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [captions, setCaptions] = useState(true);
  const [muted, setMuted] = useState(false);
  const [notes, setNotes] = useState("");
  const [level, setLevel] = useState({ mic: 0, examiner: 0 });
  const [summary, setSummary] = useState<{ seconds: number; secondsLeft: number } | null>(null);
  const connection = useRef<ExaminerConnection | null>(null);
  const microphone = useRef<MediaStream | null>(null);
  const stops = useRef<(() => void)[]>([]);
  const usage = useRef<Usage>(emptyUsage());
  const turnsRef = useRef<Turn[]>([]);
  const startedAt = useRef(0);
  const finishing = useRef(false);

  const release = useCallback(() => {
    stops.current.forEach(stop => stop()); stops.current = [];
    connection.current?.close(); connection.current = null;
    microphone.current?.getTracks().forEach(track => track.stop()); microphone.current = null;
  }, []);
  useEffect(() => () => { release(); exitFullscreen(); }, [release]);

  const fail = useCallback((message: string) => { release(); setError(message); setPhase("error"); }, [release]);

  const finish = useCallback(async () => {
    if (finishing.current || !session) return;
    finishing.current = true;
    setPhase("closing");
    await connection.current?.conclude().catch(() => {});
    const seconds = Math.round((Date.now() - startedAt.current) / 1000);
    release();
    const transcript = turnsRef.current.filter(t => t.text).map(t => ({ role: t.role, text: t.text.slice(0, 4000) })).slice(0, 400);
    try {
      const saved = await api<{ seconds: number; seconds_left: number }>(`speaking/sessions/${session.id}/finish/`, "POST", {
        seconds, transcript, usage: { ...usage.current, transcription_seconds: Math.min(7200, usage.current.transcription_seconds) },
      });
      setSummary({ seconds: saved.seconds, secondsLeft: saved.seconds_left });
    } catch {
      setSummary({ seconds, secondsLeft: -1 });
    }
    exitFullscreen();
    setPhase("done");
  }, [release, session]);

  const connect = useCallback(async (opened: SpeakingSession) => {
    const mic = microphone.current;
    if (!mic) return fail("Le microphone n’est plus disponible.");
    setPhase("connecting"); setActivity("connecting");
    const handlers = {
      onActivity: setActivity,
      onTurn: (turn: Turn) => { turnsRef.current = upsertTurn(turnsRef.current, turn); setTurns(turnsRef.current); },
      onUsage: (part: Partial<Usage>) => { usage.current = addUsage(usage.current, part); },
      onError: (message: string) => setError(message),
      onRemoteStream: (stream: MediaStream) => { stops.current.push(watchLevel(stream, value => setLevel(l => ({ ...l, examiner: value })))); },
    };
    try {
      connection.current = opened.demo ? connectDemo(task.number, mic, handlers) : await connectRealtime(opened, mic, handlers);
    } catch (e) {
      return fail((e as Error).message);
    }
    stops.current.push(watchLevel(mic, value => setLevel(l => ({ ...l, mic: value }))));
    startedAt.current = Date.now();
    setLeft(opened.seconds);
    setPhase("live");
  }, [fail, task.number]);

  async function start() {
    setError("");
    enterFullscreen();
    if (!navigator.mediaDevices?.getUserMedia) return fail("Votre navigateur ne permet pas d’utiliser le microphone. Essayez une version récente de Chrome, Edge, Firefox ou Safari.");
    try {
      microphone.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      return fail("L’accès au microphone a été refusé. Autorisez-le dans votre navigateur, puis réessayez.");
    }
    let opened: SpeakingSession;
    try {
      opened = await api<SpeakingSession>("speaking/sessions/", "POST", { subject_id: subject.id, mode: "practice" });
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      return fail(status === 403 || status === 429 || status === 503 ? (e as Error).message : "La session n’a pas pu être ouverte. Réessayez dans un instant.");
    }
    setSession(opened);
    if (opened.prep_seconds > 0) { setLeft(opened.prep_seconds); setPhase("prep"); }
    else connect(opened);
  }

  // Un seul chronomètre : préparation, puis temps de parole.
  useEffect(() => {
    if (phase !== "prep" && phase !== "live") return;
    const timer = setInterval(() => setLeft(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [phase]);
  useEffect(() => {
    if (left > 0 || !session) return;
    if (phase === "prep") connect(session);
    else if (phase === "live") finish();
  }, [left, phase, session, connect, finish]);

  function toggleMute() {
    const next = !muted;
    connection.current?.setMuted(next);
    setMuted(next);
  }
  useEffect(() => {
    if (phase !== "live") return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.code !== "Space" || target?.closest("textarea, input, button")) return;
      event.preventDefault();
      setMuted(value => { connection.current?.setMuted(!value); return !value; });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const total = phase === "prep" ? session?.prep_seconds ?? 1 : session?.seconds ?? 1;
  const progress = total ? left / total : 0;
  const speakingLevel = activity === "examiner" ? level.examiner : level.mic;
  const lastTurns = turns.filter(t => t.text).slice(-3);

  return <div className="examiner-layer" role="dialog" aria-modal="true" aria-labelledby="examiner-title">
    <header className="examiner-head">
      <div>
        <p className="student-eyebrow">Tâche {task.number} · {task.title}</p>
        <h2 id="examiner-title">{subject.title}</h2>
      </div>
      {(phase === "intro" || phase === "done" || phase === "error") &&
        <Button variant="ghost" onClick={() => { release(); exitFullscreen(); onExit(); }}><Icon name="close" size={18} />Fermer</Button>}
    </header>

    {session?.demo && phase !== "intro" && <p className="examiner-demo" role="note">Mode démonstration : l’examinateur est scripté, aucune IA ne vous écoute.</p>}

    {phase === "intro" && <section className="examiner-card">
      <p className="examiner-lead">Vous allez passer cette tâche face à un examinateur qui vous parle et vous écoute, dans le temps officiel : {formatDuration(task.seconds)}{task.prepSeconds ? `, après ${task.prepSeconds / 60} minutes de préparation` : ", sans préparation"}.</p>
      <ul className="checklist">
        <li>Installez-vous au calme ; un casque ou des écouteurs évitent l’écho.</li>
        <li>L’examinateur ne vous corrige pas pendant l’épreuve. Parlez naturellement, il vous relance.</li>
        <li>Vous pouvez couper votre micro à tout moment (touche Espace).</li>
      </ul>
      <p className="examiner-consent">Votre voix est envoyée à <strong>{examiner || "l’examinateur"}</strong> pendant la conversation pour être comprise et transcrite. Fluentia conserve uniquement la transcription, que vous pouvez relire ensuite.</p>
      <Button onClick={start}><Icon name="mic" size={18} />Commencer avec l’examinateur</Button>
    </section>}

    {phase === "prep" && <section className="examiner-card examiner-prep" aria-live="polite">
      <Timer left={left} progress={progress} label="Préparation" />
      <div className="examiner-subject"><p>{subject.prompt}</p>{subject.cues.length > 0 && <div className="pill-row">{subject.cues.map(cue => <span className="pill" key={cue}>{cue}</span>)}</div>}</div>
      <label className="examiner-notes">Vos notes (elles restent sur cet appareil)
        <textarea value={notes} onChange={event => setNotes(event.target.value)} rows={5} placeholder="Questions à poser, idées, mots utiles…" />
      </label>
      <Button variant="secondary" onClick={() => session && connect(session)}>Je suis prêt, commencer</Button>
    </section>}

    {(phase === "connecting" || phase === "live" || phase === "closing") && <section className="examiner-stage">
      <div className="examiner-center">
        <div className="examiner-orb" data-activity={phase === "connecting" ? "connecting" : activity} style={{ "--level": speakingLevel.toFixed(3) } as CSSProperties} aria-hidden="true">
          <span /><span /><span />
        </div>
        <p className="examiner-activity" aria-live="polite">{phase === "closing" ? "L’examinateur conclut l’épreuve…" : muted && phase === "live" ? "Micro coupé" : ACTIVITY[phase === "connecting" ? "connecting" : activity]}</p>
        {phase === "live" && <Timer left={left} progress={progress} label="Restant" />}
      </div>
      {captions && lastTurns.length > 0 && <ol className="examiner-captions" aria-label="Sous-titres">
        {lastTurns.map(turn => <li key={turn.id} data-role={turn.role}><span>{turn.role === "examiner" ? "Examinateur" : "Vous"}</span>{turn.text}</li>)}
      </ol>}
      {notes && <details className="examiner-notes-recall"><summary>Mes notes</summary><p>{notes}</p></details>}
      <details className="examiner-notes-recall"><summary>Le sujet</summary><p>{subject.prompt}</p></details>
      {phase === "live" && <div className="examiner-controls">
        <Button variant="secondary" aria-pressed={muted} onClick={toggleMute}><Icon name={muted ? "volume" : "mic"} size={18} />{muted ? "Rétablir le micro" : "Couper le micro"}</Button>
        <Button variant="secondary" aria-pressed={captions} onClick={() => setCaptions(value => !value)}>Sous-titres</Button>
        <Button variant="ghost" onClick={finish}><Icon name="stop" size={18} />Terminer</Button>
      </div>}
      {error && <p role="alert" className="examiner-error">{error}</p>}
    </section>}

    {phase === "done" && <section className="examiner-card">
      <h3>Épreuve terminée</h3>
      <p>Durée de parole comptée : <strong>{formatDuration(summary?.seconds ?? 0)}</strong>{summary && summary.secondsLeft >= 0 ? ` · il vous reste ${Math.floor(summary.secondsLeft / 60)} min d’oral aujourd’hui.` : "."}</p>
      <p className="student-hint">La note détaillée (sur 20, niveau et NCLC) arrive bientôt. En attendant, relisez votre échange.</p>
      <ol className="examiner-transcript">
        {turns.filter(t => t.text).map(turn => <li key={turn.id} data-role={turn.role}><span>{turn.role === "examiner" ? "Examinateur" : "Vous"}</span>{turn.text}</li>)}
        {!turns.some(t => t.text) && <li>Aucune transcription n’a été reçue pour cette séance.</li>}
      </ol>
      <Button variant="secondary" onClick={onExit}>Revenir à la tâche</Button>
    </section>}

    {phase === "error" && <section className="examiner-card">
      <p role="alert" className="examiner-error">{error}</p>
      <Button variant="secondary" onClick={() => { setError(""); finishing.current = false; setPhase("intro"); }}>Réessayer</Button>
    </section>}
  </div>;
}

function Timer({ left, progress, label }: { left: number; progress: number; label: string }) {
  const circumference = 2 * Math.PI * 26;
  return <div className="examiner-timer" role="timer" aria-label={`${label} : ${formatDuration(left)}`}>
    <svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="26" /><circle cx="30" cy="30" r="26" data-progress strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} /></svg>
    <span><small>{label}</small>{formatDuration(left)}</span>
  </div>;
}
