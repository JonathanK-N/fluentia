"use client";
/** Sphère décorative sans WebGL ni média. Propriétaire : Jonathan Kakesa. */
import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useMotionPreferences } from "../../components/layout/providers";
export function VoiceOrb({ state = "idle" }: { state?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  const reduced = useReducedMotion();
  const { paused } = useMotionPreferences();
  const [pageVisible, setPageVisible] = useState(true);
  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  const active =
    visible &&
    pageVisible &&
    !paused &&
    !reduced &&
    !["paused", "ended", "error"].includes(state);
  return (
    <div
      ref={ref}
      className="fluentia-orb"
      data-state={state}
      data-animated={active ? "true" : "false"}
      aria-hidden="true"
    >
      <span className="orb-orbit" />
      <span className="orb-orbit orb-orbit-cross" />
      <motion.div
        className="orb-body"
        initial={false}
        animate={
          active
            ? { rotate: [-9, 9, -9], scale: [1, 1.035, 1] }
            : { rotate: 0, scale: 1 }
        }
        transition={
          active
            ? {
                duration: state === "listening" ? 5 : 12,
                repeat: Infinity,
                ease: "easeInOut",
              }
            : { duration: 0 }
        }
      >
        <span className="orb-ribbon" />
        <span className="orb-ribbon orb-ribbon-two" />
        <span className="orb-light" />
      </motion.div>
      <span className="orb-equator" />
    </div>
  );
}
