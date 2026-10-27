/** Repères de format et sujets d’entraînement originaux. Aucun sujet officiel n’est reproduit. */
import type { IconName } from "../../components/app-shell/icons";

export const officialSource = "https://www.france-education-international.fr/test/tcf-canada";

export const skills: { id: "reading" | "listening" | "writing" | "speaking"; href: string; title: string; icon: IconName; summary: string; format: string }[] = [
  { id: "reading", href: "/etudiant/comprehension-ecrite", title: "Compréhension écrite", icon: "book", summary: "Lisez des documents du quotidien, repérez l’essentiel et comprenez chaque corrigé.", format: "39 questions · 60 min" },
  { id: "listening", href: "/etudiant/comprehension-orale", title: "Compréhension orale", icon: "headphones", summary: "Entraînez votre oreille sur des annonces, dialogues et extraits, puis consultez la transcription.", format: "39 questions · 35 min" },
  { id: "writing", href: "/etudiant/expression-ecrite", title: "Expression écrite", icon: "pen", summary: "Rédigez les trois tâches avec compteur de mots, minuteur et grille d’auto-évaluation.", format: "3 tâches · 60 min" },
  { id: "speaking", href: "/etudiant/expression-orale", title: "Expression orale", icon: "mic", summary: "Enregistrez-vous dans les conditions du test, réécoutez-vous et améliorez chaque prise.", format: "3 tâches · 12 min" },
];

export type WritingTask = { slug: string; number: number; title: string; genre: string; min: number; max: number; minutes: number; advice: string[]; subjects: { title: string; prompt: string; documents?: { label: string; text: string }[] }[] };

export const writingTasks: WritingTask[] = [
  {
    slug: "tache-1", number: 1, title: "Message du quotidien", genre: "Courriel, invitation ou message informatif", min: 60, max: 120, minutes: 10,
    advice: ["Saluez et prenez congé selon le destinataire.", "Répondez à chaque point demandé par la consigne.", "Préférez des phrases courtes et des connecteurs simples."],
    subjects: [
      { title: "Invitation à un repas", prompt: "Vous organisez un repas partagé dans votre immeuble. Écrivez un message à vos voisins pour les inviter : précisez la date, le lieu, ce que chacun peut apporter et comment confirmer sa présence." },
      { title: "Changement de rendez-vous", prompt: "Vous deviez aider un ami à déménager samedi, mais vous avez un empêchement. Écrivez-lui pour vous excuser, expliquer la situation et proposer une autre solution." },
      { title: "Renseignements sur un club", prompt: "Vous souhaitez rejoindre le club de randonnée de votre quartier. Écrivez au responsable pour vous présenter et poser des questions sur les sorties, le matériel et l’inscription." },
    ],
  },
  {
    slug: "tache-2", number: 2, title: "Récit ou article", genre: "Article de blogue, compte rendu, témoignage", min: 120, max: 150, minutes: 20,
    advice: ["Structurez votre texte : introduction, développement, conclusion.", "Racontez avec des temps du passé variés et cohérents.", "Ajoutez votre ressenti et un exemple précis."],
    subjects: [
      { title: "Une première fois", prompt: "Pour le blogue d’une association d’accueil, racontez votre première semaine dans une nouvelle ville : ce qui vous a surpris, les difficultés rencontrées et ce qui vous a aidé." },
      { title: "Un événement local", prompt: "Vous avez participé à une fête de quartier. Rédigez un court article pour le journal local : décrivez l’événement, l’ambiance et donnez votre avis sur son organisation." },
      { title: "Un apprentissage marquant", prompt: "Un magazine en ligne recueille des témoignages sur le thème « Apprendre à tout âge ». Racontez une compétence que vous avez acquise récemment et ce qu’elle vous a apporté." },
    ],
  },
  {
    slug: "tache-3", number: 3, title: "Comparer deux points de vue", genre: "Texte argumentatif à partir de deux documents", min: 120, max: 180, minutes: 30,
    advice: ["Présentez brièvement le thème et les deux positions.", "Reformulez les arguments, sans recopier les documents.", "Donnez une opinion personnelle justifiée et nuancée."],
    subjects: [
      { title: "Le télétravail", prompt: "Lisez les deux opinions suivantes. Présentez-les en les comparant, puis donnez votre point de vue argumenté.", documents: [
        { label: "Document 1", text: "Travailler depuis chez soi permet de gagner du temps, de mieux organiser sa journée et de réduire la pollution liée aux trajets. Beaucoup de salariés se disent plus concentrés." },
        { label: "Document 2", text: "Le télétravail isole. Sans échanges informels, l’esprit d’équipe s’affaiblit et la frontière entre vie professionnelle et vie personnelle disparaît peu à peu." },
      ] },
      { title: "Les écrans à l’école", prompt: "Lisez les deux opinions suivantes. Présentez-les en les comparant, puis donnez votre point de vue argumenté.", documents: [
        { label: "Document 1", text: "Les tablettes rendent les cours plus interactifs et préparent les élèves au monde numérique. Elles permettent aussi d’adapter les exercices au rythme de chacun." },
        { label: "Document 2", text: "Multiplier les écrans en classe disperse l’attention. Lire sur papier et écrire à la main restent essentiels pour mémoriser et réfléchir." },
      ] },
    ],
  },
];

