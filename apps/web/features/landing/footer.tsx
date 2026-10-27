"use client";
/** Pied de page et destinations réellement disponibles. Propriétaire : Jonathan Kakesa. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { brand } from "../../lib/brand";
import { Logo } from "../../components/branding/logo";
export function Footer() {
  const pathname = usePathname();
  const landing = pathname === "/";
  if (pathname.startsWith("/apercu/etudiant")) return null;
  if (!landing)
    return (
      <footer className="site-footer container">
        <span>
          © {new Date().getFullYear()} Fluentia · {brand.owner}
        </span>
        <span>Maîtriser aujourd’hui. Avancer demain.</span>
      </footer>
    );
  return (
    <footer className="landing-footer human-pilot">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Logo appearance="light" />
            <p>
              Apprendre avec clarté.
              <br />
              Pratiquer avec confiance.
            </p>
          </div>
          <nav aria-label="Navigation de pied de page">
            <h2>Explorer</h2>
            <a href="#fonctionnalites">Les compétences</a>
            <a href="#voice">Fluentia Voice</a>
            <a href="#approche">Notre méthode</a>
            <Link href="/design-system">Design system</Link>
            <Link href="/apercu/etudiant">Aperçu étudiant</Link>
          </nav>
          <div>
            <h2>Informations</h2>
            <p>Conditions — en préparation</p>
            <p>Confidentialité — en préparation</p>
            <p>Support — ouverture à venir</p>
          </div>
          <div>
            <h2>Le projet</h2>
            <p>Fluentia est en développement.</p>
            <p>
              Responsable et propriétaire :<br />
              {brand.owner}
            </p>
            <p>
              Informations d’entreprise : à compléter avant commercialisation.
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Fluentia · {brand.owner}
          </span>
          <span>Préparation indépendante. Aucun résultat garanti au TCF.</span>
        </div>
      </div>
    </footer>
  );
}
