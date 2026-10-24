# Pilote du tableau de bord étudiant

Responsable : Jonathan Kakesa. Maquette code-first, sans authentification ni service métier.

Trois zones : navigation latérale regroupée, contenu centré sur la prochaine action et navigation mobile accessible. Général : Tableau de bord, Progression, Mon compte. Compréhension : écrite/orale. Expression : écrite/orale. Apprentissage : Coach, Examens blancs, Plan d’étude.

Par défaut, le pilote représente un premier accès : pas de score, niveau ou historique inventé. Un scénario rempli peut illustrer la présentation avec un avertissement explicite de données fictives. Les accès aux compétences expliquent leur disponibilité réelle ; ils ne lancent pas un examen ou une capture audio inexistants.

Contenu attendu : accueil naturel, question orientée action, repères de progression, quatre accès rapides, recommandation, reprise et historique. Les états vides proposent une étape compréhensible. Un état d’indisponibilité permet la vérification du retour à l’état normal sans prétendre appeler une API.

Les chemins et contrôles réellement implémentés, captures et résultats seront précisés dans [UX_REVIEW.md](UX_REVIEW.md). Aucun écran d’examen, compte enseignant ou administration n’est refondu dans ce pilote.
