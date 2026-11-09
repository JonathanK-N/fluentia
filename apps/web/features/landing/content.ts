/** Contenus de l’accueil : épreuves, oral, étapes, offres et FAQ. Propriétaire : Jonathan Kakesa. */

export const SIGNUP = "/etudiant/compte#inscription";
export const LOGIN = "/etudiant/compte";
export const SUPPORT_EMAIL = "support@fluentia.ca";
export const PREMIUM_REQUEST = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Abonnement Premium Fluentia")}`;

export const highlights = [
  { value: "4", label: "épreuves du TCF Canada" },
  { value: "3", label: "tâches orales face à l’examinateur" },
  { value: "60 min", label: "chrono officiel à l’écrit" },
  { value: "0 $", label: "pour commencer" },
] as const;

export const exams = [
  {
    id: "ecoute",
    title: "Compréhension orale",
    format: "39 questions · 35 min",
    href: "/etudiant/comprehension-orale",
    detail: "Annonces, dialogues, extraits radio : entraînez votre oreille aux documents de l’épreuve.",
    features: ["Séries chronométrées au format officiel", "Réécoute et transcription en entraînement", "Corrigé expliqué question par question"],
  },
  {
    id: "lecture",
    title: "Compréhension écrite",
    format: "39 questions · 60 min",
    href: "/etudiant/comprehension-ecrite",
    detail: "Du document du quotidien au texte argumentatif, repérez l’information utile plus vite.",
    features: ["Documents variés, du niveau A1 au C2", "Séries chronométrées au format officiel", "Corrigé expliqué question par question"],
  },
  {
    id: "redaction",
    title: "Expression écrite",
    format: "3 tâches · 60 min",
    href: "/etudiant/expression-ecrite",
    detail: "Message, récit, argumentation : rédigez dans les conditions de l’examen.",
    features: ["Compteur de mots et brouillon sauvegardé", "Note sur 20 et quatre critères corrigés par l’IA", "Modèle de réponse pour comparer"],
  },
  {
    id: "parole",
    title: "Expression orale",
    format: "3 tâches · 12 min",
    href: "/etudiant/expression-orale",
    detail: "Parlez à un examinateur IA qui vous écoute, vous répond et vous relance.",
    features: ["Conversation vocale en temps réel", "Préparation chronométrée pour la tâche 2", "Transcription complète à relire"],
  },
] as const;

export const speakingTasks = [
  {
    number: "Tâche 1",
    title: "Entretien dirigé",
    duration: "2 min",
    detail: "L’examinateur mène l’entretien : vous vous présentez, il vous pose des questions sur votre parcours et vos projets.",
  },
  {
    number: "Tâche 2",
    title: "Exercice en interaction",
    duration: "2 min de préparation · 5 min 30",
    detail: "Il joue le personnage du sujet. À vous de poser les questions pour obtenir les informations utiles.",
  },
  {
    number: "Tâche 3",
    title: "Expression d’un point de vue",
    duration: "4 min 30",
    detail: "Vous défendez une opinion. Il vous écoute, puis vous relance pour vous faire préciser vos arguments.",
  },
] as const;

export const examinerPromises = [
  ["Il vous parle vraiment", "Une voix naturelle, en français, qui réagit à ce que vous dites."],
  ["Il respecte le temps officiel", "Minuteur visible et conclusion polie à la fin de la tâche."],
  ["Vous gardez une trace", "La transcription de l’échange reste disponible dans votre espace."],
  ["Votre voix n’est pas enregistrée", "Seule la transcription est conservée, jamais l’audio."],
] as const;

/** Exemple affiché dans l’aperçu de l’accueil : une tâche 2, clairement présentée comme un exemple. */
export const sampleConversation = [
  { speaker: "examiner", text: "Bonjour. Je suis responsable d’un club de randonnée à Sherbrooke. Posez-moi vos questions." },
  { speaker: "student", text: "Bonjour ! Les sorties ont lieu à quelle fréquence ?" },
  { speaker: "examiner", text: "Deux samedis par mois, de mars à novembre. Vous marchez souvent ?" },
  { speaker: "student", text: "Oui, un peu. Est-ce qu’il faut apporter son propre équipement ?" },
  { speaker: "examiner", text: "Les bâtons sont prêtés. Prévoyez seulement de bonnes chaussures." },
] as const;

