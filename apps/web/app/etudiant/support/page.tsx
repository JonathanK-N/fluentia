import Link from "next/link";
import { Icon } from "../../../components/app-shell/icons";
import { officialSource } from "../../../features/student/content";
import { PageHero, SectionTitle } from "../../../features/student/ui";
export const metadata = { title: "Aide et support" };

const faq = [
  { q: "Mes réponses sont-elles enregistrées si je ferme la page ?", a: "Oui. Chaque choix confirmé est enregistré immédiatement sur votre compte. Vous pouvez reprendre l’activité depuis le tableau de bord, sur cet appareil ou un autre, tant que le délai n’est pas écoulé." },
  { q: "Que se passe-t-il quand le temps est écoulé ?", a: "Le délai est contrôlé par le serveur. À l’échéance, les réponses déjà enregistrées sont conservées, mais la tentative ne peut plus être modifiée. Une tentative non soumise ne produit pas de score." },
  { q: "Puis-je réécouter un document d’Écoute ?", a: "Oui. Appuyez sur ▶ autant de fois que vous le souhaitez, tant que la séance est en cours. En entraînement, la transcription s’affiche aussi pour comparer avec ce que vous avez compris." },
  { q: "Le score obtenu correspond-il à un niveau officiel ?", a: "Non. Les exercices sont originaux et non officiels. Les difficultés sont proposées par les auteurs et ne sont pas calibrées. Seul le test officiel délivre un résultat reconnu." },
  { q: "Où sont conservés mes textes et ma voix à l’oral ?", a: "Vos brouillons de Rédaction restent sur cet appareil ; un texte envoyé en correction est conservé avec sa correction. À l’Oral, votre voix est envoyée à l’examinateur IA pendant la conversation pour être comprise et transcrite ; Fluentia ne conserve pas l’audio, seulement la transcription de l’échange." },
  { q: "Je n’ai pas reçu le courriel de vérification.", a: "Depuis Profil, utilisez « Renvoyer le lien de vérification ». Le lien est valable 24 heures et ne fonctionne qu’une fois. Pensez à vérifier vos courriers indésirables." },
];

export default function SupportPage() {
  return <>
    <PageHero chip="Centre d’aide" title="Comment pouvons-nous vous aider ?" asideTitle="Raccourcis utiles" aside={<ul className="activity-list">
      <li><Link href="/etudiant/compte">Gérer mon profil et ma vérification</Link><Icon name="user" /></li>
      <li><Link href="/etudiant/plan">Organiser mon programme</Link><Icon name="calendar" /></li>
      <li><a href={officialSource} target="_blank" rel="noreferrer">Format officiel du TCF Canada</a><Icon name="arrow" /></li>
    </ul>}>
      Les réponses aux questions fréquentes sur les exercices, les simulations et votre compte.
    </PageHero>
    <SectionTitle title="Questions fréquentes" />
    <div className="two-col">
      <div className="faq">{faq.map(item => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div>
      <section className="student-card card-muted" aria-labelledby="clavier"><h2 id="clavier">Accessibilité</h2>
        <p>Toutes les activités se pilotent au clavier : Tab pour avancer, flèches pour changer de choix, Échap pour fermer le menu. Les contrastes respectent le niveau WCAG AA.</p>
      </section>
    </div>
  </>;
}
