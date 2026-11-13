"use client";
/** Passage d’une tâche d’Oral face à l’examinateur IA : préparation, conversation vocale, conclusion, transcription. */
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "../../components/ui/primitives";
import { Icon } from "../../components/app-shell/icons";
import { api, ApiError } from "../../lib/student-api";
import { enterFullscreen, exitFullscreen } from "../../lib/fullscreen";
import {
  addUsage, CLOSING_SENTENCE, connectDemo, connectRealtime, emptyUsage, ROLEPLAY_CLOSING_SENTENCE, upsertTurn, watchLevel,
  type Activity, type ExaminerConnection, type SpeakingSession, type Turn, type Usage,
} from "../../lib/examiner";
import { formatDuration, sentTo, sentToParts, type SpeakingTask } from "./content";
import { SeanceBar, SeanceHead, Timer } from "./seance";

type Subject = SpeakingTask["subjects"][number];
// Avec préparation (tâche 2) : connexion, lecture du sujet (briefing), deux minutes de préparation, puis questions.
type Phase = "intro" | "connecting" | "briefing" | "prep" | "live" | "closing" | "done" | "error";
const START_IF_SILENT_MS = 10_000;     // le candidat ne dit rien après la lecture du sujet
const START_AT_THE_LATEST_MS = 60_000; // filet de sécurité : la séance ne dure jamais indéfiniment
const OPENING_TIMEOUT_MS = 20_000;     // l’examinateur doit avoir commencé à parler 20 s après la connexion
const NOT_COUNTED = "Aucune minute n’a été décomptée : vérifiez votre connexion, puis réessayez.";

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
  const [transcript, setTranscript] = useState(false);
  const [quitting, setQuitting] = useState(false);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  useEffect(() => { mutedRef.current = muted; }, [muted]);
  const [notes, setNotes] = useState("");
  const [level, setLevel] = useState({ mic: 0, examiner: 0 });
  const [summary, setSummary] = useState<{ seconds: number; secondsLeft: number } | null>(null);
  const [cutShort, setCutShort] = useState(false);
  const connection = useRef<ExaminerConnection | null>(null);
  const microphone = useRef<MediaStream | null>(null);
  const stops = useRef<(() => void)[]>([]);
  const usage = useRef<Usage>(emptyUsage());
  const turnsRef = useRef<Turn[]>([]);
  // Le chrono ne démarre qu’après la lecture du sujet, quand le candidat commence à parler.
  const [counting, setCounting] = useState(false);
  const startedAt = useRef(0);
  const finishing = useRef(false);

  const release = useCallback(() => {
    stops.current.forEach(stop => stop()); stops.current = [];
    connection.current?.close(); connection.current = null;
    microphone.current?.getTracks().forEach(track => track.stop()); microphone.current = null;
  }, []);
  // Séance ouverte côté serveur et pas encore terminée : à abandonner si l’étudiant part ou si la connexion échoue.
  const openId = useRef<number | null>(null);
  const abandon = useCallback(() => {
    const id = openId.current;
    if (id === null || finishing.current) return;
    openId.current = null;
    // Seul le temps déjà compté par le chrono est décompté : un examinateur qui n’a jamais pu commencer ne coûte rien.
    const seconds = startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0;
    api(`speaking/sessions/${id}/abandon/`, "POST", { seconds }).catch(() => {});
  }, []);
  useEffect(() => () => { abandon(); release(); exitFullscreen(); }, [abandon, release]);

  const fail = useCallback((message: string) => { abandon(); release(); setError(message); setPhase("error"); }, [abandon, release]);

  // `cut` : la connexion a été coupée en cours d’échange ; ce qui a été dit est gardé, sans phrase d’au revoir.
  const finish = useCallback(async (cut = false) => {
    if (finishing.current || !session) return;
    finishing.current = true;
    openId.current = null;
    // Le chrono s’arrête maintenant : la phrase de fin de l’examinateur n’est pas comptée.
    const seconds = startedAt.current ? Math.min(session.seconds, Math.round((Date.now() - startedAt.current) / 1000)) : 0;
    setPhase("closing");
    setCutShort(cut);
    if (!cut) await connection.current?.conclude(task.number === 2 ? ROLEPLAY_CLOSING_SENTENCE : CLOSING_SENTENCE).catch(() => {});
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
  }, [release, session, task.number]);
  const finishRef = useRef(finish);
  useEffect(() => { finishRef.current = finish; }, [finish]);

  // Le chrono de l’échange : il part à la première prise de parole du candidat.
  const talking = useRef(false);
  const examinerSpoke = useRef(false);
  const nudge = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const begin = useCallback(() => {
    if (startedAt.current || finishing.current) return;
    startedAt.current = Date.now();
    setCounting(true);
  }, []);
  // L’échange commence : tout de suite sans préparation, après les deux minutes en tâche 2.
  const startTalking = useCallback((opened: SpeakingSession) => {
    talking.current = true; examinerSpoke.current = false;
    // Si le candidat ne dit rien, le chrono part quand même : 10 s après l’examinateur, 60 s au plus tard.
    const latest = setTimeout(begin, START_AT_THE_LATEST_MS);
    stops.current.push(() => { clearTimeout(latest); clearTimeout(nudge.current); });
    setLeft(opened.seconds);
    setPhase("live");
  }, [begin]);
  const startQuestions = useCallback((opened: SpeakingSession) => {
    if (talking.current) return;
    connection.current?.startQuestions();
    connection.current?.setMuted(mutedRef.current);
    startTalking(opened);
  }, [startTalking]);

  const connect = useCallback(async (opened: SpeakingSession) => {
    const mic = microphone.current;
    if (!mic) return fail("Le microphone n’est plus disponible.");
    setPhase("connecting"); setActivity("connecting");
    const prep = opened.prep_seconds > 0;
    let briefed = false;
    // Lecture du sujet terminée : les deux minutes de préparation commencent.
    const toPrep = () => { if (briefed || talking.current) return; briefed = true; setLeft(opened.prep_seconds); setPhase("prep"); };
    const handlers = {
      onActivity: (next: Activity) => {
        setActivity(next);
        if (next === "examiner") { examinerSpoke.current = true; clearTimeout(nudge.current); nudge.current = undefined; }
        if (!talking.current) {
          if (prep && next === "waiting" && examinerSpoke.current) toPrep();
          return;
        }
        if (next === "candidate") begin();
        if (next === "waiting" && examinerSpoke.current && !startedAt.current && !nudge.current) nudge.current = setTimeout(begin, START_IF_SILENT_MS);
      },
      onTurn: (turn: Turn) => {
        // Après la fin du temps, une nouvelle prise de parole du candidat n’est plus enregistrée.
        if (finishing.current && turn.role === "candidate" && !turnsRef.current.some(t => t.id === turn.id)) return;
        // Après la fin, seule la phrase d’au revoir s’affiche : une réponse annulée au dernier moment n’apparaît pas.
        if (finishing.current && turn.role === "examiner" && turn.text && !/au revoir/i.test(turn.text)) return;
        // La phrase d’au revoir ne s’affiche qu’une fois.
        if (finishing.current && turn.role === "examiner" && turn.text
          && turnsRef.current.some(t => t.id !== turn.id && t.role === "examiner" && t.text === turn.text)) return;
        turnsRef.current = upsertTurn(turnsRef.current, turn); setTurns(turnsRef.current);
      },
      onUsage: (part: Partial<Usage>) => { usage.current = addUsage(usage.current, part); },
      onError: (message: string) => setError(message),
      onRemoteStream: (stream: MediaStream) => { stops.current.push(watchLevel(stream, value => setLevel(l => ({ ...l, examiner: value })))); },
      // Connexion coupée : si le candidat a déjà parlé, ce qu’il a dit est gardé et corrigé ; sinon rien n’est décompté.
      onLost: () => {
        if (finishing.current) return;
        if (startedAt.current) finishRef.current(true);
        else fail(`La connexion avec l’examinateur a été coupée. ${NOT_COUNTED}`);
      },
    };
    try {
      connection.current = opened.demo ? connectDemo(task.number, mic, handlers, prep) : await connectRealtime(opened, mic, handlers);
    } catch (e) {
      return fail((e as Error).message);
    }
    // L’examinateur ne commence pas (fournisseur lent ou réseau) : on arrête plutôt que de laisser le candidat attendre.
    const opening = setTimeout(() => {
      if (!examinerSpoke.current && !finishing.current) fail(`L’examinateur n’a pas pu commencer l’épreuve. ${NOT_COUNTED}`);
    }, OPENING_TIMEOUT_MS);
    stops.current.push(() => clearTimeout(opening));
    stops.current.push(watchLevel(mic, value => setLevel(l => ({ ...l, mic: value }))));
    if (!prep) return startTalking(opened);
    // Le candidat ne parle pas pendant la lecture du sujet ni pendant la préparation.
    connection.current.setMuted(true);
    setLeft(opened.prep_seconds);
    setPhase("briefing");
    const fallback = setTimeout(toPrep, START_AT_THE_LATEST_MS); // l’examinateur n’a pas pu lire le sujet
    stops.current.push(() => clearTimeout(fallback));
  }, [begin, fail, startTalking, task.number]);

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
    openId.current = opened.id;
    connect(opened);
  }

  // Un seul chronomètre : préparation, puis temps de parole (à partir de la première prise de parole du candidat).
  const running = phase === "prep" || (phase === "live" && counting);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setLeft(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [running]);
  useEffect(() => {
    if (left > 0 || !session) return;
    if (phase === "prep") startQuestions(session);
    else if (phase === "live") finish();
  }, [left, phase, session, startQuestions, finish]);

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

  const total = phase === "prep" || phase === "briefing" ? session?.prep_seconds ?? 1 : session?.seconds ?? 1;
  // Durée de l’échange seul : en tâche 2, les 5 min 30 officielles comprennent les 2 minutes de préparation.
  const talkSeconds = session?.seconds ?? task.seconds - task.prepSeconds;
  const progress = total ? left / total : 0;
  const speakingLevel = activity === "examiner" ? level.examiner : level.mic;
  const spoken = turns.filter(t => t.text);
  const latest = spoken[spoken.length - 1];
  const inSession = phase === "prep" || phase === "connecting" || phase === "briefing" || phase === "live" || phase === "closing";
  const demo = session?.demo;

  function leave() { abandon(); release(); exitFullscreen(); onExit(); }
  function restart() {
    setError(""); setTurns([]); turnsRef.current = []; usage.current = emptyUsage();
    finishing.current = false; startedAt.current = 0; setCounting(false);
    talking.current = false; examinerSpoke.current = false; nudge.current = undefined;
    setSession(null); setSummary(null); setCutShort(false); setPhase("intro");
  }

  // Une seule scène pour toutes les étapes : orbe et chronomètre, état, message, consigne, commandes.
  const stage: { pill: string; tone?: string; who: string; message: string } = {
    intro: { pill: "Prêt quand vous l’êtes", who: "L’examinateur", message: `Vous allez passer cette tâche face à un examinateur qui vous parle et vous écoute, dans le temps officiel : ${formatDuration(task.seconds)}${task.prepSeconds ? `. L’examinateur lit d’abord le sujet, puis vous avez ${task.prepSeconds / 60} minutes pour préparer vos questions, et ${formatDuration(task.seconds - task.prepSeconds)} pour les poser : c’est vous qui menez l’échange` : ", sans préparation"}.` },
    briefing: { pill: "L’examinateur lit le sujet", who: "L’examinateur", message: latest?.text ?? subject.prompt },
    prep: { pill: "Préparez vos questions", who: "Le sujet", message: subject.prompt },
    connecting: { pill: ACTIVITY.connecting, who: "L’examinateur", message: "Connexion en cours : l’examinateur va prendre la parole." },
    live: {
      pill: muted ? "Micro coupé" : activity === "examiner" ? "L’examinateur vous parle" : ACTIVITY[activity],
      tone: muted ? "warn" : activity === "candidate" || activity === "waiting" ? "mint" : undefined,
      who: latest?.role === "candidate" ? "Vous" : "L’examinateur",
      message: latest?.text ?? "L’examinateur va prendre la parole.",
    },
    closing: { pill: "L’examinateur conclut", who: "L’examinateur", message: latest?.text ?? "L’examinateur conclut l’épreuve…" },
    done: { pill: "Tâche terminée", tone: "mint", who: "Bilan", message: `${cutShort ? "La connexion avec l’examinateur a été coupée avant la fin : ce que vous avez dit est enregistré. " : ""}Durée de parole comptée : ${formatDuration(summary?.seconds ?? 0)}${summary && summary.secondsLeft >= 0 ? `. Il vous reste ${Math.floor(summary.secondsLeft / 60)} min d’oral aujourd’hui.` : "."} Votre correction est prête à être calculée : note sur 20, niveau, NCLC et conseils.` },
    error: { pill: "Problème", tone: "danger", who: "Fluentia", message: error },
  }[phase];
  const showTranscript = phase === "done" || (transcript && inSession);

  return <div className="examiner-layer" role="dialog" aria-modal="true" aria-labelledby="seance-title">
    <SeanceBar label="Oral">
      {inSession
        ? <Dialog.Root open={quitting} onOpenChange={setQuitting}>
          <Dialog.Trigger className="seance-quit"><Icon name="close" size={14} />Quitter la séance</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="dialog-overlay" />
            <Dialog.Content className="dialog-content quit-dialog">
              <Dialog.Title>Quitter la séance ?</Dialog.Title>
              <Dialog.Description>La tâche s’arrête maintenant : le temps déjà parlé est compté et vous pourrez relire votre échange.</Dialog.Description>
              <div className="quit-actions">
                <Button onClick={() => { setQuitting(false); finish(); }}>Terminer la tâche</Button>
                <Dialog.Close asChild><Button variant="secondary">Continuer</Button></Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        : <button type="button" className="seance-quit" onClick={leave}><Icon name="close" size={14} />Quitter la séance</button>}
    </SeanceBar>

    <div className="seance-body oral-body">
      <SeanceHead
        chips={[{ label: "Épreuve 04" }, { label: demo ? "Démo · questions préenregistrées" : "Entraînement non officiel", tone: "warn" }]}
        title={subject.title}
        subtitle={`${task.title} · ${demo ? "votre voix n’est pas analysée dans cette démo" : `votre voix est envoyée ${sentTo(examiner)} pendant la conversation`}`}
        base="/etudiant/expression-orale" current={task.number} locked={inSession} onLeave={() => { abandon(); release(); exitFullscreen(); }}
      />

      <section className="oral-card" aria-live="polite">
        <div className="oral-visual">
          <div className="oral-orb-wrap">
            <div className="examiner-orb" data-activity={phase === "connecting" ? "connecting" : phase === "live" || phase === "briefing" ? activity : "idle"} style={{ "--level": (phase === "live" || phase === "briefing" ? speakingLevel : 0).toFixed(3) } as CSSProperties} aria-hidden="true">
              <span /><span /><span />
              <i className="oral-wave"><b /><b /><b /><b /><b /></i>
            </div>
            <p className="oral-pill" data-tone={stage.tone}><span aria-hidden="true" />{stage.pill}</p>
          </div>
          {phase === "done"
            ? <Timer left={summary?.seconds ?? 0} progress={Math.min(1, (summary?.seconds ?? 0) / talkSeconds)} label="Parlé" total={talkSeconds} />
            : phase === "prep" || phase === "briefing" || phase === "live" || phase === "closing"
              ? <Timer left={left} progress={progress} label={phase === "briefing" ? "Après le sujet" : phase === "prep" ? "Préparation" : phase === "live" && !counting ? "Dès que vous parlez" : "Il reste"} total={total} />
              : <Timer left={task.seconds} progress={1} label="Durée" total={task.seconds} />}
        </div>

        {stage.message && <div className="oral-message" data-role={stage.who === "Vous" ? "candidate" : stage.tone === "danger" ? "error" : undefined} role={phase === "error" ? "alert" : undefined}>
          <span className="oral-message-icon" aria-hidden="true"><Icon name={stage.who === "Vous" ? "user" : "chat"} size={16} /></span>
          <div>
            <small>{stage.who}</small>
            <p>{stage.message}</p>
            {phase === "prep" && subject.cues.length > 0 && <div className="pill-row">{subject.cues.map(cue => <span className="pill" key={cue}>{cue}</span>)}</div>}
          </div>
        </div>}

        {phase === "intro" && <div className="oral-details">
          <ul className="checklist">
            <li>Installez-vous au calme ; un casque ou des écouteurs évitent l’écho.</li>
            <li>L’examinateur ne vous corrige pas pendant l’épreuve. Parlez naturellement, il vous relance.</li>
            <li>Vous pouvez couper votre micro à tout moment (touche Espace).</li>
          </ul>
          <p className="examiner-consent">Votre voix est envoyée {sentToParts(examiner)[0]} <strong>{sentToParts(examiner)[1]}</strong> pendant la conversation pour être comprise et transcrite. Fluentia conserve uniquement la transcription, que vous pouvez relire ensuite.</p>
        </div>}

        {phase === "prep" && <label className="examiner-notes">Vos notes (elles restent sur cet appareil)
          <textarea value={notes} onChange={event => setNotes(event.target.value)} rows={4} placeholder="Questions à poser, idées, mots utiles…" />
        </label>}

        {showTranscript && <ol className="examiner-transcript" aria-label="Transcription">
          {spoken.map(turn => <li key={turn.id} data-role={turn.role}><span>{turn.role === "examiner" ? "Examinateur" : "Vous"}</span>{turn.text}</li>)}
          {!spoken.length && <li>{phase === "done" ? "Aucune transcription n’a été reçue pour cette séance." : "La transcription apparaîtra ici."}</li>}
        </ol>}

        {phase !== "prep" && phase !== "intro" && <details className="oral-consigne">
          <summary><Icon name="chevron" size={14} />Voir la consigne</summary>
          <p>{subject.prompt}</p>
          {subject.cues.length > 0 && <div className="pill-row">{subject.cues.map(cue => <span className="pill" key={cue}>{cue}</span>)}</div>}
          {notes && <><strong>Mes notes</strong><p>{notes}</p></>}
        </details>}

        {phase === "live" && error && <p role="alert" className="examiner-error">{error}</p>}

        <div className="oral-actions">
          {phase === "intro" && <Button onClick={start}><Icon name="mic" size={16} />Commencer avec l’examinateur</Button>}
          {phase === "prep" && <Button onClick={() => session && startQuestions(session)}>Je suis prêt, commencer<Icon name="arrow" size={16} /></Button>}
          {(phase === "live" || phase === "connecting" || phase === "briefing" || phase === "closing") && <>
            <Button variant="secondary" aria-pressed={muted} disabled={phase !== "live"} onClick={toggleMute}><Icon name={muted ? "volume" : "mic"} size={16} />{muted ? "Rétablir mon micro" : "Couper mon micro"}</Button>
            <Button variant="secondary" className="oral-toggle" aria-pressed={transcript} onClick={() => setTranscript(value => !value)}><Icon name="copy" size={16} />Transcription</Button>
            <Button disabled={phase !== "live"} onClick={() => finish()}>Terminer la tâche<Icon name="arrow" size={16} /></Button>
          </>}
          {phase === "done" && <>
            <Button variant="secondary" onClick={restart}><Icon name="refresh" size={16} />Refaire la tâche</Button>
            {summary && summary.secondsLeft !== -1 && session
              ? <Link className="button button-primary" href={`/etudiant/expression-orale/correction/${session.id}`} onClick={() => exitFullscreen()}>Voir ma correction<Icon name="arrow" size={16} /></Link>
              : <Button onClick={leave}>Revenir à l’oral<Icon name="arrow" size={16} /></Button>}
          </>}
          {phase === "error" && <>
            <Button variant="secondary" onClick={leave}>Quitter</Button>
            <Button onClick={restart}><Icon name="refresh" size={16} />Réessayer</Button>
          </>}
        </div>
      </section>
    </div>
  </div>;
}
