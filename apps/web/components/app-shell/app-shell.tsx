"use client";
/** Coque applicative : navigation latérale groupée, barre supérieure, thème et menu mobile. */
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { SessionProvider, initials, useSession } from "../../lib/session";
import "./app-shell.css";

type Item = { href: string; label: string; icon: IconName; exact?: boolean; children?: { href: string; label: string; aria: string }[] };
type Group = { title: string; items: Item[] };

const tasks = (base: string, label: string) => [1, 2, 3].map(n => ({ href: `${base}/tache-${n}`, label: `Tâche ${n}`, aria: `${label}, tâche ${n}` }));

const studentGroups: Group[] = [
  { title: "Général", items: [
    { href: "/etudiant", label: "Tableau de bord", icon: "home", exact: true },
    { href: "/etudiant/progression", label: "Ma progression", icon: "chart" },
    { href: "/etudiant/plan", label: "Plan d’étude", icon: "calendar" },
    { href: "/etudiant/compte", label: "Mon compte", icon: "user" },
  ] },
  { title: "Compréhension", items: [
    { href: "/etudiant/comprehension-ecrite", label: "Compréhension écrite", icon: "book" },
    { href: "/etudiant/comprehension-orale", label: "Compréhension orale", icon: "headphones" },
  ] },
  { title: "Expression", items: [
    { href: "/etudiant/expression-ecrite", label: "Expression écrite", icon: "pen", children: tasks("/etudiant/expression-ecrite", "Expression écrite") },
    { href: "/etudiant/expression-orale", label: "Expression orale", icon: "mic", children: tasks("/etudiant/expression-orale", "Expression orale") },
  ] },
  { title: "Préparation", items: [
    { href: "/etudiant/examens-blancs", label: "Examens blancs", icon: "exam" },
    { href: "/etudiant/support", label: "Aide et support", icon: "help" },
  ] },
];

const editionGroups: Group[] = [
  { title: "Banque pédagogique", items: [
    { href: "/edition#banque", label: "Versions de la banque", icon: "library" },
    { href: "/edition#editeur", label: "Éditeur de question", icon: "pen" },
    { href: "/edition#relecture", label: "Relecture humaine", icon: "review" },
  ] },
  { title: "Diffusion", items: [
    { href: "/edition#medias", label: "Médias audio", icon: "headphones" },
    { href: "/edition#publication", label: "Publication", icon: "send" },
    { href: "/edition#transfert", label: "Import et export", icon: "upload" },
  ] },
  { title: "Raccourcis", items: [
    { href: "/etudiant", label: "Espace étudiant", icon: "home", exact: true },
  ] },
];

function isActive(pathname: string, item: Item) {
  if (item.href.includes("#")) return false;
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
}

function UserCard({ onNavigate }: { onNavigate: () => void }) {
  const { profile, ready } = useSession();
  return <div className="shell-user">
    <span className="shell-avatar" aria-hidden="true">{ready ? initials(profile) : ""}</span>
    <div>
      <strong>{!ready ? "Session…" : profile ? profile.display_name || "Mon profil" : "Invité"}</strong>
      {ready && (profile ? <span>{profile.email}</span> : <Link href="/etudiant/compte" onClick={onNavigate}>Se connecter</Link>)}
    </div>
  </div>;
}

function Shell({ variant, children }: { variant: "student" | "edition"; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const groups = variant === "edition" ? editionGroups : studentGroups;
  const current = groups.flatMap(group => group.items).find(item => isActive(pathname, item));
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); toggleRef.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  const close = () => setOpen(false);
  return <div className="app-shell" data-open={open || undefined}>
    <aside id="shell-sidebar" className="shell-sidebar">
      <div className="shell-brand">
        <Link href="/" className="shell-logo" aria-label="Fluentia — accueil">
          <Image className="logo-light" src="/branding/01_Logos_PNG/logo-horizontal-light.png" alt="" width={150} height={39} unoptimized />
          <Image className="logo-dark" src="/branding/01_Logos_PNG/logo-horizontal-dark.png" alt="" width={150} height={39} unoptimized />
        </Link>
        <span className="shell-tagline">{variant === "edition" ? "Espace éditorial" : "Préparation TCF"}</span>
      </div>
      <nav aria-label={variant === "edition" ? "Navigation éditoriale" : "Navigation de l’espace étudiant"} className="shell-nav">
        {groups.map(group => <div key={group.title} className="shell-group">
          <p className="shell-group-title">{group.title}</p>
          <ul>{group.items.map(item => {
            const active = isActive(pathname, item);
            return <li key={item.href}>
              <Link href={item.href} onClick={close} className="shell-link" aria-current={active && (pathname === item.href || !item.children) ? "page" : undefined} data-active={active || undefined}>
                <Icon name={item.icon} /><span>{item.label}</span>
              </Link>
              {item.children && active && <ul className="shell-sublist">{item.children.map(child =>
                <li key={child.href}><Link href={child.href} onClick={close} aria-label={child.aria} aria-current={pathname === child.href ? "page" : undefined} className="shell-sublink">{child.label}</Link></li>)}
              </ul>}
            </li>;
          })}</ul>
        </div>)}
      </nav>
      <UserCard onNavigate={close} />
    </aside>
    <button type="button" className="shell-backdrop" tabIndex={-1} aria-hidden="true" onClick={close} />
    <div className="shell-main">
      <header className="shell-topbar">
        <button ref={toggleRef} type="button" className="shell-icon-button shell-menu-button" aria-expanded={open} aria-controls="shell-sidebar" onClick={() => setOpen(value => !value)}>
          <Icon name={open ? "close" : "menu"} /><span className="sr-only">{open ? "Fermer la navigation" : "Ouvrir la navigation"}</span>
        </button>
        <p className="shell-crumb"><span>{variant === "edition" ? "Édition" : "Espace étudiant"}</span>{current && <><Icon name="chevron" size={14} /><span>{current.label}</span></>}</p>
        <div className="shell-actions">
          <Link href="/" className="shell-text-link">Site public</Link>
        </div>
      </header>
      <main id="contenu" tabIndex={-1} className="shell-content student-space">{children}</main>
    </div>
  </div>;
}

export function AppShell({ variant = "student", children }: { variant?: "student" | "edition"; children: ReactNode }) {
  return <SessionProvider><Shell variant={variant}>{children}</Shell></SessionProvider>;
}
