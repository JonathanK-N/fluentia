"use client";
/** Aperçu animé d’une tâche 2 avec l’examinateur : exemple prédéfini, sans micro ni réseau. Propriétaire : Jonathan Kakesa. */
import { useEffect, useRef, useState } from "react";
import { useMotionPreferences } from "../../components/layout/providers";
import { sampleConversation } from "./content";

const LINE_MS = 3400;
const TOTAL = 330; // 5 min 30 : durée officielle de la tâche 2

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function SessionPreview() {
  const { paused, reduced } = useMotionPreferences();
  const still = paused || reduced;
  const [shown, setShown] = useState(1);
  const [visible, setVisible] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const running = !still && visible;
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () => setShown((count) => (count >= sampleConversation.length + 1 ? 1 : count + 1)),
      LINE_MS,
    );
    return () => window.clearInterval(timer);
  }, [running]);

  const count = still ? sampleConversation.length : Math.min(shown, sampleConversation.length);
  const lines = sampleConversation.slice(0, count);
  const speaker = lines[lines.length - 1]?.speaker ?? "examiner";
  const remaining = TOTAL - 41 - (count - 1) * 9;

  return (
    <div ref={ref} className="session-preview" data-speaker={speaker} data-running={running ? "true" : "false"}>
      <div className="session-preview-bar">
        <div>
          <span className="session-preview-kicker">Expression orale · Tâche 2</span>
          <strong>Exercice en interaction</strong>
        </div>
        <span className="session-preview-clock" aria-label={`Temps restant : ${clock(remaining)}`}>
          <svg viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="15.5" />
            <circle cx="18" cy="18" r="15.5" pathLength={100} strokeDasharray={`${(remaining / TOTAL) * 100} 100`} />
          </svg>
          {clock(remaining)}
        </span>
      </div>
      <div className="session-preview-voice" aria-hidden="true">
        <span className="voice-dot">
          <span />
          <span />
          <span />
        </span>
        <span className="voice-caption">{speaker === "examiner" ? "L’examinateur parle" : "Vous parlez"}</span>
      </div>
      <ol className="session-preview-lines" aria-label="Exemple d’échange avec l’examinateur">
        {lines.map((line, index) => (
          <li key={index} data-speaker={line.speaker}>
            <span>{line.speaker === "examiner" ? "Examinateur" : "Vous"}</span>
            <p>{line.text}</p>
          </li>
        ))}
      </ol>
      <p className="session-preview-note">Exemple d’échange · aucune donnée réelle</p>
    </div>
  );
}
