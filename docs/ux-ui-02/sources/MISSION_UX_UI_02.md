# FLUENTIA — MISSION UX/UI 02
## Conception intégrale Figma, Design System et prototypes interactifs

### 1. IDENTIFICATION DU PROJET

**Nom :** Fluentia

**Objectif :** concevoir les interfaces intégrales d'une plateforme EdTech de préparation au TCF destinée au Québec.

**Responsable et propriétaire :** Jonathan Kakesa

**GitHub :** JonathanK-N

**Adresse Git de référence :** jkakesa9@gmail.com

**Dépôt :** https://github.com/JonathanK-N/fluentia

**Fichier Figma existant :** https://www.figma.com/design/SIjNphVU1NHimwwImszGbE

**Charte :** Fluentia, inspirée de Cognito Inc.

### 2. CONTEXTE EXISTANT

La Mission Frontend 01 a déjà produit des composants React, un Design System initial, des assets, une documentation Markdown, des tests et des travaux Figma.

La PR #1 est actuellement en brouillon :

https://github.com/JonathanK-N/fluentia/pull/1

Le dernier rapport signalait un NO-GO à cause de problèmes responsive dans les maquettes Figma et de limites liées au forfait Starter.

Il est impératif de lire l'état réel du dépôt, du fichier Figma, de la PR et des tests avant de modifier quoi que ce soit.

Ne pas reprendre aveuglément un ancien rapport si l'état du projet a changé.

### 3. DIRECTIVES PERMANENTES

Respecter toutes les restrictions déjà établies pour Fluentia.

**Propriété et attribution :**

Jonathan Kakesa est propriétaire et responsable du projet.

Identifier correctement le propriétaire dans les en-têtes, README et documents officiels.

Les métadonnées Git doivent être fidèles à l'identité du contributeur réel.

Ne pas ajouter de signatures promotionnelles d'outils ou d'assistants dans les livrables.

Ne pas falsifier les auteurs, committers ou l'historique Git.

**Branches :**

- `main` : production Railway.
- `tests` : validation et staging.
- `dev` : développement.

Les branches de travail temporaires sont autorisées à partir de `dev`.

Ne jamais faire de push forcé sur les branches permanentes.

Ne jamais modifier directement `main`.

Ne jamais déployer en production sans validation explicite.

Ne jamais fusionner automatiquement une PR.

**Documentation :**

Documenter toutes les décisions et réalisations significatives en français dans des fichiers Markdown.

Utiliser des tableaux, Mermaid, références d'écrans, captures et liens internes pertinents.

Documenter le fonctionnement réel et les limites, sans inventer de résultats.

**Sécurité et qualité :**

Ne jamais commettre de secrets.

Vérifier les dépendances, licences et permissions.

Ne pas acheter ni activer de forfait payant sans autorisation.

Ne pas déclarer un composant ou une interaction fonctionnelle sans vérification réelle.

### 4. DIRECTION ARTISTIQUE APPROUVÉE

Concevoir Fluentia selon trois univers.

**Discover :**

Site public sombre immersif, premium et animé.

**Learn :**

Application étudiante claire, lumineuse et fonctionnelle.

**Voice :**

Studio d'expression orale sombre avec sphère lumineuse réactive.

Utiliser :

- Bleu nuit `#081B35`.
- Bleu électrique `#1769E0`.
- Cyan `#21D4F4`.
- Blanc cassé `#F7FAFF`.
- Typographie Poppins.

Logo officiel : symbole Fluentia validé, sans flèche.

Ne pas inventer une nouvelle identité ni remplacer les assets de marque.

Slogan de travail : « Maîtrisez le français, allez plus loin. »

### 5. OBJECTIF PRIORITAIRE

Concevoir les maquettes Figma et les spécifications UX/UI complètes avant de développer de nouvelles pages métier.

La présente mission est une mission de conception, d'audit, de structuration et de validation.

Ne pas commencer automatiquement l'implémentation intégrale de la page d'accueil ou du dashboard.

### 6. AUDIT INITIAL OBLIGATOIRE

Examiner :

1. Le dépôt GitHub et les trois branches permanentes.
2. La PR #1 et son état actuel.
3. Les rapports Frontend 01 et les décisions d'architecture.
4. Les composants React existants.
5. Les tokens de design.
6. Les assets officiels.
7. Le fichier Figma existant.
8. Les problèmes responsive précédemment signalés.
9. Les permissions disponibles pour modifier Figma.
10. Les quotas MCP, les limites du forfait et les éventuels blocages.

Établir un inventaire précis des éléments existants avant toute création.

### 7. STRATÉGIE FIGMA

Privilégier le fichier Figma existant et éviter toute duplication inutile.

Organiser la conception dans les pages :

- 00 — Cover & Index
- 01 — Foundations
- 02 — Branding
- 03 — Components
- 04 — Motion & Interaction
- 05 — Public Website
- 06 — Authentication
- 07 — Student App
- 08 — Voice Studio
- 09 — Teachers & Schools
- 10 — Administration
- 11 — Responsive & Accessibility
- 12 — Prototype Flows
- 13 — Handoff

Si la capacité d'édition Figma est confirmée, procéder à la correction des défauts existants et à la création des ressources natives.

S'il existe une limitation de quota ou de permission :

- Ne pas contourner les contrôles.
- Ne pas activer de service payant.
- Préparer les références code-first et les captures nécessaires.
- Documenter précisément les opérations bloquées.
- Ne pas présenter des fichiers locaux comme des maquettes Figma enregistrées.
- Poursuivre les tâches indépendantes réalisables.

### 8. DESIGN SYSTEM COMPLET

Compléter ou normaliser :

