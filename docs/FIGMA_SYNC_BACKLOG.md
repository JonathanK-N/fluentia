# Backlog de synchronisation Figma

Responsable : Jonathan Kakesa. 24 octobre 2026. Stratégie [Code-First approuvée](DECISIONS/002-code-first-et-consolidation.md).

## État constaté

Les créations et captures historiques de Frontend 01 ne constituent pas une bibliothèque validée. Des débordements et chevauchements tablette sont connus. Lors de la mission UX/UI 02, la lecture a été refusée pour quota Starter et le compte indiquait un siège View. Aucun nouveau contrôle du canevas ni aucune édition Figma n’a été effectué pendant cette consolidation. Aucun forfait payant n’est activé.

## Direction v3 : validation préalable

Les deux pilotes ont été validés pour poursuite (« vas-y »). La généralisation code-first est suivie dans [GENERALISATION_V3.md](GENERALISATION_V3.md) ; la synchronisation native ne sera revendiquée qu’après écriture et inspection réelles dans Figma.

La nouvelle référence proposée est limitée à l’accueil clair et au tableau de bord étudiant : [UX_REVIEW.md](UX_REVIEW.md). Attendre leur validation visuelle explicite avant toute généralisation ou synchronisation globale. Le hero immersif et son dashboard miniature sont désormais historiques. Les futures maquettes doivent reprendre les états vide, rempli fictif, indisponible, les dialogues, la navigation mobile et la petite sphère Voice sans boucle. Aucun nouveau nœud natif Figma n’a été créé ou modifié pendant ce redesign ; synchronisation différée conformément à la décision hybride, sans forfait payant.

## Priorités historiques à réévaluer après validation v3

L’accueil React Frontend 02 est désormais implémenté ; sa synchronisation native reste à effectuer à partir du SHA et des captures réellement validés dans [FRONTEND_02.md](FRONTEND_02.md). Aucun nouveau nœud Figma n’est obtenu dans ce lot. Inclure la sphère statique/animée, les sept états Voice, le menu/pause, les offres non commerciales et le dashboard fictif, en conservant leurs avertissements de disponibilité.

| Priorité | Travail restant | Preuve attendue |
|---|---|---|
| P1 | Corriger les auto-layouts, contraintes, navigation et champs des compositions Frontend 01 | Captures inspectées des six formats et absence de chevauchements |
| P1 | Aligner primitives, variantes, libellés, scopes, focus et syntaxe WEB sur React | Matrice comparée au code réellement intégré |
| P1 | Arbitrer les écarts entre tokens React v1 et propositions UX/UI v2 | Décision documentée avant modification des fondations |
| P2 | Reprendre l’inventaire des pages et composants UX/UI 02 | IDs réellement obtenus, aucune valeur fictive |
| P2 | Créer les maquettes natives et huit parcours à partir des références validées | Écrans responsive et états inspectés individuellement |
| P2 | Synchroniser l’accueil Frontend 02 une fois développé et validé | Captures et SHA de référence, mapping des composants |
| P3 | Retirer la capture temporaire historique `9:11` après vérification | Suppression confirmée dans Figma |
| P3 | Réexaminer Code Connect si un accès compatible devient disponible | Configuration réellement testée, sans activation payante implicite |

## Critères de clôture

Accès permettant la lecture/édition, composants et maquettes inspectés, IDs traçables, correspondance avec le code intégré, limites restantes documentées et décision du propriétaire. Les captures HTML/React restent identifiées comme telles. Le quota seul ne bloque plus le développement frontend ; il empêche toujours de déclarer cette synchronisation terminée.
