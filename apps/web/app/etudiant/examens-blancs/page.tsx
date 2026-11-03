import Link from "next/link";
import { Catalogue } from "../../../features/student/catalogue";
import { PageHero, SectionTitle } from "../../../features/student/ui";
import { Icon } from "../../../components/app-shell/icons";
export const metadata = { title: "Examens blancs" };
const parts = [
  { title: "Écoute — compréhension orale", detail: "39 questions · 35 min", href: "/etudiant/comprehension-orale", live: true },
  { title: "Lecture — compréhension écrite", detail: "39 questions · 60 min", href: "/etudiant/comprehension-ecrite", live: true },
  { title: "Rédaction — expression écrite", detail: "3 tâches · 60 min", href: "/etudiant/expression-ecrite", live: false },
  { title: "Oral — expression orale", detail: "3 tâches · 12 min", href: "/etudiant/expression-orale", live: false },
];
export default function MockExamsPage() {
  return <>
    <PageHero chip="Jour J" title="Simulations TCF"
      aside="Le délai est contrôlé par le serveur et continue même si vous fermez la page. Prévoyez un moment calme et une connexion stable avant de commencer.">
      Mettez-vous en conditions réelles : durée imposée et corrigé complet à la fin de chaque épreuve.
    </PageHero>
    <SectionTitle title="Déroulement d’une session complète" note="Les 4 épreuves, dans l’ordre du test" />
    <section className="student-card" aria-label="Déroulement d’une session complète" style={{ marginTop: 0 }}>
      <ul className="activity-list">{parts.map((part, index) => <li key={part.title}>
        <span className="activity-title"><strong>{index + 1}. {part.title}</strong><small>{part.detail}</small></span>
        <Link className="plain pill" href={part.href}>{part.live ? "Simulation chronométrée" : "Studio d’entraînement"}<Icon name="chevron" size={14} /></Link>
      </li>)}</ul>
    </section>
    <Catalogue mode="simulation" title="Simulations disponibles" emptyText="Aucune simulation complète n’est publiée pour le moment. Elles apparaîtront ici après leur relecture pédagogique." />
  </>;
}
