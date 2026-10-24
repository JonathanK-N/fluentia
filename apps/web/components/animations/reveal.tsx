"use client";
/** Apparition ponctuelle Motion, sans masquer le contenu SSR. Propriétaire : Jonathan Kakesa. */
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useMotionPreferences } from "../layout/providers";
export function Reveal({
  children,
  subtle = false,
}: {
  children: ReactNode;
  subtle?: boolean;
}) {
  const { paused, reduced } = useMotionPreferences();
  return (
    <motion.div
      initial={false}
      whileInView={
        reduced || paused
          ? undefined
          : subtle
            ? { opacity: [0.97, 1] }
            : { y: [12, 0], opacity: [0.8, 1] }
      }
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: subtle ? 0.18 : 0.35 }}
    >
      {children}
    </motion.div>
  );
}
