/** Contenus et prix centralisés. Propriétaire : Jonathan Kakesa. */
export const plans: readonly {
  name: string;
  description: string;
  price: number | null;
  features: readonly string[];
}[] = [
  {
    name: "Découverte",
    description: "Trouver votre point de départ.",
    price: null,
    features: [
      "Diagnostic envisagé",
      "Découverte des compétences",
      "Premiers repères",
    ],
  },
  {
    name: "Essentiel",
    description: "Installer une pratique régulière.",
    price: null,
    features: [
      "Programme personnalisé envisagé",
      "Entraînements guidés",
      "Suivi de progression",
    ],
  },
  {
    name: "Accompagné",
    description: "Donner plus de place à votre voix.",
    price: null,
    features: [
      "Parcours Essentiel envisagé",
      "Pratique orale avec Voice",
      "Simulations et retours pédagogiques",
    ],
  },
];
export const faqs = [
  {
    question: "À qui s’adresse Fluentia ?",
    answer:
      "Fluentia est conçue pour les personnes qui préparent un projet au Québec et souhaitent travailler leur français en vue du TCF. Les contenus pédagogiques et parcours complets sont encore en développement.",
  },
  {
    question: "Puis-je déjà créer un compte et m’entraîner ?",
    answer:
      "Oui. Créez votre compte depuis l’espace étudiant pour enregistrer vos réponses en compréhension écrite et orale, retrouver vos corrigés et suivre votre progression. Les studios d’expression fonctionnent dans votre navigateur ; les abonnements ne sont pas encore ouverts.",
  },
  {
    question: "La démonstration Voice utilise-t-elle mon microphone ?",
    answer:
      "Non. Elle illustre des états visuels et textuels, sans enregistrement, écoute, lecture audio ou service d’intelligence artificielle connecté. Vous contrôlez chaque transition.",
  },
  {
    question: "Fluentia garantit-elle un résultat au TCF ?",
    answer:
      "Non. Fluentia n’est ni un centre d’examen ni un organisme de certification. Les exemples de progression sont fictifs, sans conversion en score ou niveau officiel. Une préparation ne garantit aucun résultat.",
  },
  {
    question: "Les tarifs affichés sont-ils définitifs ?",
    answer:
      "Les offres présentées sont des pistes de structure. Les prix et les conditions commerciales restent à approuver. Aucun achat, essai commercial ou paiement n’est proposé.",
  },
  {
    question: "Puis-je consulter la page sans animations ?",
    answer:
      "Oui. Les préférences de mouvement réduit de votre appareil sont respectées. La commande Mouvement dans la navigation permet aussi de suspendre les animations ; les textes et les démonstrations restent accessibles.",
  },
] as const;
export const journey = [
  [
    "Diagnostic",
    "Faire le point",
    "Identifier les compétences à travailler et préciser votre objectif.",
  ],
  [
    "Programme",
    "Tracer votre chemin",
    "Organiser un rythme de pratique adapté à votre quotidien.",
  ],
  [
    "Entraînement",
    "Passer à l’action",
    "Écouter, lire, écrire et prendre la parole avec une intention claire.",
  ],
  [
    "Simulation",
    "Prendre vos repères",
    "Vous familiariser avec les situations et contraintes d’un examen.",
  ],
  [
    "Progression",
    "Ajuster la suite",
    "Relire vos acquis et choisir votre prochaine étape.",
  ],
] as const;
