"use client";
/** Navigation de l’accueil. Propriétaire : Jonathan Kakesa. */
import Link from "next/link";
import { useRef } from "react";
import { Logo } from "../../components/branding/logo";
import { Button } from "../../components/ui/primitives";
import { useMotionPreferences } from "../../components/layout/providers";
const links = [
  ["Épreuves", "#epreuves"],
  ["Oral avec l’IA", "#examinateur"],
  ["Fonctionnement", "#fonctionnement"],
  ["Tarifs", "#tarifs"],
  ["FAQ", "#faq"],
] as const;
export function LandingNavigation() {
  const menu = useRef<HTMLDetailsElement>(null);
  const { paused, toggle } = useMotionPreferences();
  function close() {
    if (menu.current) menu.current.open = false;
  }
  return (
    <header className="landing-nav human-pilot">
      <div className="container landing-nav-inner">
        <Logo appearance="light" />
        <nav aria-label="Navigation principale" className="landing-desktop-nav">
          {links.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div className="landing-nav-actions">
          <Button
            variant="ghost"
            className="motion-toggle"
            onClick={toggle}
            aria-pressed={paused}
            aria-label="Mouvement — suspendre les animations"
            title={
              paused ? "Reprendre les animations" : "Suspendre les animations"
            }
          >
            <span aria-hidden="true">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                {paused ? (
                  <path d="m4 2 7 5-7 5Z" />
                ) : (
                  <path d="M4 2v10M10 2v10" />
                )}
              </svg>
            </span>
            <span className="motion-label">Mouvement</span>
          </Button>
          <Link className="landing-login" href="/etudiant/compte">
            Connexion
          </Link>
          <Link
            className="button button-primary landing-signup"
            href="/etudiant/compte#inscription"
          >
            Créer un compte
          </Link>
          <details
            className="landing-mobile-menu"
            ref={menu}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                close();
                menu.current?.querySelector("summary")?.focus();
              }
            }}
          >
            <summary>Menu</summary>
            <nav aria-label="Navigation mobile">
              <Link href="/etudiant" onClick={close}>
                Espace étudiant
              </Link>
              {links.map(([label, href]) => (
                <a key={href} href={href} onClick={close}>
                  {label}
                </a>
              ))}
              <Link href="/etudiant/compte" onClick={close}>
                Connexion et inscription
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
