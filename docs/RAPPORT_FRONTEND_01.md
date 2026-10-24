# Rapport de finalisation — Frontend 01

Responsable et propriétaire : Jonathan Kakesa. 24 octobre 2026.

## Décision historique et réévaluation Code-First

La feuille de route Frontend 02 approuve désormais une stratégie Code-First. Le [rapport de validation au point A](VALIDATION_PR_01.md) propose un **GO technique pour intégration vers dev, sous autorisation explicite**, avec synchronisation Figma différée dans le [backlog](FIGMA_SYNC_BACKLOG.md). Il remplace les conditions Figma préalables à la fusion figurant plus bas. Aucune fusion n’a été effectuée. Les constats et résultats historiques suivants restent conservés.

### Décision historique : NO-GO pour la livraison Figma complète

La validation automatisée du frontend est positive. Le Design System complet n’est cependant **pas validé** : la revue de la maquette tablette Figma montre des débordements et des chevauchements. Le quota Starter bloque les corrections et les nouvelles captures. La [PR #1 vers dev](https://github.com/JonathanK-N/fluentia/pull/1) reste en brouillon jusqu’à correction et revue. Aucun forfait payant n’a été activé.

## Références Git et correction des SHA

Référence de départ : dernier commit alors présent dans la PR, `9b4cfa902b9acc20774ec651921ac777969d0654`. Les deux derniers contrôles disponibles à ce moment ont été examinés : [40082962080, pull_request](https://github.com/JonathanK-N/fluentia/actions/runs/40082962080) et [40082958171, push](https://github.com/JonathanK-N/fluentia/actions/runs/40082958171). Tous deux sont réussis sur ce même SHA ; leurs jobs web et api ne couvraient ni Docker ni les trois moteurs.

L’ancien rapport attribuait à tort le même SHA à deux commits distincts. Références exactes relues dans `git log` :

| Commit | Objet |
|---|---|
| `7f26e311a54bf9e383224bd4b21133c64d10db1b` | Verrouiller les dépendances et renforcer les validations automatisées |
| `1703d25ce7c9b4ab4854fd5a6f0c6c91db5d3e7c` | Affiner les cartes et documenter les dépendances vérifiées |
| `9b4cfa902b9acc20774ec651921ac777969d0654` | Consigner les validations et les captures du premier lot frontend |
| `3480bd210d11f8f1cc9c8718bf2b5393f3121fff` | Étendre la validation aux trois moteurs, au zoom et au conteneur Docker |
| `5967491f5f44d212a64f31b1bc309ce44cc558de` | Aligner les dimensions CSS avec les variables du Design System |

Les résultats sont rattachés à leur SHA dans [TESTING.md](TESTING.md). Un commit de documentation ultérieur ne doit pas être présenté comme le SHA d’une exécution antérieure. Le SHA final livré et ses derniers runs sont indiqués dans la description de la PR ; le présent document ne tente pas de contenir son propre SHA.

## Modifications

- CI Chromium, Firefox et WebKit, résultats JSON et captures séparées par moteur.
- Zoom **navigateur** à 200 % sur Chromium : facteur 2 et viewport CSS 1440 → 720, sans zoom CSS de substitution.
- Contrôles des thèmes, lien d’évitement, focus, erreurs, notifications, onglets au clavier, dialogue, mouvements réduits et erreurs JavaScript.
- Bordure des champs renforcée ; dimensions CSS exposées pour leur correspondance Figma.
- Build et démarrage Docker en CI ; contrôles HTTP accueil, catalogue, manifest et icône.
- 44 PNG/ICO comparés octet par octet à l’archive officielle ; aucune référence active aux SVG approximatifs. [Preuve et contrastes](evidence/brand-assets-and-contrast.json).
- Figma enrichi : 15 ensembles totalisant 92 variantes et six compositions responsive. Instances et textes Poppins éditables, logos PNG officiels. Leur création ne constitue pas une validation visuelle.

## Résultats et limites

| Sujet | Résultat exact |
|---|---|
| Installation, audit, lint, TypeScript, DOM, build Next | Réussis en CI Linux ; 7 tests DOM, zéro vulnérabilité signalée par npm audit |
| Navigateurs et responsive | 22 scénarios réussis ; 375/768/1440 px sur les trois moteurs |
| Zoom | Chromium réussi à 200 % ; 2 scénarios exclus explicitement, Firefox et WebKit |
| Contrastes | Axe sans violation dans les parcours testés ; 13 paires calculées, seuils 4,5:1 texte et 3:1 limites des champs |
| Docker | Build et contrôles du conteneur réussis en CI ; Docker absent de cette machine Windows |
| PWA | Manifest et dimensions PNG vérifiés ; zéro service worker ; navigation hors ligne indisponible constatée |
| Installation PWA réelle | Non exécutée sur Android/iOS ni dans une fenêtre installée ; aucune installabilité réelle revendiquée |
| Figma | Non validé ; défauts sur tablette et autres nouvelles compositions non inspectées visuellement |
| Code Connect | Refus du service : siège Dev/Full et forfait Organization/Enterprise requis ; correspondances manuelles documentées |
| Accessibilité humaine | Lecteurs d’écran, appareils physiques et compréhension des messages non testés |

WebKit Linux ne remplace pas Safari macOS/iOS. Axe ne démontre pas à lui seul une conformité complète. L’installation npm locale avait été interrompue pour lenteur ; aucun build local réussi n’est revendiqué.

## Blocage Figma et reprise

La [capture tablette](images/figma-tablette-a-corriger.png) montre une navigation trop large, des actions non repliées, des champs/barres dépassant leurs cartes, des libellés différents du React et des sections qui se chevauchent. Les axes d’auto-layout et les contraintes doivent être corrigés, puis les six formats et la planche de composants doivent être inspectés. Le [correctif préparé](../scripts/figma-repair-layouts.js) **n’a pas été exécuté** et ne garantit pas à lui seul la correction complète.

Le service renvoie que le quota Figma Starter est atteint ; la correction et sa vérification sont impossibles avec ce quota. La capture temporaire de référence `9:11` reste à supprimer après finalisation. Le script de capture a été retiré du code applicatif avant livraison. [Détails Figma](FIGMA.md).

## Conditions avant un GO

1. Rétablir un accès Figma permettant la correction, sans activation payante non autorisée.
2. Corriger et inspecter les composants, variantes, thèmes et six maquettes ; terminer l’alignement React/Figma, les syntaxes WEB des primitives, scopes, ombres et focus, puis retirer la capture temporaire.
3. Faire arbitrer par Jonathan Kakesa les limites de recette humaine et d’installation PWA, sans les transformer en tests réussis.
4. Vérifier les contrôles du dernier SHA de la PR et obtenir une décision humaine explicite avant fusion vers `dev`.

Branche : `frontend/mission-01`. La stratégie `dev → tests → main` est conservée. Aucune modification directe de main, aucune fusion, aucun déploiement Railway Production et aucun début de mission Frontend 02.