export type SpeakingTask = { slug: string; number: number; title: string; seconds: number; prepSeconds: number; goal: string; advice: string[]; subjects: { title: string; prompt: string; cues: string[] }[] };

export const speakingTasks: SpeakingTask[] = [
  {
    slug: "tache-1", number: 1, title: "Entretien dirigé", seconds: 120, prepSeconds: 0, goal: "Parler de vous, de votre parcours et de vos habitudes.",
    advice: ["Développez chaque réponse en deux ou trois phrases.", "Donnez des exemples concrets plutôt que des listes.", "Gardez un rythme posé et articulez."],
    subjects: [
      { title: "Se présenter", prompt: "Présentez-vous : votre parcours, votre travail ou vos études, et vos centres d’intérêt.", cues: ["D’où venez-vous ?", "Que faites-vous au quotidien ?", "Pourquoi apprenez-vous le français ?", "Que faites-vous pendant votre temps libre ?"] },
      { title: "Votre ville", prompt: "Parlez de la ville où vous habitez ou aimeriez habiter.", cues: ["Qu’appréciez-vous dans ce lieu ?", "Comment vous déplacez-vous ?", "Que conseilleriez-vous à un visiteur ?"] },
    ],
  },
  {
    slug: "tache-2", number: 2, title: "Exercice en interaction", seconds: 330, prepSeconds: 120, goal: "Obtenir des informations en posant des questions variées.",
    advice: ["Préparez des questions ouvertes et fermées.", "Variez les formes : inversion, « est-ce que », intonation.", "Rebondissez sur les réponses pour approfondir."],
    subjects: [
      { title: "Un cours de cuisine", prompt: "Vous voulez vous inscrire à un atelier de cuisine. Posez des questions à l’organisateur pour obtenir toutes les informations utiles.", cues: ["Horaires et durée", "Tarifs et paiement", "Niveau requis", "Matériel à apporter"] },
      { title: "Un logement à louer", prompt: "Vous appelez au sujet d’un appartement à louer. Interrogez le propriétaire pour décider si vous le visitez.", cues: ["Loyer et charges", "Quartier et transports", "Date de disponibilité", "Conditions du bail"] },
    ],
  },
  {
    slug: "tache-3", number: 3, title: "Expression d’un point de vue", seconds: 270, prepSeconds: 0, goal: "Défendre une opinion de façon structurée et convaincante.",
    advice: ["Annoncez clairement votre position.", "Appuyez-vous sur deux ou trois arguments illustrés.", "Concluez en reformulant votre avis."],
    subjects: [
      { title: "Voyager seul", prompt: "« Voyager seul est la meilleure façon de découvrir un pays. » Qu’en pensez-vous ?", cues: ["Liberté et rencontres", "Sécurité et budget", "Expérience personnelle"] },
      { title: "Les réseaux sociaux", prompt: "« Les réseaux sociaux rapprochent les gens plus qu’ils ne les éloignent. » Êtes-vous d’accord ?", cues: ["Liens à distance", "Qualité des échanges", "Temps passé en ligne"] },
    ],
  },
];

export const skillLabel = (skill: string) => skill === "listening" ? "Compréhension orale" : "Compréhension écrite";
export const attemptHref = (attempt: { id: string; skill: string }) => `/etudiant/${attempt.skill === "listening" ? "ecoute" : "lecture"}/${attempt.id}`;
export const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60), rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
};
export function countWords(text: string) {
  return (text.trim().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? []).length;
}
