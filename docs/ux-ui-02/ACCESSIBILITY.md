# Accessibilité et recette — objectif WCAG 2.2 AA

Responsable : Jonathan Kakesa. Les vérifications automatiques du prototype local ne constituent pas une certification de conformité.

## Contrat de conception

Learn utilise du texte nuit sur fond clair et une action bleue ; Discover/Voice utilisent du texte clair et une action cyan. Le script verify.py calcule seize paires de contraste : seuil 4,5:1 pour les textes concernés et 3:1 pour les contours interactifs et le focus. Il contrôle aussi trois hashes d’assets et la structure des 62 écrans/huit parcours. Il ne mesure pas un rendu Figma inaccessible.

Lien d’évitement fonctionnel sans changement de route, régions nommées, h1 visible, focus 3 px avec décalage, boutons de 46 px minimum, labels explicites, champs en erreur liés au message, QCM en fieldset/legend, tableaux avec caption et en-têtes, régions live pour les retours. Les modales natives préservent Échap, piégeage du focus et retour au déclencheur. La sphère est décorative ; son état est textuel.

Ne pas imposer le drag pour déplacer une séance ; proposer une commande équivalente. Aucun paiement ni test cognitif n’est requis pour accéder au prototype. Une future authentification doit permettre gestionnaires de mots de passe et collage ; les mots de passe demandés ici sont fictifs et ne sont jamais stockés.

## Contrôles préparés

Les tests Playwright couvrent les 62 écrans à 375/768/1440 dans chaque moteur configuré, l’absence de débordement horizontal, axe à 1440 sur chaque écran, les huit parcours, les validations et confirmations. Les états chargement/vide/erreur/accès refusé/hors ligne sont examinés sur sept écrans représentatifs. Le mouvement réduit est vérifié sur la sphère ; le menu mobile et la planche de composants sont examinés.

Ces phrases décrivent le périmètre des tests. Seul [le rapport de recette](REPORT.md) indique les résultats effectivement exécutés et les SHA.

## Limites explicites

- Pas de relecture du fichier Figma, de correction native ou de prototype Figma, quota atteint.
- Pas de lecteur d’écran NVDA/VoiceOver ni de recette sur appareil physique.
- Pas de validation cognitive, pédagogique, linguistique spécialisée ou juridique des textes.
- Pas d’audit d’authentification, paiement, audio réel ou permissions serveur : ces systèmes ne sont pas implémentés.
- Zoom navigateur réel à 200 % vérifié en CI sur Chromium, avec facteur 2 et largeur CSS 1440 → 720. Les deux cas Firefox/WebKit sont exclus. L’export de capture au zoom est partiel et ne constitue pas une validation visuelle complète ; un viewport étroit n’est jamais substitué au zoom réel.
- Une erreur axe absente ne démontre pas toutes les exigences de WCAG 2.2 AA ; la visibilité du focus, l’ordre, le sens et les tâches exigent une recette humaine.

Référence normative consultée : [WCAG 2.2, W3C](https://www.w3.org/TR/WCAG22/). Le texte de la norme ne transforme pas l’objectif du projet en conformité acquise.
