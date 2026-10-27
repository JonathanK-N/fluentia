/** Contenu des quatre pages d’épreuve : présentation, repères et réflexes. */
import type { IconName } from "../../components/app-shell/icons";

export type EpreuveId = "reading" | "listening" | "writing" | "speaking";
export type Epreuve = {
  id: EpreuveId;
  number: string;
  name: string;
  subtitle: string;
  icon: IconName;
  lead: string;
  notice: string;
  brief: { label: string; value: string; hint: string }[];
  reflexes: { title: string; text: string }[];
};

export const epreuves: Record<EpreuveId, Epreuve> = {
  reading: {
    id: "reading", number: "01", name: "Lecture", subtitle: "Compréhension écrite", icon: "book",
    lead: "Du document du quotidien au texte argumentatif : apprenez à repérer l’information utile, puis vérifiez chaque choix avec une correction détaillée.",
    notice: "Ces séries sont des entraînements non officiels.",
    brief: [
      { label: "Questions", value: "39", hint: "QCM · 4 choix, 1 seule bonne réponse" },
      { label: "Chrono", value: "60 min", hint: "Durée indicative" },
      { label: "Barème", value: "699 pts", hint: "De 3 à 33 points par question, du niveau A1 au C2" },
    ],
    reflexes: [
      { title: "La question d’abord", text: "Lisez la question, puis cherchez la réponse dans le document." },
      { title: "Les mots pièges", text: "Négations, restrictions, dates : ce sont eux qui changent le sens." },
      { title: "Toujours répondre", text: "Une question sautée vaut zéro, comme une erreur. Ne restez pas bloqué." },
    ],
  },
  listening: {
    id: "listening", number: "02", name: "Écoute", subtitle: "Compréhension orale", icon: "headphones",
    lead: "Annonces, dialogues, extraits radio : entraînez votre oreille avec réécoute et transcription, puis passez en simulation avec une diffusion unique.",
    notice: "Ces séries sont des entraînements non officiels.",
    brief: [
      { label: "Questions", value: "39", hint: "QCM · 4 choix, 1 seule bonne réponse" },
      { label: "Chrono", value: "35 min", hint: "Durée indicative" },
      { label: "Diffusion", value: "1 écoute", hint: "En simulation ; réécoute libre en entraînement" },
    ],
    reflexes: [
      { title: "Lire les choix avant", text: "Parcourez les propositions pendant que le document se charge." },
      { title: "Une seule écoute", text: "En simulation, chaque document n’est diffusé qu’une fois : restez concentré." },
      { title: "La transcription après", text: "En entraînement, comparez ce que vous avez compris avec le texte." },
    ],
  },
  writing: {
    id: "writing", number: "03", name: "Rédaction", subtitle: "Expression écrite", icon: "pen",
    lead: "Trois tâches à rédiger : un message, un récit, puis une argumentation à partir de deux documents. Votre brouillon est sauvegardé sur cet appareil.",
    notice: "La correction détaillée par un évaluateur arrivera dans une prochaine version ; aucune note n’est simulée.",
    brief: [
      { label: "Tâches", value: "3", hint: "Message, récit, argumentation" },
      { label: "Chrono", value: "60 min", hint: "Durée indicative" },
      { label: "Longueur", value: "60 à 180 mots", hint: "Selon la tâche" },
    ],
    reflexes: [
      { title: "Respecter la consigne", text: "Type de texte, destinataire et nombre de mots : tout compte." },
      { title: "Structurer", text: "Introduction, développement, conclusion, reliés par des connecteurs." },
      { title: "Relire", text: "Gardez cinq minutes pour l’accord, la conjugaison et la ponctuation." },
    ],
  },
  speaking: {
    id: "speaking", number: "04", name: "Oral", subtitle: "Expression orale", icon: "mic",
    lead: "Trois tâches à l’oral : un entretien, une interaction, puis un point de vue. Enregistrez-vous, réécoutez chaque prise et progressez.",
    notice: "Vos enregistrements restent dans votre navigateur. L’évaluation par un examinateur arrivera dans une prochaine version.",
    brief: [
      { label: "Tâches", value: "3", hint: "Entretien, interaction, point de vue" },
      { label: "Chrono", value: "12 min", hint: "Durée indicative" },
      { label: "Enregistrement", value: "Local", hint: "Rien n’est envoyé au serveur" },
    ],
    reflexes: [
      { title: "Développer", text: "Deux ou trois phrases par réponse, avec un exemple concret." },
      { title: "Varier les questions", text: "Inversion, « est-ce que », intonation : montrez votre aisance." },
      { title: "Annoncer son avis", text: "Position claire, arguments illustrés, puis conclusion." },
    ],
  },
};
