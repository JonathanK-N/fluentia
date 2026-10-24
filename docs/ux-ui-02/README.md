# Fluentia — Mission UX/UI 02

Propriétaire et responsable : Jonathan Kakesa. Spécifications v2.0 reçues le 24 octobre 2026.

Documents fournis : [cahier UX/UI v2](sources/CAHIER_UX_UI_V2.md) et [mission UX/UI 02](sources/MISSION_UX_UI_02.md). Les statuts du présent dossier distinguent la demande, les réalisations locales et les opérations Figma bloquées.

**Mission de conception, sans implémentation Frontend 02.** La [PR #2 vers dev](https://github.com/JonathanK-N/fluentia/pull/2) est indépendante de la [PR #1](https://github.com/JonathanK-N/fluentia/pull/1), non fusionnée. Le verdict de livraison complète reste NO-GO tant que Figma et la recette finale sont bloqués.

| Livrable | Référence | Statut |
|---|---|---|
| Audit et références Git | [AUDIT.md](AUDIT.md) | Réalisé ; relecture du canevas Figma bloquée |
| Design System v2 proposé | [TOKENS.md](TOKENS.md) | Spécifié localement ; arbitrage et bibliothèque native restants |
| 62 fiches d’écrans | [SCREENS.md](SCREENS.md) | Références locales ; écrans professionnels et légaux partiels |
| Huit parcours | [FLOWS.md](FLOWS.md) | Simulations locales, pas de prototypes Figma enregistrés |
| Studio et sept états | [VOICE.md](VOICE.md) | Spécifié et simulé ; aucune capture audio réelle |
| Storyboards motion | [MOTION.md](MOTION.md) | Spécifiés ; animations avancées et Figma restants |
| Accessibilité | [ACCESSIBILITY.md](ACCESSIBILITY.md) | Objectif, contrôles et limites ; pas de certification |
| Matrice Figma ↔ React | [FIGMA-REACT.md](FIGMA-REACT.md) | 14 familles existantes et 15 familles métier proposées |
| Organisation pages 00–13 | [FIGMA-PLAN.md](FIGMA-PLAN.md) | Plan préparé, aucune page native créée |
| Inventaire des assets | [assets.json](../../design/ux-ui-02/assets.json) | Trois PNG officiels et Poppins, licences conservées |
| Backlog | [BACKLOG.md](BACKLOG.md) | Priorisé, sans autorisation automatique d’implémentation |
| Résultats et décision | [REPORT.md](REPORT.md) | Résultats réels et limites, à lire avant toute décision |

## Examiner les références locales

```bash
node design/ux-ui-02/serve.mjs
```

[Index](http://127.0.0.1:4173/#index) · [Discover](http://127.0.0.1:4173/#P01) · [Learn](http://127.0.0.1:4173/#S01) · [Voice](http://127.0.0.1:4173/#S13).

Le prototype écoute uniquement 127.0.0.1. Il affiche des données fictives et n’a aucun service métier connecté. Les commandes et limites sont décrites dans le [guide local](../../design/ux-ui-02/README.md). Les routes du catalogue sont des cibles de conception, pas de nouvelles routes applicatives livrées dans apps/web.

## Gouvernance

Aucune nouvelle identité, aucun SVG de substitution, aucun témoignage ni résultat officiel inventé. Les métadonnées Git existantes sont conservées ; aucune signature promotionnelle ajoutée. Aucun forfait payant, merge ou déploiement. La stratégie dev → tests → main demeure applicable. La mission Frontend 02 nécessite une décision explicite de Jonathan Kakesa.
