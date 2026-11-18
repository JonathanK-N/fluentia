import { LegalPage, Section } from "../../features/legal/legal-page";
import { legal } from "../../lib/legal";

export const metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return <LegalPage title="Politique de confidentialité" intro={<>Cette politique explique quels renseignements personnels Fluentia recueille, pourquoi, avec qui ils sont partagés et comment exercer vos droits, conformément à la Loi sur la protection des renseignements personnels dans le secteur privé du Québec (Loi 25).</>}>
    <Section title="1. Responsable de la protection des renseignements personnels">
      <p>La personne responsable est {legal.responsible}. Pour toute question ou demande sur vos renseignements personnels, écrivez à <a href={`mailto:${legal.contact}`}>{legal.contact}</a>.</p>
    </Section>

    <Section title="2. Renseignements que nous recueillons">
      <ul>
        <li><strong>Votre compte :</strong> adresse e-mail, prénom ou nom d’usage et mot de passe (conservé uniquement sous forme chiffrée).</li>
        <li><strong>Votre entraînement :</strong> réponses aux questions, scores, textes de Rédaction, transcription écrite de vos échanges d’Oral, corrections, résultats d’Examen TCF et programme d’étude.</li>
        <li><strong>Votre abonnement :</strong> formule, dates de début et de fin, essais d’Oral utilisés.</li>
        <li><strong>Des données techniques :</strong> adresse IP et type d’appareil, pour sécuriser votre compte, limiter les abus et vous prévenir d’une connexion depuis un nouvel appareil.</li>
      </ul>
      <p>Pendant l’Oral, votre voix est transmise en direct à l’examinateur IA pour la conversation. Fluentia ne conserve pas l’enregistrement audio : seule la transcription écrite est gardée pour vous corriger.</p>
    </Section>

    <Section title="3. Pourquoi nous les utilisons">
      <ul>
        <li>créer et sécuriser votre compte, et vérifier votre adresse e-mail ;</li>
        <li>vous faire passer les épreuves, corriger vos réponses, vos textes et votre oral, et suivre votre progression ;</li>
        <li>gérer votre abonnement Premium et vos essais d’Oral ;</li>
        <li>vous envoyer les courriels nécessaires au service : vérification, mot de passe oublié, alerte de connexion.</li>
      </ul>
      <p>Nous ne vendons pas vos renseignements, ne les utilisons pas pour de la publicité et n’utilisons aucun témoin (cookie) publicitaire.</p>
    </Section>

    <Section title="4. Prestataires et communication hors du Québec">
      <p>Pour fonctionner, Fluentia s’appuie sur des prestataires qui traitent certains renseignements pour notre compte, parfois hors du Québec :</p>
      <ul>
        <li><strong>OpenAI (États-Unis) :</strong> vos textes de Rédaction, votre voix pendant l’Oral et sa transcription, pour la conversation avec l’examinateur et la correction. Pour les corrections, nous demandons à OpenAI de ne pas conserver les échanges ; OpenAI peut toutefois garder des données un temps limité pour la sécurité de son service, selon ses propres conditions.</li>
        <li><strong>Railway :</strong> hébergement du site et de la base de données.</li>
        <li><strong>Resend (États-Unis) :</strong> envoi des courriels du service.</li>
      </ul>
      <p>Avant de vous corriger, le site vous indique toujours à qui votre texte ou votre voix est envoyé.</p>
    </Section>

    <Section title="5. Témoins (cookies) et stockage sur votre appareil">
      <p>Fluentia utilise uniquement des témoins nécessaires : la session de connexion, la protection contre les requêtes frauduleuses et la reconnaissance de vos appareils déjà utilisés. Vos brouillons de Rédaction et quelques réglages d’affichage sont gardés dans votre navigateur, sur votre appareil seulement.</p>
    </Section>

    <Section title="6. Durée de conservation">
      <p>Vos renseignements sont conservés tant que votre compte existe. Quand vous supprimez votre compte, votre compte et toutes vos données d’entraînement sont effacés immédiatement. Les journaux techniques sont effacés automatiquement après une courte durée.</p>
    </Section>

    <Section title="7. Vos droits">
      <ul>
        <li><strong>Accès et rectification :</strong> consultez vos données dans votre espace et demandez-nous une copie ou une correction à <a href={`mailto:${legal.contact}`}>{legal.contact}</a>.</li>
        <li><strong>Suppression :</strong> supprimez vous-même votre compte et toutes vos données depuis <em>Mon profil → Supprimer mon compte</em>.</li>
        <li><strong>Retrait du consentement :</strong> vous pouvez cesser d’utiliser l’Oral ou la correction automatique à tout moment.</li>
        <li><strong>Plainte :</strong> si vous n’êtes pas satisfait de notre réponse, vous pouvez vous adresser à la Commission d’accès à l’information du Québec.</li>
      </ul>
    </Section>

    <Section title="8. Sécurité">
      <p>Les échanges avec le site sont chiffrés (HTTPS), les mots de passe ne sont jamais conservés en clair et l’accès aux données est réservé aux personnes qui en ont besoin pour faire fonctionner le service.</p>
    </Section>

    <Section title="9. Modifications">
      <p>Nous pouvons mettre à jour cette politique. La date de dernière mise à jour figure en haut de la page ; en cas de changement important, nous vous en informerons.</p>
    </Section>
  </LegalPage>;
}
