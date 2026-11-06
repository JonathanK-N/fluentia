"use client";
/** Colonne d’outils à droite, repliable : repliée, elle laisse sa place à la colonne principale. Le choix vaut pour toutes les pages. */
import { useId, type ReactNode } from "react";
import { Icon } from "../../components/app-shell/icons";
import { useFoldable } from "../../lib/foldable";

export function FoldableAside({ label, tab, className, children }: { label: string; tab: string; className: string; children: ReactNode }) {
  const [folded, fold] = useFoldable("fluentia-outils-replies");
  const id = useId();
  return <aside className={`${className} foldable-aside`} aria-label={label} data-folded={folded || undefined}>
    {folded
      ? <button type="button" className="aside-tab" aria-expanded="false" aria-controls={id} onClick={() => fold(false)}>
        <Icon name="chevron" size={16} aria-hidden="true" /><span>{tab}</span><span className="sr-only"> : afficher</span>
      </button>
      : <button type="button" className="aside-fold" aria-expanded="true" aria-controls={id} onClick={() => fold(true)}>
        Masquer<span className="sr-only"> : {label}</span><Icon name="chevron" size={14} aria-hidden="true" />
      </button>}
    <div id={id} className="aside-body" hidden={folded}>{children}</div>
  </aside>;
}
