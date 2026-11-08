"use client";
/** Pied de page et destinations réellement disponibles. Propriétaire : Jonathan Kakesa. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { brand } from "../../lib/brand";
import { Logo } from "../../components/branding/logo";
export function Footer() {
  const pathname = usePathname();
  const landing = pathname === "/";
  if (/^\/(apercu\/etudiant|etudiant|edition)(\/|$)/.test(pathname)) return null;
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
              La préparation au TCF Canada, avec un examinateur IA pour
              l’oral.
            </p>
          </div>
          <nav aria-label="Navigation de pied de page">
            <h2>Préparation</h2>
            <a href="#epreuves">Les 4 épreuves</a>
            <a href="#examinateur">L’oral avec l’IA</a>
            <a href="#tarifs">Tarifs</a>
            <a href="#faq">Questions fréquentes</a>
          </nav>
          <nav aria-label="Compte">
            <h2>Compte</h2>
            <Link href="/etudiant/compte#inscription">Créer un compte</Link>
            <Link href="/etudiant/compte">Connexion</Link>
            <Link href="/etudiant/mot-de-passe">Mot de passe oublié</Link>
            <Link href="/etudiant">Espace étudiant</Link>
          </nav>
          <div>
            <h2>Contact</h2>
            <p>
              <a href="mailto:support@fluentia.ca">support@fluentia.ca</a>
            </p>
            <p>Une question sur votre compte ou sur Premium ? Écrivez-nous.</p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Fluentia · {brand.owner}
          </span>
          <span>
            Préparation indépendante, sans lien avec France Éducation
            international. Aucun résultat garanti.
          </span>
        </div>
      </div>
    </footer>
  );
}
