"use client";
/** Coque applicative : navigation latérale sombre, en-tête de page et menu qui pousse le contenu. */
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { SessionProvider, initials, useSession } from "../../lib/session";
import { api } from "../../lib/student-api";
import { useFoldable } from "../../lib/foldable";
import "./app-shell.css";

type Item = { href: string; label: string; icon: IconName; exact?: boolean; external?: boolean };
type Group = { title: string; items: Item[] };


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
    { href: "/etudiant/expression-ecrite", label: "Rédaction", icon: "pen" },
    { href: "/etudiant/expression-orale", label: "Oral", icon: "mic" },
  ] },
  { title: "Jour J", items: [
    { href: "/etudiant/examens-blancs", label: "Simulations TCF", icon: "timer" },
    { href: "/etudiant/support", label: "Centre d’aide", icon: "help" },
  ] },
];

const editionGroups: Group[] = [
  { title: "Séries", items: [
    { href: "/edition/import", label: "Importer une série", icon: "upload" },
  ] },
  { title: "Banque pédagogique", items: [
    { href: "/edition#banque", label: "Versions de la banque", icon: "library" },
    { href: "/edition#editeur", label: "Éditeur de question", icon: "pen" },
    { href: "/edition#relecture", label: "Relecture humaine", icon: "review" },
  ] },
  { title: "Diffusion", items: [
    { href: "/edition#medias", label: "Médias audio", icon: "headphones" },
    { href: "/edition#publication", label: "Publication", icon: "send" },
    { href: "/edition#transfert", label: "Import JSON (avancé)", icon: "copy" },
  ] },
  { title: "Raccourcis", items: [
    { href: "/etudiant", label: "Espace étudiant", icon: "grid", exact: true },
    { href: "/admin/", label: "Administration Django", icon: "sliders", external: true },
  ] },
];

/** Raccourcis visibles dans l’espace étudiant pour les comptes de l’équipe éditoriale. */
const adminGroup: Group = { title: "Administration", items: [
  { href: "/edition/import", label: "Importer une série", icon: "upload" },
  { href: "/edition", label: "Banque pédagogique", icon: "library", exact: true },
  { href: "/admin/", label: "Administration Django", icon: "sliders", external: true },
] };

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

const accountLinks: Item[] = [
  { href: "/etudiant/compte", label: "Mon profil", icon: "user" },
  { href: "/etudiant/compte#abonnement", label: "Mon abonnement", icon: "trophy" },
  { href: "/etudiant/progression", label: "Mes résultats", icon: "trend" },
  { href: "/etudiant/support", label: "Centre d’aide", icon: "help" },
];

/** Carte du compte en bas du menu : un clic ouvre le menu du compte (profil, abonnement, déconnexion). */
function UserCard({ onNavigate, folded }: { onNavigate: () => void; folded: boolean }) {
  const { profile, ready, setProfile } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<CSSProperties>({});
  const [leaving, setLeaving] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); buttonRef.current?.focus(); } };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    };
    const onResize = () => setOpen(false);
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); window.removeEventListener("resize", onResize); };
  }, [open]);
  if (!ready || !profile) return <div className="shell-user">
    <span className="shell-avatar" aria-hidden="true">{ready ? initials(profile) : ""}</span>
    <div>
      <strong>{ready ? "Invité" : "Session…"}</strong>
      {ready && <Link href="/etudiant/compte" onClick={onNavigate}>Se connecter</Link>}
    </div>
  </div>;
  const name = profile.display_name || "Mon profil";
  const badge = { premium: "Membre Premium", expired: "Premium expiré", free: "Formule gratuite" }[profile.subscription.status];
  function toggle() {
    const rect = buttonRef.current?.getBoundingClientRect();
    // Menu posé au-dessus de la carte (ou à sa droite quand le menu latéral est replié), hors de la zone qui défile.
    if (rect) setPlace(folded
      ? { left: rect.right + 8, bottom: Math.max(8, window.innerHeight - rect.bottom) }
      : { left: rect.left, width: rect.width, bottom: window.innerHeight - rect.top + 8 });
    setOpen(value => !value);
  }
  async function logout() {
    setLeaving(true);
    try { await api("auth/logout/", "POST"); setProfile(null); setOpen(false); onNavigate(); router.push("/etudiant/compte"); }
    catch { /* session déjà fermée ou réseau coupé : le profil sera relu au prochain affichage */ }
    finally { setLeaving(false); }
  }
  return <>
    <button ref={buttonRef} type="button" className="shell-user shell-user-button" aria-expanded={open} aria-controls={menuId} onClick={toggle}
      title={folded ? name : undefined}>
      <span className="shell-avatar" aria-hidden="true">{initials(profile)}</span>
      <div><strong>{name}</strong><span>{profile.email}</span></div>
      <Icon name="chevron" size={16} className="shell-user-chevron" />
      <span className="sr-only">Ouvrir le menu du compte</span>
    </button>
    {open && <div ref={menuRef} id={menuId} className="account-menu" style={place}>
      <div className="account-menu-head">
        <strong>{name}</strong><span>{profile.email}</span>
        <span className="account-menu-badge" data-status={profile.subscription.status}><Icon name="trophy" size={11} />{badge}</span>
      </div>
      <ul>
        {accountLinks.map(item => <li key={item.href}><Link href={item.href} className="account-menu-item" onClick={() => { setOpen(false); onNavigate(); }}>
          <Icon name={item.icon} size={14} /><span>{item.label}</span>
        </Link></li>)}
      </ul>
      <button type="button" className="account-menu-item account-menu-logout" disabled={leaving} onClick={logout}>
        <Icon name="logout" size={14} /><span>{leaving ? "Déconnexion…" : "Se déconnecter"}</span>
      </button>
    </div>}
  </>;
}

