# Tokens v3 — portée pilote

Responsable : Jonathan Kakesa. Proposition de conception, pas une migration globale approuvée.

| Rôle | Valeur pilote | Usage |
|---|---|---|
| Marque principale | #081B35 | Texte, identité |
| Action | #1769E0 | Bouton principal sur blanc |
| Action sur teinte | #1358BD | Navigation active sur #EAF1FC ; correction du contraste initial à 4,47:1 |
| Cyan | #21D4F4 | Accent vocal ponctuel, pas de texte courant sur blanc |
| Fond | #F8FAFC | Zone de travail |
| Surface | #FFFFFF | Cartes, navigation |
| Bordure structurelle | #E5EAF0 | Séparation non interactive |
| Texte secondaire | #52647A | Description et aide |
| Bordure de contrôle | #71829A | Contrôles qui doivent rester identifiables |
| Focus | #1769E0 | Outline visible de 3 px |

Poppins 400/500/600/700 est déjà locale. Cibles : texte courant 14–16 px, titres de contenu 20–32 px, espaces 8/12/16/24/32/48, cartes autour de 10 px de rayon, contrôles tactiles au moins 44 px. Conserver les bordures de contrôle plus contrastées que les séparateurs décoratifs.

Les déclarations pilotes sont isolées sous human-pilot. Les tokens du catalogue et les prototypes historiques ne sont pas généralisés. Les calculs de contraste et tests effectivement réalisés seront consignés dans [UX_REVIEW.md](UX_REVIEW.md).
