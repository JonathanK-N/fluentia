"use client";
/** Navigation mobile native et thème système/manuel non persistant. Propriétaire : Jonathan Kakesa. */
import Link from "next/link";
import { useRef, useState } from "react";
import { Logo } from "../branding/logo";
import { Button } from "../ui/primitives";
export function Header() {
  const menuRef = useRef<HTMLDetailsElement>(null);
  function closeMenu() {
    if (menuRef.current) menuRef.current.open = false;
  }
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  function toggleTheme() {
    const current =
      theme ??
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
  }
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
          <Button
            variant="ghost"
            onClick={toggleTheme}
            aria-label="Changer le thème"
            title="Changer le thème"
          >
            ◐
          </Button>
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
