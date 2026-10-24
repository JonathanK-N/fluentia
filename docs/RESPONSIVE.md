# Responsive

Responsable : Jonathan Kakesa.

Conteneur : maximum 1240 px, marges de 32 px puis 20 px sur mobile. La grille des compétences passe de quatre à deux colonnes sous 1000 px et à une sous 700 px. La navigation mobile utilise un panneau `details` ; les liens restent accessibles au clavier. La composition hero et les démonstrations passent à une colonne sous 700 px. La décoration est contenue dans le hero ; les tableaux défilent dans leur propre conteneur.

Les tests Playwright couvrent 375, 768 et 1440 px, avec détection de débordement horizontal. La recette humaine doit compléter avec zoom à 200 %, tailles de texte augmentées et navigateurs Safari/Firefox sur appareils réels.
