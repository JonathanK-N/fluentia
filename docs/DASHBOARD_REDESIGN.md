# Pilote du tableau de bord étudiant

Responsable : Jonathan Kakesa. Maquette code-first, sans authentification ni service métier.

Trois zones : navigation latérale regroupée, contenu centré sur la prochaine action et navigation mobile accessible. Général : Tableau de bord, Progression, Mon compte. Compréhension : écrite/orale. Expression : écrite/orale. Apprentissage : Coach, Examens blancs, Plan d’étude.

Par défaut, le pilote représente un premier accès : pas de score, niveau ou historique inventé. Un scénario rempli peut illustrer la présentation avec un avertissement explicite de données fictives. Les accès aux compétences expliquent leur disponibilité réelle ; ils ne lancent pas un examen ou une capture audio inexistants.

Contenu attendu : accueil naturel, question orientée action, repères de progression, quatre accès rapides, recommandation, reprise et historique. Les états vides proposent une étape compréhensible. Un état d’indisponibilité permet la vérification du retour à l’état normal sans prétendre appeler une API.

Route implémentée : `/apercu/etudiant`, sans indexation. « Options de l’aperçu » permet de choisir Premier accès, Exemple rempli et l’état indisponible. Réessayer rétablit le scénario et restitue le focus au contrôle d’erreur. Les dialogues se ferment avec Échap et rendent le focus au déclencheur. Le menu mobile utilise un résumé natif et se ferme avec Échap ou une navigation locale. L’historique rempli est une table légendée dans une région focalisable pour son défilement au clavier.

Sidebar de 224 px au desktop, menu natif à 900 px et moins ; grilles de quatre, deux puis une compétence selon la place. Les liens Progression et Plan d’étude ciblent les sections du pilote. Coach et Voice mènent aux démonstrations publiques ; les autres accès expliquent leur disponibilité dans un dialogue. Aucune API, authentification, sauvegarde ni capture micro. Les captures et résultats sont dans [UX_REVIEW.md](UX_REVIEW.md). Aucun écran d’examen, compte enseignant ou administration n’est refondu dans ce pilote.
