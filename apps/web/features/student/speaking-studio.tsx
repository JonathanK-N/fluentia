"use client";
/** Studio d’expression orale : préparation, enregistrement local et réécoute. Aucun son n’est envoyé au serveur. */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/primitives";
import { Icon } from "../../components/app-shell/icons";
import { formatDuration, speakingTasks, type SpeakingTask } from "./content";
import { Notice, PageHead } from "./ui";

type Take = { url: string; seconds: number; at: string; type: string };
type Phase = "idle" | "prep" | "recording";

export function SpeakingStudio({ task }: { task: SpeakingTask }) {
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
    <PageHead eyebrow={`Oral · Tâche ${task.number}`} title={task.title}>{task.goal} Durée : {formatDuration(task.seconds)}{task.prepSeconds ? `, précédée de ${task.prepSeconds / 60} minutes de préparation` : ", sans préparation"}.</PageHead>
    <div className="segmented" role="group" aria-label="Choisir un sujet">
      {task.subjects.map((item, index) => <Button key={item.title} variant="ghost" aria-pressed={subject === index} disabled={phase !== "idle"} onClick={() => setSubject(index)}>{item.title}</Button>)}
    </div>
    <div className="studio">
      <div style={{ display: "grid", gap: "1rem" }}>
        <section className="prompt-card" aria-labelledby="sujet">
          <h2 id="sujet" className="student-eyebrow">Sujet</h2>
          <p>{current.prompt}</p>
          <div className="pill-row" style={{ marginTop: ".9rem" }}>{current.cues.map(cue => <span className="pill" key={cue}>{cue}</span>)}</div>
        </section>
        <section className="recorder" aria-labelledby="enregistreur">
          <h2 id="enregistreur" className="sr-only">Enregistreur</h2>
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
      <aside className="studio-aside" aria-label="Repères pour l’oral">
        <Notice icon="mic">Vos enregistrements restent dans ce navigateur et disparaissent à la fermeture de la page. Rien n’est envoyé à Fluentia.</Notice>
        <section className="student-card card-muted">
          <h2 className="student-eyebrow">Conseils</h2>
          <ul className="checklist">{task.advice.map(item => <li key={item}>{item}</li>)}</ul>
        </section>
        <nav aria-label="Autres tâches d’oral" className="student-card">
          <h2 className="student-eyebrow">Autres tâches</h2>
          <ul className="checklist">{speakingTasks.filter(t => t.slug !== task.slug).map(t => <li key={t.slug}><Link href={`/etudiant/expression-orale/${t.slug}`}>Tâche {t.number} — {t.title}</Link></li>)}</ul>
        </nav>
      </aside>
    </div>
  </>;
}