export const steps = [
  ["Créez votre compte", "Gratuit, en deux minutes. Confirmez votre adresse e-mail et c’est parti."],
  ["Entraînez-vous", "Séries de compréhension, rédactions corrigées : travaillez chaque épreuve au format officiel."],
  ["Passez l’oral", "Prenez la parole face à l’examinateur IA, tâche par tâche, avec votre micro."],
  ["Suivez votre progression", "Vos scores, vos corrections et vos transcriptions au même endroit."],
] as const;

export const plans = [
  {
    name: "Gratuit",
    price: "0 $",
    period: "pour toujours",
    description: "Pour découvrir Fluentia et travailler l’écrit.",
    features: [
      "Compréhension orale et écrite : séries et corrigés",
      "Expression écrite avec correction par l’IA (jusqu’à 10 par jour)",
      "Une tâche orale offerte avec l’examinateur IA",
      "Suivi de votre progression",
    ],
    cta: { label: "Créer mon compte gratuit", href: SIGNUP },
    featured: false,
  },
  {
    name: "Premium",
    price: "19,99 $",
    period: "par mois",
    description: "Pour s’entraîner à l’oral comme le jour de l’examen.",
    features: [
      "Tout le contenu du compte gratuit",
      "Les 3 tâches orales avec l’examinateur IA",
      "Jusqu’à 15 minutes d’oral par jour",
      "Transcription de chaque conversation",
    ],
    cta: { label: "Passer à Premium", href: PREMIUM_REQUEST },
    featured: true,
  },
] as const;

export const faqs = [
  {
    question: "Qu’est-ce que le TCF Canada ?",
    answer:
      "Le Test de connaissance du français pour le Canada évalue votre niveau en français pour les démarches d’immigration et de citoyenneté. Il comprend quatre épreuves : compréhension orale, compréhension écrite, expression écrite et expression orale. Les résultats sont exprimés en niveaux de compétence linguistique canadiens (NCLC).",
  },
  {
    question: "Fluentia est-elle une préparation officielle ?",
    answer:
      "Non. Fluentia est une préparation indépendante, sans lien avec France Éducation international, qui conçoit le TCF. Nos séries sont des entraînements au format de l’examen ; aucune préparation ne garantit un résultat.",
  },
  {
    question: "Comment se passe l’oral avec l’examinateur IA ?",
    answer:
      "Vous choisissez une tâche, autorisez votre micro, puis vous parlez comme face à un examinateur. Il vous répond à voix haute, vous relance et conclut à la fin du temps officiel. Pour la tâche 2, deux minutes de préparation avec prise de notes précèdent l’échange. Vous retrouvez ensuite la transcription complète.",
  },
  {
    question: "Que devient ma voix ?",
    answer:
      "Pendant la conversation, votre voix est transmise en direct au service d’IA vocale qui joue l’examinateur. Fluentia n’enregistre pas l’audio : seule la transcription écrite est conservée dans votre espace.",
  },
  {
    question: "De quel équipement ai-je besoin ?",
    answer:
      "Un ordinateur, une tablette ou un téléphone avec un navigateur récent (Chrome, Edge, Safari ou Firefox) et un micro. Un casque ou des écouteurs donnent une conversation plus fluide.",
  },
  {
    question: "Comment fonctionne l’abonnement Premium ?",
    answer:
      `Premium coûte 19,99 $ par mois (taxes en sus) et ne se renouvelle pas automatiquement : vous recevez un rappel avant la fin de votre période. Pour l’activer, écrivez-nous à ${SUPPORT_EMAIL}.`,
  },
] as const;
