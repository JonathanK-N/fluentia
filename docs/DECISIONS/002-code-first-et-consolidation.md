# ADR 002 — Code-First et consolidation séquentielle

Responsable et propriétaire : Jonathan Kakesa. Décision demandée le 24 octobre 2026 dans la feuille de route Frontend 02.

## Décision approuvée

React / Next.js → tests navigateur et inspection visuelle → documentation → synchronisation Figma ultérieure. Le quota Figma Starter ne bloque plus, à lui seul, une intégration technique sur dev. Les références locales ne deviennent pas des maquettes natives Figma ; les défauts et travaux manquants restent dans le [backlog](../FIGMA_SYNC_BACKLOG.md).

Cette décision remplace les conditions des anciens rapports qui exigeaient une finalisation Figma avant toute progression technique. Elle ne transforme pas les tests non exécutés, les écrans partiels ou les défauts connus en réussites.

## Ordre et autorisations

1. Auditer et valider la PR #1 ; présenter le rapport puis attendre l’autorisation explicite de sa fusion vers dev.
2. Après cette fusion effective, intégrer dev dans la branche de la PR #2 par une fusion ordinaire, résoudre les conflits et tester ensemble frontend et références UX/UI. Présenter le rapport puis attendre une deuxième autorisation de fusion.
3. Créer `frontend/mission-02-landing` depuis le dev consolidé et validé ; développer l’accueil, puis ouvrir une PR en brouillon.
4. Attendre une décision explicite pour toute fusion ou tout déploiement ultérieur. Respecter `dev → tests → main`.

La feuille de route n’accorde aucune autorisation anticipée de fusion. Aucun changement de forfait, service payant ou déploiement Production n’est autorisé.

## Conséquences

Les composants et tokens React existants servent de fondation. Les différences des propositions UX/UI v2 restent à arbitrer : ne pas substituer automatiquement leur palette sémantique ou leurs dimensions aux tokens React. Les deux suites de recette doivent être conservées lors de la consolidation. Le [rapport de validation](../VALIDATION_PR_01.md) distingue le GO technique de l’approbation humaine et de la synchronisation Figma.
