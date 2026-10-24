"use client";
/** Politique globale de mouvement, dépendance Motion. Propriétaire : Jonathan Kakesa. */
import { MotionConfig } from "motion/react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
const MotionPreferences = createContext({ paused: false, toggle: () => {} });
export const useMotionPreferences = () => useContext(MotionPreferences);
export function Providers({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.motion = paused ? "paused" : "enabled";
    return () => {
      delete document.documentElement.dataset.motion;
    };
  }, [paused]);
  return (
    <MotionPreferences.Provider
      value={{ paused, toggle: () => setPaused((value) => !value) }}
    >
      <MotionConfig reducedMotion={paused ? "always" : "user"}>
        {children}
      </MotionConfig>
    </MotionPreferences.Provider>
  );
}
