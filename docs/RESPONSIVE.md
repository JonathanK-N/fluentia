# Responsive

Responsable : Jonathan Kakesa.

Conteneur : maximum 1240 px, marges de 32 px puis 20 px sur mobile. La grille des compétences passe de quatre à deux colonnes sous 1000 px et à une sous 700 px. La navigation mobile utilise un panneau `details` ; les liens restent accessibles au clavier. La composition hero et les démonstrations passent à une colonne sous 700 px. La décoration est contenue dans le hero ; les tableaux défilent dans leur propre conteneur.

Les tests Playwright exécutés couvrent 375, 768 et 1440 px sur Chromium, Firefox et WebKit, avec détection de débordement horizontal. Le zoom navigateur à 200 % est exécuté et réussi sur Chromium ; il est exclu sur les deux autres moteurs. La recette sur appareils physiques, Safari macOS/iOS, le grossissement de texte seul et le zoom Firefox/WebKit restent non exécutés. Les maquettes Figma sont distinctes du frontend testé et présentent des défauts documentés dans [FIGMA.md](FIGMA.md).
