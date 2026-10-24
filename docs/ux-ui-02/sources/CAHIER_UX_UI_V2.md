# FLUENTIA — CAHIER DE CONCEPTION UX/UI
## Version 2.0 — Maquettes intégrales

**Projet :** Fluentia — Plateforme de préparation au TCF pour le Québec

**Propriétaire :** Jonathan Kakesa

**Identité de référence :** Cognito Inc.

**Dépôt :** https://github.com/JonathanK-N/fluentia

**Figma existant :** https://www.figma.com/design/SIjNphVU1NHimwwImszGbE

**Statut :** Spécifications de conception approuvées — réalisation et recette à effectuer.

---

## A. Vision du produit

Fluentia doit combiner une expérience SaaS premium, une pédagogie structurée et des outils d'évaluation intelligents.

L'expérience publique doit être immersive et mémorable. L'application étudiante doit être claire, confortable, accessible et adaptée à de longues séances de travail.

### Univers visuels

- **Fluentia Discover :** site public sombre, effets de profondeur, transitions et démonstrations.
- **Fluentia Learn :** application claire, navigation stable, cartes pédagogiques et progression.
- **Fluentia Voice :** studio vocal sombre avec sphère lumineuse réactive.

## B. Identité graphique

- Logo : concept Fluentia validé, sans flèche.
- Couleur principale : `#081B35`.
- Couleur d'action : `#1769E0`.
- Couleur d'accent : `#21D4F4`.
- Fond clair : `#F7FAFF`.
- Police principale : Poppins.
- Slogan de travail : « Maîtrisez le français, allez plus loin. »
- Langue : français adapté au public québécois.

Les assets validés doivent être réutilisés sans substitution arbitraire.

## C. Design System

Définir les tokens de couleur, typographie, espacement, dimensions, bordures, rayons, ombres, gradients et animations.

Produire une bibliothèque comprenant :

- Navigation publique et privée.
- Boutons et variantes.
- Champs de formulaire et validation.
- Menus, listes, onglets, modales et notifications.
- Cartes pédagogiques.
- Lecteurs audio et états microphone.
- Questions QCM.
- Éditeur de rédaction.
- Chronomètre d'examen.
- Indicateurs de progression.
- Graphiques et tableaux.
- Composants de facturation.
- États vides, erreurs et chargement.

Utiliser des Auto Layout, composants, propriétés et variantes Figma lorsque les capacités du forfait le permettent.

## D. Écrans à concevoir

### Lot 1 — Site public

Accueil, fonctionnalités, méthode, examens, tarifs, démonstration, FAQ et contact.

Concevoir également les pages légales nécessaires.

### Lot 2 — Authentification

Inscription, connexion, récupération de mot de passe, réinitialisation, vérification d'e-mail et onboarding.

### Lot 3 — Application étudiante

Dashboard, diagnostic, plan d'étude, catalogue, compréhension orale, compréhension écrite, expression écrite, expression orale, examens blancs, résultats, coach, studio vocal, rédaction, progression, historique, calendrier, notifications, abonnement, profil et paramètres.

Le regroupement de plusieurs fonctionnalités dans un même écran est autorisé si l'ergonomie le justifie.

### Lot 4 — Enseignants

Dashboard, classes, étudiants, devoirs, corrections et statistiques.

### Lot 5 — Établissements

Dashboard, membres, groupes, licences et facturation.

### Lot 6 — Administration

Dashboard, utilisateurs, contenus, questions, examens, validations, modèles d'évaluation, paiements, support et paramètres.

## E. Responsive

Formats de référence :

- Desktop : 1440 px.
- Tablette : 768 px.
- Mobile : 375 px.

Les interfaces devront aussi s'adapter aux tailles intermédiaires et aux zooms.

Aucun chevauchement, défilement horizontal involontaire ou débordement de contenu.

## F. Animations et micro-interactions

Utiliser Motion for React et, lorsque pertinent, des composants Magic UI ou React Bits.

Définir des scénarios pour :

- Apparition des sections.
- Navigation.
- Survol des cartes.
- Ouverture des modales.
- Changements d'onglets.
- Progression.
- Retours de validation.
- États du studio vocal.

Les effets 3D complexes sont réservés aux interfaces où ils apportent de la valeur.

Respecter `prefers-reduced-motion` et les capacités des appareils.

## G. Studio oral

États obligatoires :

1. En attente.
2. Écoute.
3. Analyse.
4. Réponse vocale.
5. Erreur.
6. Pause ou fin de session, selon le mode.

Pour chaque état : visuel, texte accessible, transition, son éventuel et comportement du système.

Ne pas confondre simulation graphique et capture audio réelle.

## H. Parcours prototypes

Construire les huit parcours principaux définis dans la spécification UX/UI, du visiteur jusqu'aux résultats, et inclure les parcours enseignants et administrateurs.

Chaque parcours doit traiter les cas nominaux, les erreurs et les interruptions pertinentes.

## I. Accessibilité

- WCAG 2.2 AA comme objectif.
- Contraste suffisant.
- Navigation clavier.
- Indicateurs de focus.
- Libellés explicites.
- Animation réduite.
- Interfaces utilisables avec des technologies d'assistance.
- États et erreurs compréhensibles.

## J. Organisation Figma

Utiliser les pages `00` à `13` définies dans le plan de conception, en privilégiant la réutilisation du fichier existant.

Ne pas recréer des ressources déjà valides.

Documenter chaque écran avec son rôle, sa route, ses variantes, ses états et ses interactions.

## K. Contrôles qualité

Comparer les maquettes avec le frontend existant.

Vérifier :

- La charte visuelle.
- La cohérence des composants.
- La qualité du responsive.
- Les contrastes.
- Les parcours prototypés.
- Les interactions.
- Les correspondances entre Figma et React.
- L'intégrité des assets officiels.

Toute vérification non exécutée doit être explicitement identifiée.

## L. Livrables

- Design System v2.0.
- Bibliothèque de composants.
- Maquettes des écrans prévus.
- Variantes responsive.
- Prototype des parcours critiques.
- Storyboards de motion design.
- Spécification de la sphère vocale.
- Inventaire des assets.
- Rapport d'accessibilité.
- Mapping Figma ↔ React.
- Documentation Markdown.
- Backlog des travaux frontend.
- Rapport GO/NO-GO.

Les livrables indisponibles en raison des permissions Figma doivent être marqués comme bloqués et accompagnés d'une solution de repli, sans revendication de livraison fictive.