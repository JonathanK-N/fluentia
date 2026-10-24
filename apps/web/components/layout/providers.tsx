"use client";
/** Politique globale de mouvement, dépendance Motion. Propriétaire : Jonathan Kakesa. */
import { MotionConfig } from "motion/react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
const MotionPreferences = createContext({
  paused: false,
  reduced: false,
  toggle: () => {},
});
const query = "(prefers-reduced-motion: reduce)";
function subscribe(onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
const snapshot = () => window.matchMedia(query).matches;
const serverSnapshot = () => false;
export const useMotionPreferences = () => useContext(MotionPreferences);
export function Providers({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  const reduced = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  useEffect(() => {
    document.documentElement.dataset.motion = paused ? "paused" : "enabled";
    return () => {
      delete document.documentElement.dataset.motion;
    };
  }, [paused]);
  return (
    <MotionPreferences.Provider
      value={{ paused, reduced, toggle: () => setPaused((value) => !value) }}
    >
      <MotionConfig reducedMotion={paused || reduced ? "always" : "never"}>
        {children}
      </MotionConfig>
    </MotionPreferences.Provider>
  );
}
