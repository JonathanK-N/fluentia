"use client";
/** Navigation Discover, sans faux parcours d’inscription. Propriétaire : Jonathan Kakesa. */
import Link from "next/link";
import { useRef } from "react";
import { Logo } from "../../components/branding/logo";
import { Button } from "../../components/ui/primitives";
import { useMotionPreferences } from "../../components/layout/providers";
const links = [
  ["Fonctionnalités", "#fonctionnalites"],
  ["Méthode", "#approche"],
  ["Examens", "#examens"],
  ["Tarifs", "#tarifs"],
] as const;
export function LandingNavigation() {
  const menu = useRef<HTMLDetailsElement>(null);
  const { paused, toggle } = useMotionPreferences();
  function close() {
    if (menu.current) menu.current.open = false;
  }
  return (
    <header className="landing-nav discover">
      <div className="container landing-nav-inner">
        <Logo dark />
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
            aria-label="Suspendre les animations"
            title={
              paused ? "Reprendre les animations" : "Suspendre les animations"
            }
          >
            <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span>
            <span className="motion-label">Mouvement</span>
          </Button>
          <a className="landing-login" href="#disponibilite">
            Connexion <span className="sr-only">— pas encore ouverte</span>
          </a>
          <a
            className="button button-primary landing-signup"
            href="#disponibilite"
          >
            S’inscrire <span className="sr-only">— ouverture à venir</span>
          </a>
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
              {links.map(([label, href]) => (
                <a key={href} href={href} onClick={close}>
                  {label}
                </a>
              ))}
              <a href="#disponibilite" onClick={close}>
                Connexion et inscription — à venir
              </a>
              <Link href="/design-system" onClick={close}>
                Design system
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
