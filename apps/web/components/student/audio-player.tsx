"use client";
import { useRef, useState } from "react";
import { Icon } from "../app-shell/icons";

function clock(seconds: number) {
  const total = Number.isFinite(seconds) ? Math.floor(seconds) : 0;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Lecteur du document : diffusé en continu dès l’affichage de la question, réécoutable à volonté. */
export function AudioPlayer({attemptId, questionId}: {attemptId: string; questionId: string}) {
  const player = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  function toggle() {
    const audio = player.current;
    if (!audio) return;
    setError("");
    if (!audio.paused) {audio.pause(); return;}
    if (audio.ended) audio.currentTime = 0;
    audio.play().catch(() => setError("La lecture a été bloquée par le navigateur. Activez le son puis réessayez."));
  }
  return <div className="student-audio audio-player">
    {/* Le navigateur commence le chargement dès l’affichage : la lecture démarre sans attendre le fichier entier. */}
    <audio ref={player} src={`/api/v1/attempts/${attemptId}/questions/${questionId}/audio/`} preload="auto"
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
      onWaiting={() => setWaiting(true)} onPlaying={() => setWaiting(false)} onCanPlay={() => setWaiting(false)}
      onLoadedMetadata={event => setDuration(event.currentTarget.duration)} onTimeUpdate={event => setTime(event.currentTarget.currentTime)}
      onError={() => setError("Le document audio n’a pas pu être chargé. Vérifiez votre connexion puis réessayez.")} />
    <button type="button" className="audio-toggle" onClick={toggle} aria-label={playing ? "Mettre le document en pause" : "Écouter le document"} data-waiting={waiting || undefined}>
      <Icon name={playing ? "pause" : "play"} size={22} />
    </button>
    <input type="range" className="audio-seek" min={0} max={duration || 0} step={0.1} value={Math.min(time, duration || 0)} aria-label="Position dans le document"
      onChange={event => {if (player.current) player.current.currentTime = Number(event.target.value);}} disabled={!duration} />
    <span className="audio-time">{clock(time)} / {clock(duration)}</span>
    {error && <p role="alert">{error}</p>}
  </div>;
}