function EditorialLock({ signedIn }: { signedIn: boolean }) {
  return <section className="student-card editorial-lock" aria-labelledby="acces-reserve">
    <span className="template-icon" aria-hidden="true"><Icon name="sliders" size={18} /></span>
    <div>
      <h2 id="acces-reserve">Accès réservé à l’équipe éditoriale</h2>
      <p>{signedIn
        ? "Ce compte n’a pas les droits d’édition. Connectez-vous avec un compte de l’équipe, ou demandez à un administrateur de vous les attribuer dans l’administration Django."
        : "Connectez-vous avec un compte de l’équipe éditoriale pour importer, relire et publier des séries."}</p>
      <Link className="button button-primary tile-link" href="/etudiant/compte">{signedIn ? "Changer de compte" : "Se connecter"}</Link>
    </div>
  </section>;
}

function Brand({ variant }: { variant: "student" | "edition" }) {
  return <Link href="/" className="shell-brand" aria-label="Fluentia — accueil du site">
    <Image src="/branding/01_Logos_PNG/fluentia-symbole-transparent-256.png" alt="" width={34} height={34} unoptimized />
    <span><strong>Fluentia</strong><small>{variant === "edition" ? "Espace éditorial" : "Objectif TCF"}</small></span>
  </Link>;
}

