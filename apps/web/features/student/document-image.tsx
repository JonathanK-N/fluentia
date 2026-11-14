"use client";
/** Image d’un document (journal, lettre…) : un clic l’agrandit à la taille de l’écran, un autre clic la referme. */
import { useEffect, useRef, useState } from "react";
import { Icon } from "../../components/app-shell/icons";

export function DocumentImage({ src, text, compact = false }: { src: string; text: string; compact?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);
  return <figure className="doc-figure" data-compact={compact || undefined}>
    <button type="button" className="doc-open" onClick={() => setOpen(true)} aria-label="Agrandir le document">
      {/* Image privée servie par l’API selon la tentative : pas d’optimisation Next. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={text} />
      <span className="doc-hint" aria-hidden="true"><Icon name="expand" size={14} />Agrandir</span>
    </button>
    {/* Un clic n’importe où sur le document agrandi le referme ; Échap aussi. */}
    <dialog ref={dialog} className="doc-viewer doc-viewer-fit" aria-label="Document agrandi" onClose={() => setOpen(false)} onClick={() => setOpen(false)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {open && <img src={src} alt={text} />}
    </dialog>
  </figure>;
}
