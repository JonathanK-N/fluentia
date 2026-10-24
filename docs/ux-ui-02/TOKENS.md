# Design System Fluentia v2 — proposition de conception

Responsable : Jonathan Kakesa. Source locale : `design/ux-ui-02/tokens.css`. Bibliothèque native Figma v2 **bloquée** ; cette spécification n’est pas une bibliothèque publiée.

## Univers et sémantique

Discover : site sombre et immersif, bleu nuit et cyan. Learn : fonds clairs, surfaces blanches et bleu d’action. Voice : studio sombre, état vocal visible sans dépendre de la seule couleur. Les couleurs de marque restent #081B35, #1769E0, #21D4F4 et #F7FAFF.

| Token | Learn | Discover / Voice |
|---|---|---|
| bg / surface | #F7FAFF / #FFFFFF | #081B35 / #102944 |
| text / muted | #081B35 / #52647A | #F7FAFF / #B7C9DF |
| action / on-action | #1769E0 / #FFFFFF | #21D4F4 / #081B35 |
| accent / focus | #086B82 / #1769E0 | #21D4F4 / #21D4F4 |
| border décoratif | #C9D4E3 | #526982 |
| control-border | #71829A | #7E94AE |
| danger | #A12535 | #FFB1B9 |
| tint | #EAF1FC | #163658 |

La bordure décorative n’est pas le contour d’un champ. Les limites interactives utilisent control-border et le focus 3 px avec offset 4 px. Le cyan n’est pas utilisé comme petit texte sur blanc.

## Typographie et dimensions

Poppins locale 400/500/600/700, licence OFL-1.1 conservée. Corps 15 px / 1,7 ; contenu de lecture 16 px / 1,9 ; h1 privé 30–48 px et titre public 40–76 px ; h2 24 px ; h3 18 px ; contrôles 13 px ; métadonnées 11–12 px. Les titres n’utilisent pas de largeur fixe ; le retour à la ligne prime sur une troncature.

Échelle : 4, 8, 16, 24, 32, 48 et 64 px. Carte 24 px de padding, 20 px sur mobile ; rayon carte 16 px, contrôle 10 px, pilule 999 px. Ces rayons sont une proposition v2 à arbitrer face à la PR #1. Ombre carte : 0 12px 40px #081B3509 ; une ombre ne remplace jamais un contour de focus.

Grille publique 1280 px maximum. Rail privé 224 px, puis 192 px, repli sous 800 px ; deux colonnes de travail, une sous 600 px. Les listes d’administration utilisent des tableaux défilants dans leur conteneur ; leurs actions gardent des libellés visibles.

Gradient de marque : bleu électrique → cyan ; réservé à la décoration. Sphère : radial cyan → bleu → nuit. Aucun nouveau logo ni SVG reconstruit.

## États et propriétés

Utiliser les composants et propriétés de [la matrice](FIGMA-REACT.md). Les variantes de style ne doivent pas multiplier les contenus ; employer propriétés texte et swaps lorsque pertinents. Limiter chaque matrice à une taille révisable ; scinder clair/sombre ou familles si nécessaire. Les modes et pages Figma restent soumis au forfait réel. Aucun achat automatique.

La cohérence v2 n’est pas déclarée validée tant que les variantes natives, les rayons proposés et le rendu responsive n’ont pas reçu la recette requise.