function Shell({ variant, children }: { variant: "student" | "edition"; children: ReactNode }) {
  const pathname = usePathname();
  const { profile, ready } = useSession();
  const [open, setOpen] = useState(false);
  // Grand écran : menu replié en une colonne d’icônes, pour laisser la place au contenu.
  const [folded, fold] = useFoldable("fluentia-menu-replie");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const groups = variant === "edition" ? editionGroups : profile?.editor ? [...studentGroups, adminGroup] : studentGroups;
  const locked = variant === "edition" && ready && !profile?.editor;
  const current = groups.flatMap(group => group.items).find(item => isActive(pathname, item));
  const title = current?.label ?? extraTitles.find(([pattern]) => pattern.test(pathname))?.[1] ?? "Espace étudiant";
  // Pages d’épreuve : fil d’Ariane dans l’en-tête, le titre principal est porté par le bandeau.
  const epreuve = variant === "student" && studentGroups[1]!.items.find(item => item.href === pathname);
  // Séance ou bilan : retour vers la page de l’épreuve concernée.
  const session = variant === "student" ? /^\/etudiant\/(lecture|ecoute)\//.exec(pathname)?.[1] : undefined;
  const sessionHome = session === "ecoute" ? studentGroups[1]!.items[1]! : studentGroups[1]!.items[0]!;
  // Page dans une épreuve (présentation d’une série, tâche) : fil d’Ariane vers l’épreuve.
  const intro = variant === "student" ? studentGroups[1]!.items.find(item => pathname.startsWith(item.href + "/")) : undefined;
  const task = /\/tache-(\d)$/.exec(pathname)?.[1];
  const corrected = /\/correction\/\d+$/.test(pathname);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); toggleRef.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  const close = () => setOpen(false);
  return <div className="app-shell" data-open={open || undefined} data-folded={folded || undefined}>
    <div className="shell-mobilebar">
      <button ref={toggleRef} type="button" className="shell-icon-button" aria-expanded={open} aria-controls="shell-sidebar" onClick={() => setOpen(value => !value)}>
        <Icon name={open ? "close" : "menu"} /><span className="sr-only">{open ? "Fermer la navigation" : "Ouvrir la navigation"}</span>
      </button>
      <Brand variant={variant} />
    </div>
    <aside id="shell-sidebar" className="shell-sidebar" onClick={event => { if (folded && !(event.target as HTMLElement).closest("a, button, .account-menu")) fold(false); }}>
      <div className="shell-sidebar-head">
        <Brand variant={variant} />
        <button type="button" className="shell-fold" aria-expanded={!folded} aria-controls="shell-sidebar" onClick={() => fold(!folded)}
          title={folded ? "Afficher le menu" : "Réduire le menu"}>
          <Icon name="chevron" size={16} /><span className="sr-only">{folded ? "Afficher le menu" : "Réduire le menu"}</span>
        </button>
      </div>
      <nav aria-label={variant === "edition" ? "Navigation éditoriale" : "Navigation de l’espace étudiant"} className="shell-nav">
        {groups.map(group => <div key={group.title} className="shell-group">
          <p className="shell-group-title">{group.title}</p>
          <ul>{group.items.map(item => {
            const active = isActive(pathname, item);
            return <li key={item.href}>
              {item.external ? <a href={item.href} className="shell-link" title={folded ? item.label : undefined}><Icon name={item.icon} size={18} /><span>{item.label}</span></a> :
              <Link href={item.href} onClick={close} className="shell-link" title={folded ? item.label : undefined} aria-current={active ? "page" : undefined} data-active={active || undefined}>
                <Icon name={item.icon} size={18} /><span>{item.label}</span>
              </Link>}
            </li>;
          })}</ul>
        </div>)}
      </nav>
      <UserCard onNavigate={close} folded={folded} />
    </aside>
    <div className="shell-main">
      <main id="contenu" tabIndex={-1} className="shell-content student-space">
        <header className="shell-pagehead">
          {epreuve ? <nav aria-label="Fil d’Ariane" className="shell-breadcrumb"><ol>
            <li><Link className="crumb" href="/etudiant">Accueil</Link></li>
            <li><Link className="crumb" href="/etudiant#epreuves">Les 4 épreuves</Link></li>
            <li aria-current="page">{epreuve.label}</li>
          </ol></nav> : session ? <nav aria-label="Fil d’Ariane" className="shell-breadcrumb"><ol>
            <li><Link className="crumb" href="/etudiant">Accueil</Link></li>
            <li><Link className="crumb" href={sessionHome.href}>{sessionHome.label}</Link></li>
            <li aria-current="page">Bilan de la séance</li>
          </ol></nav> : intro ? <nav aria-label="Fil d’Ariane" className="shell-breadcrumb"><ol>
            <li><Link className="crumb" href="/etudiant">Accueil</Link></li>
            <li><Link className="crumb" href={intro.href}>{intro.label}</Link></li>
            <li aria-current="page">{task ? `Tâche ${task}` : corrected ? "Correction" : "Présentation de la série"}</li>
          </ol></nav> : <div>
            <p className="shell-eyebrow">{variant === "edition" ? "Espace éditorial" : "Espace étudiant"}</p>
            <h1>{title}</h1>
          </div>}
          {session || intro
            ? <Link href={intro?.href ?? sessionHome.href} className="shell-site-link"><Icon name="back" size={14} />{task || corrected ? "Toutes les tâches" : "Toutes les séries"}</Link>
            : <Link href="/" className="shell-site-link">Voir le site<Icon name="external" size={14} /></Link>}
        </header>
        {locked ? <EditorialLock signedIn={Boolean(profile)} /> : children}
      </main>
    </div>
  </div>;
}

export function AppShell({ variant = "student", children }: { variant?: "student" | "edition"; children: ReactNode }) {
  return <SessionProvider><Shell variant={variant}>{children}</Shell></SessionProvider>;
}
