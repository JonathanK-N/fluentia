# Design system Fluentia v1.0

Responsable : Jonathan Kakesa. Source : `apps/web/app/globals.css`. Catalogue : `/design-system`.

| Rôle | Clair | Sombre |
|---|---|---|
| `--bg` | #F7FAFF | #081B35 |
| `--surface` | #FFFFFF | #102944 |
| `--text` | #081B35 | #F7FAFF |
| `--muted` | #52647A | #B7C9DF |
| `--action` | #1769E0 | #21D4F4 |
| `--on-action` | #FFFFFF | #081B35 |
| `--accent` | #086B82 | #21D4F4 |
| `--border` | #C9D4E3 | #526982 |

La palette officielle est conservée dans `--brand-*`. Le cyan clair est décoratif ou associé à un texte bleu nuit ; l’accent de texte clair utilise une variante plus sombre. La police Poppins locale comporte les graisses 400, 500, 600 et 700. Les titres utilisent `clamp()` ; les espacements de référence sont 4, 8, 16, 24, 32 et 48 px. Les cartes ont un rayon de 0,9 rem et une ombre discrète ; les actions ont un rayon de 0,6 rem.

Le système suit le thème système au premier rendu. Le bouton de navigation applique une surcharge `data-theme` au document ; le choix est volontairement limité au document courant, sans stockage. Aucun flash dû à une lecture tardive du stockage.

Figma : [Fondations frontend 01](https://www.figma.com/design/SIjNphVU1NHimwwImszGbE). Les valeurs CSS restent la référence d’implémentation. Le second mode de variables dépend d’un forfait Figma compatible.
