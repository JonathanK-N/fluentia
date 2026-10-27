"use client";
/** Navigation mobile native, thème clair unique. Propriétaire : Jonathan Kakesa. */
import Link from "next/link";
import { useRef } from "react";
import { Logo } from "../branding/logo";
import { usePathname } from "next/navigation";
import { LandingNavigation } from "../../features/landing/navigation";
export function Header() {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDetailsElement>(null);
  function closeMenu() {
    if (menuRef.current) menuRef.current.open = false;
  }
  if (/^\/(apercu\/etudiant|etudiant|edition)(\/|$)/.test(pathname)) return null;
  if (pathname === "/") return <LandingNavigation />;
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <nav className="desktop-nav" aria-label="Navigation principale">
          <Link href="/#modules">Les compétences</Link>
          <Link href="/#approche">Notre approche</Link>
          <Link href="/design-system">Design system</Link>
          <Link href="/etudiant">Espace étudiant</Link>
        </nav>
        <div className="header-actions">
          <details ref={menuRef} className="mobile-menu">
            <summary>Menu</summary>
            <nav aria-label="Navigation mobile">
              <Link onClick={closeMenu} href="/#modules">
                Les compétences
              </Link>
              <Link onClick={closeMenu} href="/#approche">
                Notre approche
              </Link>
              <Link onClick={closeMenu} href="/design-system">
                Design system
              </Link>
              <Link onClick={closeMenu} href="/etudiant">Espace étudiant</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
