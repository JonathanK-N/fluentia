"use client";
import { motion, useReducedMotion, useScroll } from "motion/react";
import { VoiceOrb } from "./orb";
import { useMotionPreferences } from "../../components/layout/providers";
/** Entrée Discover et repère de lecture. Propriétaire : Jonathan Kakesa. */
export function Hero() {
  const { paused } = useMotionPreferences();
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  return (
    <section className="landing-hero" aria-labelledby="hero-title">
      <motion.div
        aria-hidden="true"
        className="reading-progress"
        style={{ scaleX: scrollYProgress }}
      />
      <div className="container landing-hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" /> LE FRANÇAIS OUVRE DES PORTES
          </p>
          <motion.h1
            id="hero-title"
            initial={false}
            whileInView={
              paused || reduced ? undefined : { opacity: [0.7, 1], y: [10, 0] }
            }
            transition={{ duration: 0.65 }}
            viewport={{ once: true }}
          >
            Maîtrisez
            <br />
            le français,
            <br />
            <span>allez plus loin.</span>
          </motion.h1>
          <p className="lead">
            Votre projet au Québec commence par une voix qui prend confiance.
            Découvrez une préparation au TCF pensée pour avancer avec vous.
          </p>
          <div className="actions">
            <a href="#fonctionnalites" className="button button-primary">
              Découvrir Fluentia <span aria-hidden="true">↗</span>
            </a>
            <a href="#voice" className="landing-text-link">
              Essayer la démo Voice <span aria-hidden="true">↓</span>
            </a>
          </div>
          <p className="landing-small">
            Plateforme en développement · Démonstrations accessibles sans
            compte.
          </p>
        </div>
        <div className="hero-visual">
          <div className="hero-visual-heading">
            <span>FLUENTIA / VOICE</span>
            <span>APERÇU VISUEL</span>
          </div>
          <VoiceOrb />
          <p className="orb-caption">
            Une voix.
            <br />
            <strong>De nouvelles possibilités.</strong>
          </p>
          <div className="hero-signal" aria-hidden="true">
            {[12, 22, 16, 32, 42, 26, 52, 36, 20, 40, 28, 14, 22].map(
              (height, index) => (
                <i key={index} style={{ height }} />
              ),
            )}
          </div>
        </div>
      </div>
      <div className="container hero-index">
        <span>UNE PRÉPARATION, QUATRE COMPÉTENCES</span>
        <a href="#fonctionnalites">
          Écouter · Lire · Parler · Écrire <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}
