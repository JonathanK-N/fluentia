"use client";
/** Apparition ponctuelle Motion, sans masquer le contenu SSR. Propriétaire : Jonathan Kakesa. */
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
export function Reveal({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={false}
      whileInView={reduced ? undefined : { y: [12, 0], opacity: [0.8, 1] }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.35 }}
    >
      {children}
    </motion.div>
  );
}
