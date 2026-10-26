"use client";
import { useEffect, useRef, useState } from "react";
import { fileRequest } from "../../lib/student-api";
import { Button } from "../ui/primitives";

export function AudioPlayer({attemptId, questionId, simulation, state, endsAt, serverOffset, refresh}: {
  attemptId: string; questionId: string; simulation: boolean; state: string; endsAt?: string; serverOffset: number; refresh: () => Promise<void>;
}) {
  const player = useRef<HTMLAudioElement>(null);
  const objectUrl = useRef("");
  const played = useRef(false);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [playable, setPlayable] = useState(false);
  useEffect(() => () => {if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);}, []);
  useEffect(() => {
    if (state !== "playing" || !endsAt) return;
    const timer = setTimeout(() => {refresh().catch(e => setError(e.message));}, Math.max(0, Date.parse(endsAt) - Date.now() - serverOffset) + 250);
    return () => clearTimeout(timer);
  }, [state, endsAt, serverOffset, refresh]);
  async function load() {
    setBusy(true); setError("");
    try {
      const response = await fileRequest(`attempts/${attemptId}/questions/${questionId}/audio/`, "POST");
      const blob = await response.blob();
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(blob);
      setUrl(objectUrl.current);
      await refresh();
    } catch (e) {setError((e as Error).message); await refresh().catch(() => {});}
    finally {setBusy(false);}
  }
  function play() {
    setError("");
    if (!player.current) {setError("Le lecteur n’est pas prêt. Réessayez sans recharger la page."); return;}
    player.current.play().catch(() => setError("La lecture a été bloquée. Activez le son puis réessayez sans recharger la page."));
  }
  const canLoad = simulation ? state === "available" && !url : !url;
  return <div className="student-audio">
    <p>{simulation ? "Une seule délivrance du document. Le délai inclut le chargement ; ne rechargez pas la page pendant l’écoute." : "Vous pouvez écouter le document plusieurs fois et consulter sa transcription."}</p>
    {canLoad && <Button variant="secondary" loading={busy} onClick={load}>Charger le document audio</Button>}
    {url && <>
      {/* Le clic de lecture est explicite pour respecter les restrictions des navigateurs. */}
      <audio ref={player} src={url} controls={!simulation} preload="auto" aria-label="Document de compréhension orale" onCanPlay={() => setPlayable(true)} onPlay={() => {played.current = true; setPlaying(true);}} onPause={() => setPlaying(false)} onEnded={() => {setPlaying(false); refresh().catch(e => setError(e.message));}} onError={() => setError("La lecture du média a échoué. En simulation, une délivrance consommée ne peut pas être rejouée.")} />
      {simulation && !playing && !played.current && <Button onClick={play} disabled={busy || !playable}>Écouter le document chargé</Button>}
      {!simulation && <Button onClick={play} disabled={playing || busy || !playable}>Lire le document</Button>}
      {simulation && playing && <p role="status">Lecture du document…</p>}
    </>}
    {simulation && !url && ["playing", "ready", "past"].includes(state) && <p>Ce document a déjà été délivré. Sa lecture ne peut pas être restaurée après un rechargement ; les réponses enregistrées sont conservées.</p>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
