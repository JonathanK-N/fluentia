import Link from "next/link";
import { Icon } from "../../../components/app-shell/icons";
import { officialSource } from "../../../features/student/content";
import { PageHead } from "../../../features/student/ui";
export const metadata = { title: "Aide et support" };

const faq = [
  { q: "Mes réponses sont-elles enregistrées si je ferme la page ?", a: "Oui. Chaque choix confirmé est enregistré immédiatement sur votre compte. Vous pouvez reprendre l’activité depuis le tableau de bord, sur cet appareil ou un autre, tant que le délai n’est pas écoulé." },
  { q: "Que se passe-t-il quand le temps est écoulé ?", a: "Le délai est contrôlé par le serveur. À l’échéance, les réponses déjà enregistrées sont conservées, mais la tentative ne peut plus être modifiée. Une tentative non soumise ne produit pas de score." },
  { q: "Pourquoi ne puis-je pas réécouter un document en simulation ?", a: "Comme dans les conditions du test, chaque document n’est diffusé qu’une fois en simulation. Utilisez le mode entraînement pour réécouter librement et consulter la transcription." },
  { q: "Le score obtenu correspond-il à un niveau officiel ?", a: "Non. Les exercices sont originaux et non officiels. Les difficultés sont proposées par les auteurs et ne sont pas calibrées. Seul le test officiel délivre un résultat reconnu." },
  { q: "Où sont conservés mes textes et mes enregistrements d’expression ?", a: "Dans votre navigateur uniquement. Les textes restent sur cet appareil ; les enregistrements disparaissent à la fermeture de la page. Téléchargez-les si vous souhaitez les garder." },
  { q: "Je n’ai pas reçu le courriel de vérification.", a: "Depuis Profil, utilisez « Renvoyer le lien de vérification ». Le lien est valable 24 heures et ne fonctionne qu’une fois. Pensez à vérifier vos courriers indésirables." },
];

export default function SupportPage() {
  return <>
    <PageHead eyebrow="Centre d’aide" title="Comment pouvons-nous vous aider ?">Les réponses aux questions fréquentes sur les exercices, les simulations et votre compte.</PageHead>
    <div className="two-col">
      <section aria-labelledby="questions"><h2 id="questions" className="sr-only">Questions fréquentes</h2>
        <div className="faq">{faq.map(item => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div>
      </section>
      <div style={{ display: "grid", gap: "1rem" }}>
        <section className="student-card" aria-labelledby="raccourcis"><h2 id="raccourcis">Raccourcis utiles</h2>
          <ul className="activity-list">
            <li><Link href="/etudiant/compte">Gérer mon profil et ma vérification</Link><Icon name="user" /></li>
            <li><Link href="/etudiant/plan">Organiser mon programme</Link><Icon name="calendar" /></li>
            <li><a href={officialSource} target="_blank" rel="noreferrer">Format officiel du TCF Canada</a><Icon name="arrow" /></li>
          </ul>
        </section>
        <section className="student-card card-muted" aria-labelledby="clavier"><h2 id="clavier">Accessibilité</h2>
          <p>Toutes les activités se pilotent au clavier : Tab pour avancer, flèches pour changer de choix, Échap pour fermer le menu. Les contrastes respectent le niveau WCAG AA.</p>
        </section>
      </div>
    </div>
  </>;
}
