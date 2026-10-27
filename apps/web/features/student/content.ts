/** Repères de format des épreuves. Les sujets sont en base, publiés depuis l’espace éditorial. */
import type { IconName } from "../../components/app-shell/icons";

export const officialSource = "https://www.france-education-international.fr/test/tcf-canada";

export const skills: { id: "reading" | "listening" | "writing" | "speaking"; number: string; name: string; href: string; title: string; icon: IconName; tone: "lavender" | "mint"; summary: string; facts: [string, string] }[] = [
  { id: "reading", number: "01", name: "Lecture", href: "/etudiant/comprehension-ecrite", title: "Compréhension écrite", icon: "book", tone: "lavender", summary: "Des documents du quotidien à décoder : repérez l’idée clé, puis relisez chaque correction.", facts: ["39 questions", "60 min"] },
  { id: "listening", number: "02", name: "Écoute", href: "/etudiant/comprehension-orale", title: "Compréhension orale", icon: "headphones", tone: "mint", summary: "Annonces, dialogues, extraits : affûtez votre oreille, la transcription vous attend après.", facts: ["39 questions", "35 min"] },
  { id: "writing", number: "03", name: "Rédaction", href: "/etudiant/expression-ecrite", title: "Expression écrite", icon: "pen", tone: "lavender", summary: "Trois sujets à rédiger, avec compteur de mots, chrono et grille pour vous auto-évaluer.", facts: ["3 tâches", "60 min"] },
  { id: "speaking", number: "04", name: "Oral", href: "/etudiant/expression-orale", title: "Expression orale", icon: "mic", tone: "mint", summary: "Parlez comme le jour J, réécoutez votre enregistrement et améliorez chaque prise.", facts: ["3 tâches", "12 min"] },
];

export type WritingTask = { slug: string; number: number; title: string; genre: string; min: number; max: number; minutes: number; advice: string[]; subjects: { title: string; prompt: string; documents?: { label: string; text: string }[] }[] };

export type SpeakingTask = { slug: string; number: number; title: string; seconds: number; prepSeconds: number; goal: string; advice: string[]; subjects: { title: string; prompt: string; cues: string[] }[] };

/** Les trois tâches suivent le format TCF ; leurs sujets viennent de l’API. */
export const taskSlugs = ["tache-1", "tache-2", "tache-3"];

export const skillLabel = (skill: string) => skill === "listening" ? "Écoute" : "Lecture";
export const skillTitle = (skill: string) => skill === "listening" ? "Compréhension orale" : "Compréhension écrite";
export const attemptHref = (attempt: { id: string; skill: string }) => `/etudiant/${attempt.skill === "listening" ? "ecoute" : "lecture"}/${attempt.id}`;
export const formatPoints = (points: number) => `${points} point${points > 1 ? "s" : ""}`;

export const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60), rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
};
export function countWords(text: string) {
  return (text.trim().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? []).length;
}
