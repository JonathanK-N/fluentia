import Link from "next/link";
import { LegalPage, Section } from "../../features/legal/legal-page";
import { legal } from "../../lib/legal";

export const metadata = { title: "Conditions d’utilisation" };

export default function TermsPage() {
  return <LegalPage title="Conditions d’utilisation" intro={<>Ces conditions encadrent l’utilisation de Fluentia, plateforme de préparation au TCF Canada. En créant un compte, vous les acceptez, ainsi que notre <Link href="/confidentialite">politique de confidentialité</Link>.</>}>
    <Section title="1. Le service">
      <p>Fluentia propose des séries d’entraînement aux 4 épreuves du TCF Canada (Écoute, Lecture, Rédaction, Oral), des corrections automatiques par intelligence artificielle et des Examens TCF complets. Fluentia est une préparation indépendante, sans lien avec France Éducation international, organisme qui conçoit le TCF.</p>
    </Section>

    <Section title="2. Résultats non officiels">
      <p>Les scores, niveaux (A1 à C2) et équivalences NCLC affichés sont des estimations d’entraînement. Ils ne remplacent pas un résultat officiel du TCF et ne garantissent aucun résultat le jour du test.</p>
    </Section>

    <Section title="3. Votre compte">
      <ul>
        <li>Votre compte est personnel : ne le partagez pas et gardez votre mot de passe confidentiel.</li>
        <li>Les renseignements fournis doivent être exacts, notamment votre adresse e-mail.</li>
        <li>Vous pouvez supprimer votre compte à tout moment depuis <em>Mon profil</em>.</li>
      </ul>
    </Section>

    <Section title="4. Formules et Premium">
      <p>Une partie du service est gratuite. Premium donne accès à l’Oral avec l’examinateur IA, avec un nombre de tâches d’oral lié à la formule choisie :</p>
      <ul>
        <li>2 semaines : 12,99 $ US, 15 tâches d’oral ;</li>
        <li>1 mois : 22,99 $ US, 25 tâches d’oral ;</li>
        <li>2 mois : 37,99 $ US, 40 tâches d’oral.</li>
      </ul>
      <p>Les prix sont en dollars américains. Le paiement est unique, par carte de crédit, sur la page sécurisée de Stripe : rien ne se renouvelle automatiquement. Une formule achetée pendant un Premium en cours s’ajoute à la fin de celui-ci. Les tâches d’oral non utilisées à la fin de la période ne sont pas reportées. Les corrections automatiques peuvent être limitées par jour pour garantir un service fiable à tous.</p>
    </Section>

    <Section title="5. Utilisation acceptable">
      <p>Il est interdit de copier ou de redistribuer les contenus de Fluentia (questions, documents, audios, sujets), de contourner les limites du service, de l’utiliser de manière automatisée ou de tenter d’en compromettre la sécurité. En cas d’abus, l’accès au compte peut être suspendu.</p>
    </Section>

    <Section title="6. Contenus et propriété">
      <p>Les contenus pédagogiques de Fluentia sont protégés. Vos textes et vos réponses restent les vôtres ; vous nous autorisez seulement à les traiter pour vous corriger et suivre votre progression.</p>
    </Section>

    <Section title="7. Disponibilité et responsabilité">
      <p>Nous faisons de notre mieux pour que le service soit disponible et exact, sans pouvoir garantir l’absence d’interruption ou d’erreur, notamment dans les corrections produites par l’intelligence artificielle. Dans la mesure permise par la loi, Fluentia n’est pas responsable des décisions prises sur la base de ces estimations.</p>
    </Section>

    <Section title="8. Modifications et droit applicable">
      <p>Ces conditions peuvent évoluer ; la date de mise à jour figure en haut de la page. Elles sont régies par les lois du Québec et du Canada.</p>
    </Section>

    <Section title="9. Contact">
      <p>Pour toute question : <a href={`mailto:${legal.contact}`}>{legal.contact}</a>.</p>
    </Section>
  </LegalPage>;
}
