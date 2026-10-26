import Link from "next/link";
import "../etudiant/student.css";
export const metadata = {title: "Banque pédagogique"};
export default function EditorialLayout({children}: {children: React.ReactNode}) {
  return <main id="contenu" className="container student-space"><nav className="student-nav" aria-label="Administration pédagogique"><Link href="/etudiant/compte">Session et compte</Link><Link href="/etudiant">Catalogue étudiant</Link></nav>{children}</main>;
}
