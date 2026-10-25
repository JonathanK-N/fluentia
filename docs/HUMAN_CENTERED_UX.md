# Audit UX — pilotes centrés sur l’apprentissage

Responsable et propriétaire : Jonathan Kakesa. 24 octobre 2026.

## État vérifié avant modification

PR #1 et PR #2 sont fusionnées après deux autorisations explicites. dev est à `2e1ed545540e8ea5fb0c540475ce7e146fcf315f`. Il contient les primitives React, le catalogue, les thèmes et les références autonomes UX/UI, pas l’accueil de la PR #3. La PR #3 reste ouverte en brouillon, HEAD audité `d8abfa06e3403d7069d26656b77c8c31feff4ab9`.

Les composants réellement disponibles dans dev sont Header/Logo, Button/Card/Badge/Field/Alert/Progress, Skeleton/EmptyState, tableau/graphique, Tabs, Dialog, Notification et Reveal. Les 62 références sont dans design/ux-ui-02, sans routes métier React correspondantes. Les examens et leur simulation existante restent intacts ; aucun chronométrage métier React n’existe à supprimer.

La branche temporaire actuelle est issue de ce dev consolidé et validé. La PR #3 est actualisée autour des deux pilotes ; aucune fusion supplémentaire n’est déduite de la nouvelle mission. L’ancienne direction et ses preuves restent dans l’historique.

## Analyse de la référence

La [vue publique Pack Ayoub](https://packayoub.com/dashboard) a été lue en mode invité via le Web ; sa hiérarchie visuelle a aussi été observée dans l’onglet déjà ouvert. Aucun formulaire, contenu d’exercice ou paramètre de compte n’a été utilisé. Aucune donnée personnelle ni capture du compte de référence n’est copiée dans le dépôt.

Principes retenus : rubriques pédagogiques regroupées dans une navigation dédiée, accès direct aux quatre compétences, indicateurs rassemblés et première action visible. Adaptations Fluentia : distinguer clairement absence de données et progression mesurée, proposer une action aux nouveaux étudiants, rendre les libellés entièrement français et conserver une seule priorité par zone. Nous ne reprenons ni marque, contenus, visuels, code ou données du site de référence. L’audit ne constitue pas une validation de ses parcours authentifiés.

## Pourquoi la direction précédente paraît artificielle

La PR #3 privilégiait la mise en scène : deux grandes sphères, halos/orbites, bleu nuit sur toute la page, accents cyan répétés, titre monumental et sections de 112 px de padding. Les captures sources atteignent 12 382 px de hauteur sur mobile 375, contre 7 868 sur desktop. Les grandes cartes, blancs de réservation et flèches parfois purement décoratives donnent plus de place à l’effet visuel qu’à la tâche. C’est une analyse des choix visibles, pas une preuve sur l’origine d’une interface.

## Périmètre limité

Deux pilotes seulement : accueil public et aperçu du tableau de bord étudiant. Pas de généralisation aux 62 références, à l’administration, aux enseignants, aux examens ou à l’authentification avant validation visuelle explicite. Les interactions existantes utiles — FAQ, conseil prédéfini, états Voice, clavier, thèmes du catalogue — sont conservées. La sphère reste dans le studio vocal, plus petite, sans animation autonome permanente.

## Boucle de validation

Audit → maquettes code-first → captures desktop/tablette/mobile → inspection → retour client → ajustements → tests → documentation. Le livrable final de cette étape est un GO/NO-GO pour revue visuelle, pas une autorisation de diffusion ou de généralisation. Voir [UX_REVIEW.md](UX_REVIEW.md).