- Tokens sémantiques.
- Couleurs.
- Typographies.
- Espacements.
- Rayons.
- Ombres.
- Gradients.
- Grilles.
- Navigation.
- Boutons.
- Champs.
- Formulaires.
- Menus.
- Cartes.
- Modales.
- Notifications.
- Onglets.
- Graphiques.
- Composants d'examen.
- Lecteurs audio.
- Composants de progression.
- États de chargement, erreur, succès et accès refusé.

Créer les propriétés, variantes et états nécessaires.

Utiliser Auto Layout et des contraintes responsive adaptées.

### 9. MAQUETTES COMPLÈTES

Produire les écrans définis dans le cahier UX/UI Fluentia v2.0 :

- Site public.
- Authentification.
- Application étudiante.
- Quatre compétences.
- Examens blancs.
- Résultats.
- Coach.
- Studio oral.
- Progression.
- Enseignants.
- Établissements.
- Administration.

Préparer les formats desktop, tablette et mobile en fonction des besoins.

Les données présentes dans les maquettes doivent être fictives et clairement identifiées.

Ne pas inventer de résultats officiels, de témoignages clients ou de statistiques commerciales réelles.

### 10. STUDIO VOCAL

Créer la sphère lumineuse Fluentia avec des états distincts :

- En attente.
- Écoute.
- Analyse.
- Réponse vocale.
- Erreur.
- Pause ou fin selon le mode.

Documenter les transitions, messages, états de microphone, chronométrage et actions accessibles.

Préparer les scénarios pour Motion for React.

Ne pas prétendre qu'une maquette Figma constitue une analyse audio réelle.

### 11. MOTION DESIGN

Créer les storyboards et spécifications d'animation.

Étudier Motion for React, Magic UI, React Bits et React Three Fiber selon les besoins réels.

Respecter les performances, la lisibilité, les préférences de mouvement réduit et les limites des appareils mobiles.

Ne pas multiplier les dépendances pour de simples effets décoratifs.

### 12. PARCOURS INTERACTIFS

Prototyper en priorité :

1. Découverte → inscription → dashboard.
2. Dashboard → compréhension orale → correction.
3. Dashboard → expression écrite → feedback.
4. Dashboard → studio oral → simulation → rapport.
5. Dashboard → examen blanc → résultats.
6. Gestion d'abonnement.
7. Enseignant → classe → devoir.
8. Administrateur → contenu → validation.

Préparer les états d'erreur et les interruptions.

### 13. CORRESPONDANCE FIGMA / REACT

Créer une matrice contenant :

- Identifiant du composant.
- Nom Figma.
- Nom React.
- Props et variantes.
- Tokens utilisés.
- États documentés.
- Statut d'implémentation.
- Écarts observés.
- Actions correctives.

Ne pas annoncer que Code Connect est configuré si le forfait ou les permissions ne le permettent pas.

### 14. VALIDATIONS

Inspecter visuellement les livrables créés.

Contrôler les trois formats de référence : 375, 768 et 1440 px.

Vérifier :

- Débordements.
- Chevauchements.
- Alignements.
- Auto Layout.
- Contrastes.
- Typographie.
- Cohérence du logo.
- Navigation.
- États des composants.
- Prototypes.
- Accessibilité.
- Réduction des animations.
- Concordance avec React.

Ne pas confondre validation automatique et recette humaine.

### 15. MÉTHODE ITÉRATIVE

Exécuter le processus :

AUDIT → PLAN → CONCEPTION → INSPECTION → CORRECTION → DOCUMENTATION → VALIDATION.

Réaliser des cycles de vérification sur chaque lot.

Ne pas détruire ou remplacer les ressources précédentes sans justification.

Éviter les créations redondantes.

S'arrêter proprement si un blocage rend une exigence impossible à satisfaire.

### 16. LIVRABLES

Livrer autant que les permissions le permettent :

1. Inventaire initial.
2. Design System Fluentia v2.0.
3. Bibliothèque Figma harmonisée.
4. Maquettes publiques.
5. Maquettes d'authentification.
6. Maquettes étudiant.
7. Maquettes professionnelles.
8. Studio vocal et ses états.
9. Prototypes critiques.
10. Variantes responsive.
11. Storyboards d'animation.
12. Rapport d'accessibilité.
13. Matrice Figma/React.
14. Documentation Markdown.
15. Backlog d'implémentation.
16. Rapport final GO/NO-GO.

Distinguer clairement les livrables réalisés, partiels et bloqués.

### 17. GIT ET PULL REQUEST

Toute modification du dépôt doit être réalisée depuis une branche de travail adaptée, issue de `dev`.

Ne pas utiliser de force push.

Ne pas modifier directement `tests` ou `main`.

Exécuter les contrôles applicables.

Créer ou actualiser une PR vers `dev` si des modifications de code ou de documentation sont produites, sans écraser ni fusionner la PR #1 existante.

Conserver une attribution Git fidèle.

Ne pas fusionner sans autorisation explicite de Jonathan Kakesa.

### 18. RAPPORT FINAL

Le rapport doit contenir :

- État initial et état final.
- Fichiers et maquettes créés.
- Identifiants Figma réellement obtenus.
- Écrans terminés et incomplets.
- Captures inspectées.
- Résultats des contrôles.
- Problèmes rencontrés.
- Quotas et permissions.
- SHA et PR GitHub.
- Risques connus.
- Décision GO/NO-GO motivée.
- Liste priorisée des travaux restants.

Ne jamais déclarer un succès complet si les maquettes sont incomplètes ou non inspectées.

**Ne pas fusionner, ne pas déployer en production et ne pas commencer Frontend 02 — implémentation de la page d'accueil — sans décision explicite du propriétaire.**