# Responsive

Responsable : Jonathan Kakesa.

## Accueil Frontend 02 — recette ajoutée

Les tests ciblent 320, 375, 390, 768, 1024, 1440 et 1920 px, et les grilles à 600/900/1280 en complément. Navigation compacte sous 900 ; hero sur une colonne sous 600 ; compétences 4/2/1 colonnes ; parcours 5/3/1 ; offres 3/1. Aucun écran n’impose une scène 3D ou une largeur fixe. Les contrôles vérifient débordement et intersections des cartes. Le dashboard est une référence non interactive dont la barre latérale décorative disparaît sur petit écran. Les valeurs historiques ci-dessous concernent la mission 01 ; la nouvelle recette et son inspection sont suivies dans [FRONTEND_02.md](FRONTEND_02.md).

Conteneur : maximum 1240 px, marges de 32 px puis 20 px sur mobile. La grille des compétences passe de quatre à deux colonnes sous 1000 px et à une sous 700 px. La navigation mobile utilise un panneau `details` ; les liens restent accessibles au clavier. La composition hero et les démonstrations passent à une colonne sous 700 px. La décoration est contenue dans le hero ; les tableaux défilent dans leur propre conteneur.

Les tests Playwright exécutés couvrent 375, 768 et 1440 px sur Chromium, Firefox et WebKit, avec détection de débordement horizontal. Le zoom navigateur à 200 % est exécuté et réussi sur Chromium ; il est exclu sur les deux autres moteurs. La recette sur appareils physiques, Safari macOS/iOS, le grossissement de texte seul et le zoom Firefox/WebKit restent non exécutés. Les maquettes Figma sont distinctes du frontend testé et présentent des défauts documentés dans [FIGMA.md](FIGMA.md).
