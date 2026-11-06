# Fluentia — Kit de marque et actifs PWA

**Direction visuelle :** Concept 03, symbole F avec onde vocale, **sans flèche**.

**Projet :** Jonathan Kakesa.

## Contenu

- `01_Logos_PNG/` : variations horizontales, avec slogan et icône sur fonds clair/sombre/transparents.
- `02_Icons_PWA/` : applications classiques et maskable 192/512, icônes Apple.
- `03_Favicons/` : ICO multi-résolution et PNG 16 à 256.
- `04_SVG/` : interprétations vectorielles éditables du signe et logos (à valider avant impression).
- `06_Sources/` : symbole raster extrait de l'image de référence approuvée.

## Couleurs

| Usage | HEX |
|---|---|
| Bleu nuit | `#061B3D` |
| Bleu électrique | `#0B4DFF` |
| Cyan | `#00D4FF` |
| Fond très clair | `#F7FAFF` |

## Slogan

Dans les assets éditables, le slogan français retenu *à titre provisoire* est « Maîtrisez le français, allez plus loin. ». Les icônes sont sans slogan.

## Next.js / PWA

1. Copier les icônes de `02_Icons_PWA` vers `apps/web/public/brand/icons/`.
2. Copier `manifest.webmanifest` vers `apps/web/public/manifest.webmanifest`.
3. Copier les favicons dans `apps/web/public/`.
4. Ajouter `manifest: '/manifest.webmanifest'` dans `metadata` Next.js; ajouter les liens d'icône dans metadata.icons.
5. Tester l'installation Android et iOS, les zones de sécurité maskable et les thèmes clair/sombre.

## Attention qualité

Les PNG source reproduisent le logo validé à partir de la planche graphique; les SVG sont des **reconstructions éditables** et non la vectorisation certifiée du dessin original. Avant impression ou dépôt d'une marque, finaliser le master SVG dans Figma et comparer visuellement. Le symbole extrait de la planche dispose d'une résolution native limitée; les PNG 1024 sont des agrandissements, pas de nouveaux détails. L'usage du nom Fluentia reste sous réserve d'une vérification des droits de marque.
