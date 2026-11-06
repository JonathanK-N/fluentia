"use client";
import { useState } from "react";
import Image from "next/image";
import { Button } from "../../components/ui/primitives";
/** Exemple pédagogique prédéfini, sans appel réseau. Propriétaire : Jonathan Kakesa. */
export function CoachDemo() {
  const [feedback, setFeedback] = useState(false);
  return (
    <div className="coach-demo">
      <div className="stage-meta">
        <span>VOTRE PROCHAINE ÉTAPE</span>
        <span className="badge">Exemple fictif</span>
      </div>
      <div className="coach-message">
        <span className="coach-avatar" aria-hidden="true">
          <Image
            src="/branding/01_Logos_PNG/fluentia-symbole-transparent-256.png"
            alt=""
            width={26}
            height={26}
            loading="eager"
            unoptimized
          />
        </span>
        <div>
          <p className="landing-small">UNE INTENTION À LA FOIS</p>
          <h3>Et si on rendait votre idée plus précise ?</h3>
          <p>« Je voudrais organiser une sortie. »</p>
        </div>
      </div>
      <div
        className="coach-response"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {feedback ? (
          <>
            <strong>Ajoutez un lieu et une raison.</strong>
            <p>
              Par exemple : « Je propose une sortie à la bibliothèque pour
              pratiquer le français ensemble. »
            </p>
            <span className="landing-small">
              Retour prédéfini, sans évaluation ni score.
            </span>
          </>
        ) : (
          <>
            <strong>Une idée claire est un bon début.</strong>
            <p>
              Découvrez une piste de reformulation pour aller un peu plus loin.
            </p>
          </>
        )}
      </div>
      <Button
        variant="secondary"
        aria-pressed={feedback}
        onClick={() => setFeedback(!feedback)}
      >
        {feedback ? "Revoir la phrase de départ" : "Voir le conseil d’exemple"}
        <span aria-hidden="true">↗</span>
      </Button>
    </div>
  );
}
