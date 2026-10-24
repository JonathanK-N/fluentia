"use client";
/** Sphère décorative sans WebGL ni média. Propriétaire : Jonathan Kakesa. */
import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useMotionPreferences } from "../../components/layout/providers";
export function VoiceOrb({ state = "idle" }: { state?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  const { paused, reduced } = useMotionPreferences();
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
    ["listening", "speaking"].includes(state);
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
          active ? { rotate: 0, scale: [1, 1.018, 1] } : { rotate: 0, scale: 1 }
        }
        transition={
          active
            ? {
                duration: 0.18,
                repeat: 0,
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
