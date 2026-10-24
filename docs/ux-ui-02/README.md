# Fluentia — Mission UX/UI 02

Propriétaire et responsable : Jonathan Kakesa. Spécifications v2.0 reçues le 24 octobre 2026.

Documents fournis : [cahier UX/UI v2](sources/CAHIER_UX_UI_V2.md) et [mission UX/UI 02](sources/MISSION_UX_UI_02.md). Les statuts du présent dossier distinguent la demande, les réalisations locales et les opérations Figma bloquées.

**Mission de conception, sans implémentation Frontend 02.** La [PR #1](https://github.com/JonathanK-N/fluentia/pull/1) est désormais fusionnée dans dev après autorisation ; ce dev est intégré dans la branche de la [PR #2](https://github.com/JonathanK-N/fluentia/pull/2). La [validation technique du point B](../VALIDATION_PR_02.md) distingue la préparation à l’intégration de la livraison de conception complète. La stratégie [Code-First approuvée](../DECISIONS/002-code-first-et-consolidation.md) permet de différer Figma, qui reste incomplet dans le [backlog](../FIGMA_SYNC_BACKLOG.md). La PR #2 attend sa propre autorisation de fusion.

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

Mise à jour de consolidation : la PR #2 est désormais fusionnée après sa propre autorisation. L’accueil React est développé séparément dans la [PR #3](https://github.com/JonathanK-N/fluentia/pull/3) ; les références locales restent des documents de conception et Figma reste incomplet. Les formulations d’attente ci-dessus concernent les étapes antérieures à cette décision.

Aucune nouvelle identité, aucun SVG de substitution, aucun témoignage ni résultat officiel inventé. Les métadonnées Git existantes sont conservées ; aucune signature promotionnelle ajoutée. Aucun forfait payant ni déploiement. La fusion de la PR #1 est autorisée et effectuée ; celle de la PR #2 attend le point B. La stratégie dev → tests → main demeure applicable. Le développement Frontend 02 commence après la consolidation autorisée et validée de dev.
