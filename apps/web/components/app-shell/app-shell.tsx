"use client";
/** Coque applicative : navigation latérale sombre, en-tête de page et menu qui pousse le contenu. */
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
  { title: "Mon espace", items: [
    { href: "/etudiant", label: "Accueil", icon: "grid", exact: true },
    { href: "/etudiant/progression", label: "Mes résultats", icon: "trend" },
    { href: "/etudiant/plan", label: "Mon programme", icon: "calendar" },
    { href: "/etudiant/compte", label: "Profil", icon: "user" },
  ] },
  { title: "Les 4 épreuves", items: [
    { href: "/etudiant/comprehension-ecrite", label: "Lecture", icon: "book" },
    { href: "/etudiant/comprehension-orale", label: "Écoute", icon: "headphones" },
    { href: "/etudiant/expression-ecrite", label: "Rédaction", icon: "pen", children: tasks("/etudiant/expression-ecrite", "Rédaction") },
    { href: "/etudiant/expression-orale", label: "Oral", icon: "mic", children: tasks("/etudiant/expression-orale", "Oral") },
  ] },
  { title: "Jour J", items: [
    { href: "/etudiant/examens-blancs", label: "Simulations TCF", icon: "timer" },
    { href: "/etudiant/support", label: "Centre d’aide", icon: "help" },
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
    { href: "/etudiant", label: "Espace étudiant", icon: "grid", exact: true },
  ] },
];

/** Titres des pages hors navigation (passation, vérification). */
const extraTitles: [RegExp, string][] = [
  [/^\/etudiant\/lecture\//, "Lecture"],
  [/^\/etudiant\/ecoute\//, "Écoute"],
  [/^\/etudiant\/verifier/, "Vérification de l’adresse"],
  [/^\/edition/, "Banque pédagogique"],
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

function Brand({ variant }: { variant: "student" | "edition" }) {
  return <Link href="/" className="shell-brand" aria-label="Fluentia — accueil du site">
    <Image src="/branding/01_Logos_PNG/fluentia-symbole-transparent-256.png" alt="" width={34} height={34} unoptimized />
    <span><strong>Fluentia</strong><small>{variant === "edition" ? "Espace éditorial" : "Objectif TCF"}</small></span>
  </Link>;
}

function Shell({ variant, children }: { variant: "student" | "edition"; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const groups = variant === "edition" ? editionGroups : studentGroups;
  const current = groups.flatMap(group => group.items).find(item => isActive(pathname, item));
  const title = current?.label ?? extraTitles.find(([pattern]) => pattern.test(pathname))?.[1] ?? "Espace étudiant";
  // Pages d’épreuve : fil d’Ariane dans l’en-tête, le titre principal est porté par le bandeau.
  const epreuve = variant === "student" && studentGroups[1]!.items.find(item => item.href === pathname);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); toggleRef.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  const close = () => setOpen(false);
  return <div className="app-shell" data-open={open || undefined}>
    <div className="shell-mobilebar">
      <button ref={toggleRef} type="button" className="shell-icon-button" aria-expanded={open} aria-controls="shell-sidebar" onClick={() => setOpen(value => !value)}>
        <Icon name={open ? "close" : "menu"} /><span className="sr-only">{open ? "Fermer la navigation" : "Ouvrir la navigation"}</span>
      </button>
      <Brand variant={variant} />
    </div>
    <aside id="shell-sidebar" className="shell-sidebar">
      <Brand variant={variant} />
      <nav aria-label={variant === "edition" ? "Navigation éditoriale" : "Navigation de l’espace étudiant"} className="shell-nav">
        {groups.map(group => <div key={group.title} className="shell-group">
          <p className="shell-group-title">{group.title}</p>
          <ul>{group.items.map(item => {
            const active = isActive(pathname, item);
            return <li key={item.href}>
              <Link href={item.href} onClick={close} className="shell-link" aria-current={active && (pathname === item.href || !item.children) ? "page" : undefined} data-active={active || undefined}>
                <Icon name={item.icon} size={18} /><span>{item.label}</span>
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
    <div className="shell-main">
      <main id="contenu" tabIndex={-1} className="shell-content student-space">
        <header className="shell-pagehead">
          {epreuve ? <nav aria-label="Fil d’Ariane" className="shell-breadcrumb"><ol>
            <li><Link className="crumb" href="/etudiant">Accueil</Link></li>
            <li><Link className="crumb" href="/etudiant#epreuves">Les 4 épreuves</Link></li>
            <li aria-current="page">{epreuve.label}</li>
          </ol></nav> : <div>
            <p className="shell-eyebrow">{variant === "edition" ? "Espace éditorial" : "Espace étudiant"}</p>
            <h1>{title}</h1>
          </div>}
          <Link href="/" className="shell-site-link">Voir le site<Icon name="external" size={14} /></Link>
        </header>
        {children}
      </main>
    </div>
  </div>;
}

export function AppShell({ variant = "student", children }: { variant?: "student" | "edition"; children: ReactNode }) {
  return <SessionProvider><Shell variant={variant}>{children}</Shell></SessionProvider>;
}
