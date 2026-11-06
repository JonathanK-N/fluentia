# Généralisation de la direction v3

Responsable : Jonathan Kakesa. 24 octobre 2026.

## Décision et portée

Après présentation des deux pilotes et du rapport de revue, le client a répondu « vas-y ». Cette réponse est retenue comme validation de la direction visuelle et autorisation de la généraliser aux interfaces existantes. Elle ne constitue pas une autorisation de fusion ou de déploiement. La PR #3 reste en brouillon vers dev ; aucune nouvelle branche permanente ou production Railway.

Le périmètre est le catalogue React `/design-system` et les 62 références locales `design/ux-ui-02`. Les autres écrans métier React ne sont pas encore implémentés : une référence HTML ne devient pas un compte, un examen, une facturation ou une administration opérationnels par un changement d’apparence.

## Changements

- Fond #F8FAFC, surfaces blanches, texte bleu nuit, bordures décoratives #E5EAF0 et contrôles plus contrastés ; Poppins et PNG officiels conservés.
- Catalogue React : rayons de 10 px, cartes plus compactes, titres proportionnés, retrait des ombres et du déplacement au survol ; thèmes clair et sombre conservés.
- Prototypes : thème clair commun à Discover, Learn et Voice, qui restent des contextes pédagogiques et non trois palettes opposées. Carte pratique remplaçant la sphère décorative de l’accueil.
- Navigation étudiante regroupée, sans supprimer les 24 routes ; tous les espaces disposent de leur navigation dans le menu mobile, avec Échap et restitution du focus.
- Tableaux dans des régions focalisables pour leur défilement au clavier.
- Studio : sphère de 110 px, sans halo/orbite, réaction de 180 ms sans boucle, neutralisée sous mouvement réduit. Microphone toujours inactif, sept états simulés conservés.

Les simulations, formulaires, erreurs, consignes, confirmations, brouillons temporaires, filtres, parcours pédagogiques et contrôles de sortie sont conservés. Aucun chronométrage serveur n’existait à migrer ; le spécimen 02:00 reste présenté comme illustratif. Aucun prix ou score officiel ajouté. Aucun nouveau package.

## Vérifications et statut

Précontrôles exécutés : syntaxe JavaScript, structure des 62 écrans et huit parcours, trois assets officiels inchangés, huit paires de contraste du thème commun, absence de référence aux SVG approximatifs et de capture micro dans le prototype. Le contrôle des deux thèmes React reste distinct.

La recette CI doit vérifier les 62 écrans à 375/768/1440 sur trois moteurs, les parcours et états, le zoom Chromium, ainsi que la non-régression du frontend React. Un scénario supplémentaire contrôle la navigation mobile étudiant/enseignant/établissement/administration, le logo clair et l’absence de sphère décorative hors studio. Les réussites du checkpoint précédent ne sont pas attribuées à cette généralisation. Les résultats et captures seront ajoutés après exécution et inspection.

Figma natif reste différé selon la stratégie hybride approuvée. Aucun forfait payant ni aucune maquette native prétendument créée. Lecteurs d’écran réels, Safari sur appareil, installation PWA et performance mobile physique ne sont pas validés par ce lot.
