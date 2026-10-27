"use client";
/** Image d’un document (journal, lettre…) affichée telle quelle, avec agrandissement et zoom. */
import { useEffect, useRef, useState } from "react";
import { Icon } from "../../components/app-shell/icons";

const LEVELS = [1, 1.5, 2, 3];

export function DocumentImage({ src, text, compact = false }: { src: string; text: string; compact?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [level, setLevel] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);
  return <figure className="doc-figure" data-compact={compact || undefined}>
    <button type="button" className="doc-open" onClick={() => { setLevel(0); setOpen(true); }} aria-label="Agrandir le document">
      {/* Image privée servie par l’API selon la tentative : pas d’optimisation Next. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={text} />
      <span className="doc-hint" aria-hidden="true"><Icon name="expand" size={14} />Agrandir</span>
    </button>
    <dialog ref={dialog} className="doc-viewer" aria-label="Document agrandi" onClose={() => setOpen(false)} onClick={event => { if (event.target === dialog.current) setOpen(false); }}>
      <div className="doc-viewer-bar">
        <span>Zoom {Math.round(LEVELS[level]! * 100)} %</span>
        <div>
          <button type="button" onClick={() => setLevel(value => Math.max(0, value - 1))} disabled={level === 0} aria-label="Réduire">−</button>
          <button type="button" onClick={() => setLevel(value => Math.min(LEVELS.length - 1, value + 1))} disabled={level === LEVELS.length - 1} aria-label="Agrandir encore">+</button>
          <button type="button" className="doc-close" onClick={() => setOpen(false)}><Icon name="close" size={14} />Fermer</button>
        </div>
      </div>
      <div className="doc-viewer-body">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {open && <img src={src} alt={text} style={{ width: `${LEVELS[level]! * 100}%` }} />}
      </div>
    </dialog>
  </figure>;
}
