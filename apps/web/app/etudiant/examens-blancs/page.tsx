import Link from "next/link";
import { Catalogue } from "../../../features/student/catalogue";
import { Notice, PageHead, SectionTitle } from "../../../features/student/ui";
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
    <PageHead eyebrow="Jour J" title="Simulations TCF">Mettez-vous en conditions réelles : durée imposée, progression séquentielle et corrigé complet à la fin de chaque épreuve.</PageHead>
    <section className="student-card" aria-labelledby="deroulement">
      <h2 id="deroulement">Déroulement d’une session complète</h2>
      <ul className="activity-list">{parts.map((part, index) => <li key={part.title}>
        <span className="activity-title"><strong>{index + 1}. {part.title}</strong><small>{part.detail}</small></span>
        <Link className="plain pill" href={part.href}>{part.live ? "Simulation chronométrée" : "Studio d’entraînement"}<Icon name="chevron" size={14} /></Link>
      </li>)}</ul>
    </section>
    <Notice icon="clock">Le délai est contrôlé par le serveur et continue même si vous fermez la page. Prévoyez un moment calme et une connexion stable avant de commencer.</Notice>
    <SectionTitle title="Simulations disponibles" />
    <Catalogue skill="all" mode="simulation" emptyText="Aucune simulation complète n’est publiée pour le moment. Elles apparaîtront ici après leur relecture pédagogique." />
  </>;
}
