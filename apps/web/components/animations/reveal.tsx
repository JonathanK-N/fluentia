"use client";
/** Apparition ponctuelle Motion, sans masquer le contenu SSR. Propriétaire : Jonathan Kakesa. */
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useMotionPreferences } from "../layout/providers";
export function Reveal({ children }: { children: ReactNode }) {
  const { paused, reduced } = useMotionPreferences();
  return (
    <motion.div
      initial={false}
      whileInView={
        reduced || paused ? undefined : { y: [12, 0], opacity: [0.8, 1] }
      }
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.35 }}
    >
      {children}
    </motion.div>
  );
}
