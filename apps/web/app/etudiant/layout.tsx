import Link from "next/link";
import "./student.css";
export const metadata = { title: "Espace étudiant" };
export default function StudentLayout({children}: {children: React.ReactNode}) {
  return <main id="contenu" className="container student-space">
    <nav aria-label="Espace étudiant" className="student-nav">
      <Link href="/etudiant">Mes exercices</Link><Link href="/etudiant/compte">Mon compte</Link>
    </nav>{children}
  </main>;
}
