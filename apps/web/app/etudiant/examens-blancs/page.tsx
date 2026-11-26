import { MockExamList } from "../../../features/student/mock-exam";
import { PageHero, SectionTitle } from "../../../features/student/ui";
import { Icon } from "../../../components/app-shell/icons";
export const metadata = { title: "Simulations TCF" };
const parts = [
  { title: "Écoute — compréhension orale", detail: "39 questions · 35 min" },
  { title: "Lecture — compréhension écrite", detail: "39 questions · 60 min" },
  { title: "Rédaction — expression écrite", detail: "3 tâches · 60 min" },
  { title: "Oral — expression orale", detail: "3 tâches · 12 min" },
] as const;
export default function MockExamsPage() {
  return <>
    <PageHero chip="Jour J" title="Simulations TCF"
      aside="Chaque épreuve a son chrono, contrôlé par le serveur : il continue même si vous fermez la page. Entre deux épreuves, vous pouvez faire une pause et reprendre plus tard.">
      Passez un Examen TCF complet en conditions réelles : les 4 épreuves dans l’ordre du test, puis un bilan avec votre niveau.
    </PageHero>
    <SectionTitle title="Déroulement d’un Examen TCF" note="Les 4 épreuves, dans l’ordre du test" />
    <section className="student-card" aria-label="Déroulement d’un Examen TCF" style={{ marginTop: 0 }}>
      <ul className="activity-list">{parts.map((part, index) => <li key={part.title}>
        <span className="activity-title"><strong>{index + 1}. {part.title}</strong><small>{part.detail}</small></span>
        <span className="pill"><Icon name="timer" size={13} />Chronométrée</span>
      </li>)}</ul>
    </section>
    <MockExamList />
  </>;
}
