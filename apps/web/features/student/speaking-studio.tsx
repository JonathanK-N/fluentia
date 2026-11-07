"use client";
/** Studio d’expression orale : préparation, enregistrement local et réécoute. Aucun son n’est envoyé au serveur. */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/primitives";
import { Icon } from "../../components/app-shell/icons";
import { formatDuration, type SpeakingTask } from "./content";
import { FoldableAside } from "./foldable-aside";
import { ExaminerSession } from "./examiner-session";

type Take = { url: string; seconds: number; at: string; type: string };
type Phase = "idle" | "prep" | "recording";

export function SpeakingStudio({ task, others, examiner = "" }: { task: SpeakingTask; others: { slug: string; number: number; title: string }[]; examiner?: string }) {
  const [withExaminer, setWithExaminer] = useState(false);
  const [subject, setSubject] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [clock, setClock] = useState(0);
  const [levels, setLevels] = useState<number[]>(Array(9).fill(0));
  const [takes, setTakes] = useState<Take[]>([]);
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const frame = useRef(0);
  const started = useRef(0);
  const urls = useRef<string[]>([]);
  const current = task.subjects[subject]!;

  function release() {
    cancelAnimationFrame(frame.current);
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
    audio.current?.close().catch(() => {});
    audio.current = null;
    setLevels(Array(9).fill(0));
  }
  useEffect(() => () => { release(); urls.current.forEach(url => URL.revokeObjectURL(url)); }, []);
  useEffect(() => {
    if (phase === "idle") return;
    const timer = setInterval(() => setClock(value => value + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);
  const actions = useRef({ record: async () => {}, stop: () => {} });
  useEffect(() => { actions.current = { record, stop }; });
  useEffect(() => {
    if (phase === "prep" && clock >= task.prepSeconds) { setClock(0); actions.current.record(); }
    if (phase === "recording" && clock >= task.seconds) actions.current.stop();
  }, [phase, clock, task.prepSeconds, task.seconds]);

  async function record() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setError("Votre navigateur ne permet pas l’enregistrement audio. Essayez une version récente de Chrome, Firefox, Edge ou Safari."); setPhase("idle"); return; }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("L’accès au microphone a été refusé ou est indisponible. Autorisez le microphone dans votre navigateur, puis réessayez."); setPhase("idle"); return;
    }
    const chunks: Blob[] = [];
    const media = new MediaRecorder(stream.current);
    recorder.current = media;
    media.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    media.onstop = () => {
      const blob = new Blob(chunks, { type: media.mimeType || "audio/webm" });
      const url = URL.createObjectURL(blob); urls.current.push(url);
      setTakes(list => [{ url, seconds: Math.round((Date.now() - started.current) / 1000), at: new Date().toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" }), type: blob.type }, ...list]);
      release();
    };
    try {
      audio.current = new AudioContext();
      const analyser = audio.current.createAnalyser(); analyser.fftSize = 64;
      audio.current.createMediaStreamSource(stream.current).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => { analyser.getByteFrequencyData(data); setLevels(Array.from({ length: 9 }, (_, i) => (data[i * 2 + 1] ?? 0) / 255)); frame.current = requestAnimationFrame(tick); };
      tick();
    } catch { /* L’indicateur de niveau est facultatif. */ }
    started.current = Date.now();
    media.start();
    setClock(0); setPhase("recording");
  }
  function stop() {
    if (recorder.current?.state === "recording") recorder.current.stop();
    setPhase("idle"); setClock(0);
  }
  function begin() {
    if (task.prepSeconds) { setClock(0); setPhase("prep"); } else record();
  }
  function remove(url: string) { URL.revokeObjectURL(url); setTakes(list => list.filter(take => take.url !== url)); }
  const left = phase === "prep" ? task.prepSeconds - clock : phase === "recording" ? task.seconds - clock : task.seconds;

  return <>
    <div className="home-top">
      <section className="hero-card" aria-labelledby="tache-titre">
        <span className="hero-chip-row"><span className="hero-chip">Tâche {task.number}</span><span>Oral · Expression orale</span></span>
        <h1 id="tache-titre" className="epreuve-title"><Icon name="mic" size={30} />{task.title}</h1>
        <p>{task.goal} Durée : {formatDuration(task.seconds)}{task.prepSeconds ? `, précédée de ${task.prepSeconds / 60} minutes de préparation` : ", sans préparation"}.</p>
      </section>
      <section className="status-card" aria-labelledby="bon-a-savoir">
        <div className="status-head"><h2 id="bon-a-savoir" className="badge-warn"><Icon name="clock" size={14} />Bon à savoir</h2></div>
        <p className="status-text notice-text">{examiner ? <>L’enregistreur libre garde vos prises dans ce navigateur. Avec l’examinateur, votre voix est envoyée à {examiner} pendant la conversation ; Fluentia conserve la transcription.</> : "Vos enregistrements restent dans ce navigateur et disparaissent à la fermeture de la page. Rien n’est envoyé à Fluentia."}</p>
      </section>
    </div>
    <div className="section-title"><h2>Votre sujet</h2>
      {task.subjects.length > 1 && <div className="series-filter" role="group" aria-label="Choisir un sujet">
        {task.subjects.map((item, index) => <button key={item.title} type="button" aria-pressed={subject === index} disabled={phase !== "idle"} onClick={() => setSubject(index)}>{item.title}</button>)}
      </div>}
    </div>
    <div className="studio">
      <div style={{ display: "grid", gap: "1rem" }}>
        <section className="prompt-card" aria-labelledby="sujet">
          <h2 id="sujet" className="student-eyebrow">Sujet</h2>
          <p>{current.prompt}</p>
          <div className="pill-row" style={{ marginTop: ".9rem" }}>{current.cues.map(cue => <span className="pill" key={cue}>{cue}</span>)}</div>
        </section>
        {examiner && <section className="examiner-launch" aria-labelledby="examinateur">
          <div>
            <h2 id="examinateur">Passer la tâche avec l’examinateur</h2>
            <p>Il vous parle, vous écoute et vous relance, dans le temps officiel.</p>
          </div>
          <Button disabled={phase !== "idle"} onClick={() => setWithExaminer(true)}><Icon name="mic" size={18} />Commencer</Button>
        </section>}
        {withExaminer && <ExaminerSession task={task} subject={current} examiner={examiner} onExit={() => setWithExaminer(false)} />}
        <section className="recorder" aria-labelledby="enregistreur">
          <h2 id="enregistreur" className="sr-only">Enregistreur libre</h2>
          <p className="student-eyebrow">{phase === "prep" ? "Préparation" : phase === "recording" ? "Enregistrement en cours" : "Prêt à commencer"}</p>
          <p className="big-timer">{formatDuration(Math.max(0, left))}</p>
          <div className="level-meter" aria-hidden="true">{levels.map((level, index) => <span key={index} style={{ height: `${8 + level * 32}px` }} />)}</div>
          {phase === "recording"
            ? <button type="button" className="record-button" data-recording onClick={stop}><Icon name="stop" size={28} /><span className="sr-only">Arrêter l’enregistrement</span></button>
            : <button type="button" className="record-button" onClick={phase === "prep" ? () => { setClock(0); record(); } : begin}><Icon name={phase === "prep" ? "play" : "mic"} size={28} /><span className="sr-only">{phase === "prep" ? "Passer la préparation et enregistrer" : task.prepSeconds ? "Lancer la préparation" : "Commencer l’enregistrement"}</span></button>}
          <p className="student-hint" style={{ margin: 0 }}>{phase === "prep" ? "Notez vos idées. L’enregistrement démarre automatiquement à la fin du temps." : phase === "recording" ? "L’enregistrement s’arrête automatiquement à la fin du temps imparti." : task.prepSeconds ? "Le bouton lance d’abord le temps de préparation." : "Le bouton démarre directement l’enregistrement."}</p>
          {error && <p role="alert">{error}</p>}
        </section>
        <section className="student-card" aria-labelledby="prises" style={{ margin: 0 }}>
          <h2 id="prises">Mes prises</h2>
          {!takes.length && <p>Vos enregistrements apparaîtront ici. Réécoutez-vous pour repérer hésitations, répétitions et liaisons.</p>}
          <ul className="take-list">{takes.map((take, index) => <li key={take.url}>
            <strong>Prise {takes.length - index} · {take.at} · {formatDuration(take.seconds)}</strong>
            <audio controls src={take.url} aria-label={`Prise ${takes.length - index}`} />
            <div className="take-actions">
              <a className="button button-secondary plain" href={take.url} download={`fluentia-oral-${task.slug}-prise-${takes.length - index}.${take.type.includes("ogg") ? "ogg" : take.type.includes("mp4") ? "m4a" : "webm"}`}><Icon name="download" size={16} />Télécharger</a>
              <Button variant="ghost" onClick={() => remove(take.url)}><Icon name="trash" size={16} />Supprimer</Button>
            </div>
          </li>)}</ul>
        </section>
      </div>
      <FoldableAside className="studio-aside" label="Repères pour l’oral" tab="Repères">
        <section className="student-card card-muted" aria-labelledby="conseils">
          <div className="studio-card-head"><h2 id="conseils">Conseils</h2></div>
          <ul className="checklist">{task.advice.map(item => <li key={item}>{item}</li>)}</ul>
        </section>
        <nav className="student-card" aria-labelledby="autres-taches">
          <div className="studio-card-head"><h2 id="autres-taches">Autres tâches</h2></div>
          <ul className="activity-list">{others.map(t => <li key={t.slug}><Link href={`/etudiant/expression-orale/${t.slug}`}>Tâche {t.number} — {t.title}</Link><Icon name="chevron" size={16} /></li>)}</ul>
        </nav>
      </FoldableAside>
    </div>
  </>;
}
