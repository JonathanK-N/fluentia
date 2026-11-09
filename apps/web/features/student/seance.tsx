"use client";
/** Pièces communes aux séances de Rédaction et d’Oral : barre marine, en-tête avec les tâches, compteur circulaire. */
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "../../components/app-shell/icons";
import { formatDuration } from "./content";

export function SeanceBar({ label, children, menuOpen, onMenu }: { label: string; children: ReactNode; menuOpen?: boolean; onMenu?: () => void }) {
  return <header className="seance-bar">
    <div className="seance-brand">
      {onMenu && <button type="button" className="seance-menu" aria-expanded={menuOpen} aria-controls="shell-sidebar" aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} onClick={onMenu}><Icon name="menu" size={18} /></button>}
      <Image src="/branding/01_Logos_PNG/fluentia-symbole-transparent-256.png" alt="" width={30} height={30} unoptimized />
      <strong>Fluentia</strong><span aria-hidden="true" className="seance-sep" /><span>Séance · {label}</span>
    </div>
    {children}
  </header>;
}

/** En-tête de séance : étiquettes, titre du sujet, sous-titre et, si `base` est donné, le sélecteur Tâche 1 / 2 / 3. */
export function SeanceHead({ chips, title, subtitle, base, current, locked = false, onLeave }: {
  chips: { label: string; tone?: "warn" }[]; title: string; subtitle: string; base?: string; current: number; locked?: boolean; onLeave?: () => void;
}) {
  return <div className="oral-head">
    <div className="seance-head">
      <p className="seance-chips">{chips.map(chip => <span key={chip.label} className="seance-chip" data-tone={chip.tone}>{chip.label}</span>)}</p>
      <h1 id="seance-title">{title}</h1>
      <p>{subtitle}</p>
    </div>
    {base && <nav className="oral-tasks" aria-label="Tâches">
      {[1, 2, 3].map(number => number === current
        ? <span key={number} aria-current="page">Tâche {number}</span>
        : locked
          ? <span key={number} aria-disabled="true" title="Terminez d’abord la tâche en cours">Tâche {number}</span>
          : <Link key={number} href={`${base}/tache-${number}`} onClick={onLeave}>Tâche {number}</Link>)}
    </nav>}
  </div>;
}

/** Anneau de progression avec une valeur au centre (temps restant, nombre de mots…). */
export function Ring({ label, value, caption, progress, ariaLabel }: { label: string; value: string; caption: string; progress: number; ariaLabel: string }) {
  const circumference = 2 * Math.PI * 26;
  return <div className="examiner-timer" role="timer" aria-label={ariaLabel}>
    <svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="26" /><circle cx="30" cy="30" r="26" data-progress strokeDasharray={circumference} strokeDashoffset={circumference * (1 - Math.max(0, Math.min(1, progress)))} /></svg>
    <span><small>{label}</small><strong>{value}</strong><small>{caption}</small></span>
  </div>;
}

export function Timer({ left, progress, label, total }: { left: number; progress: number; label: string; total: number }) {
  return <Ring label={label} value={formatDuration(left)} caption={`sur ${formatDuration(total)}`} progress={progress} ariaLabel={`${label} : ${formatDuration(left)} sur ${formatDuration(total)}`} />;
}
