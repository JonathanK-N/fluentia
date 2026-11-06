/** Configuration éditoriale Fluentia. Propriétaire : Jonathan Kakesa. Aucune donnée utilisateur. */
export const brand = {
  name: "Fluentia",
  slogan: "Maîtrisez le français, allez plus loin.",
  locale: "fr-CA",
  owner: "Jonathan Kakesa",
} as const;
export const competencies = [
  {
    id: "ecoute",
    number: "01",
    title: "Compréhension orale",
    detail: "Affinez votre écoute et apprenez à saisir chaque nuance.",
    label: "Écouter et comprendre",
  },
  {
    id: "lecture",
    number: "02",
    title: "Compréhension écrite",
    detail: "Développez vos stratégies de lecture, un texte à la fois.",
    label: "Lire avec confiance",
  },
  {
    id: "redaction",
    number: "03",
    title: "Expression écrite",
    detail: "Structurez vos idées et trouvez les mots justes.",
    label: "Écrire avec clarté",
  },
  {
    id: "parole",
    number: "04",
    title: "Expression orale",
    detail: "Prenez la parole avec méthode et assurance.",
    label: "Faire entendre sa voix",
  },
] as const;
