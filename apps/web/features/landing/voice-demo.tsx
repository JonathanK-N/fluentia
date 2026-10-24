"use client";
/** Machine d’états manuelle, sans microphone ni service distant. Propriétaire : Jonathan Kakesa. */
import { useRef, useState } from "react";
import { Button } from "../../components/ui/primitives";
import { VoiceOrb } from "./orb";
export type VoiceState =
  "idle" | "listening" | "analysis" | "speaking" | "paused" | "error" | "ended";
const states: Record<VoiceState, { title: string; detail: string }> = {
  idle: {
    title: "Votre voix a de l’avenir.",
    detail: "Lancez la démonstration. Aucun microphone n’est activé.",
  },
  listening: {
    title: "À vous de jouer.",
    detail:
      "Écoute simulée. Imaginez que vous présentez une activité à un ami.",
  },
  analysis: {
    title: "Un instant pour réfléchir.",
    detail: "Analyse simulée. Aucun enregistrement ni traitement n’a lieu.",
  },
  speaking: {
    title: "Une piste pour progresser.",
    detail:
      "Exemple de retour : précisez le lieu et expliquez pourquoi cette activité vous plaît.",
  },
  paused: {
    title: "On reprend à votre rythme.",
    detail: "La démonstration est en pause. Votre étape est conservée.",
  },
  error: {
    title: "Un contretemps, une autre chance.",
    detail:
      "Erreur de démonstration. Réessayez pour revenir à l’étape d’écoute simulée.",
  },
  ended: {
    title: "Chaque prise de parole compte.",
    detail:
      "Démonstration terminée. Vous pouvez recommencer, sans donnée enregistrée.",
  },
};
export function VoiceDemo() {
  const [state, setState] = useState<VoiceState>("idle");
  const [previous, setPrevious] = useState<VoiceState>("listening");
  const primary = useRef<HTMLButtonElement>(null);
  const active = ["listening", "analysis", "speaking"].includes(state);
  function advance() {
    setState(
      state === "listening"
        ? "analysis"
        : state === "analysis"
          ? "speaking"
          : "ended",
    );
  }
  return (
    <section
      className="landing-section voice-section"
      id="voice"
      aria-labelledby="voice-title"
    >
      <div className="container voice-layout">
        <div className="voice-description">
          <p className="eyebrow">03 / FLUENTIA VOICE</p>
          <h2 id="voice-title">
            La confiance
            <br />
            prend la parole.
          </h2>
          <p className="lead">
            Un espace pensé pour oser, chercher vos mots et essayer encore.
            Découvrez l’expérience d’un entraînement oral, à votre rythme.
          </p>
          <p>
            Une question, une réponse, une piste pour avancer. La voix devient
            un terrain de pratique, sans jugement.
          </p>
          <div className="voice-promise">
            <span aria-hidden="true">◎</span>
            <p>
              <strong>Vous gardez le contrôle.</strong>
              <br />
              Simulation graphique et textuelle uniquement. Aucun accès au
              microphone, aucun son, aucune IA connectée.
            </p>
          </div>
        </div>
        <div className="voice-stage">
          <noscript>
            <p>
              La démonstration interactive nécessite JavaScript. La présentation
              et la sphère statique restent disponibles.
            </p>
          </noscript>
          <div className="stage-meta">
            <span className="badge">Démonstration interactive</span>
            <span>MICROPHONE INACTIF</span>
          </div>
          <VoiceOrb state={state} />
          <div
            className="voice-status"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            data-voice-state={state}
          >
            <h3>{states[state].title}</h3>
            <p>{states[state].detail}</p>
          </div>
          <div className="voice-controls">
            <Button
              ref={primary}
              disabled={state === "paused"}
              onClick={() => {
                if (active) advance();
                else setState("listening");
                primary.current?.focus();
              }}
            >
              {state === "idle"
                ? "Lancer la démo"
                : state === "ended"
                  ? "Recommencer la démo"
                  : state === "error"
                    ? "Réessayer la démo"
                    : state === "paused"
                      ? "Démo en pause"
                      : "Étape suivante"}
              <span aria-hidden="true">→</span>
            </Button>
            <Button
              variant="secondary"
              disabled={!active && state !== "paused"}
              onClick={() => {
                if (state === "paused") setState(previous);
                else {
                  setPrevious(state);
                  setState("paused");
                }
              }}
            >
              {state === "paused" ? "Reprendre la démo" : "Mettre en pause"}
            </Button>
          </div>
          <div className="voice-secondary-controls">
            <Button
              variant="ghost"
              disabled={!active && state !== "error"}
              onClick={() => setState("error")}
            >
              Simuler une erreur
            </Button>
            <Button
              variant="ghost"
              disabled={state === "idle" || state === "ended"}
              onClick={() => {
                setState("ended");
                primary.current?.focus();
              }}
            >
              Terminer la démo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
