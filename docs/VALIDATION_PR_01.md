# Validation PR #1 — point d’approbation A

Responsable et propriétaire : Jonathan Kakesa. 24 octobre 2026.

## Décision proposée

**GO technique pour intégration de la PR #1 vers dev, sous autorisation explicite du propriétaire.** La stratégie [Code-First approuvée](DECISIONS/002-code-first-et-consolidation.md) permet de différer la synchronisation Figma. Aucun autre défaut bloquant n’a été identifié dans le périmètre audité. Ce GO n’est ni une certification d’accessibilité, ni une validation de production, ni une autorisation de fusion.

## Référence et preuves

Code audité : `82c5a0ecff25bc81cdf0366a274024d578fbf7a5`, [PR #1](https://github.com/JonathanK-N/fluentia/pull/1), base dev `6fe83c281d9b2d94499a0208f8bd4ef3251edc5a`. Les deux derniers contrôles disponibles sur cette référence ont été relus, avec leurs jobs et les logs web/Docker : [40087127072, PR](https://github.com/JonathanK-N/fluentia/actions/runs/40087127072), [40087124926, push](https://github.com/JonathanK-N/fluentia/actions/runs/40087124926). Tous sont réussis. Les exécutions sont celles de la CI Linux du 24 octobre ; elles ne sont pas présentées comme de nouveaux tests Windows.

| Contrôle réellement exécuté | Résultat et portée |
|---|---|
| npm ci | Réussi dans les deux jobs web et lors des builds Docker ; lockfile versionné |
| Audit npm | Zéro vulnérabilité signalée dans ces logs, état des avis à la date du contrôle |
| Lint, TypeScript strict, build Next.js | Réussis dans les deux jobs web ; strict=true relu dans tsconfig |
| Tests unitaires/DOM | Sept réussites dans chaque exécution |
| Playwright | 22 réussites, deux exclusions, zéro échec et zéro instabilité dans l’artefact relu |
| Trois moteurs | Chromium, Firefox, WebKit Linux ; accueil/catalogue à 375/768/1440, axe, clavier, dialogue, onglets, thèmes, mouvement réduit et erreurs JavaScript dans les parcours couverts |
| Zoom réel | Chromium : facteur 2, largeur CSS 1440 → 720 ; Firefox/WebKit explicitement exclus de ce scénario |
| Docker | Build npm ci/Next, démarrage du conteneur et contrôles HTTP accueil/catalogue/manifest/icône réussis dans les deux jobs ; aucun Docker local revendiqué |
| API | Jobs check/test réussis ; aucun changement métier API dans ce lot |
| Assets et contrastes | Script local réexécuté pendant cet audit : 44 PNG/ICO identiques à l’archive officielle, 13 paires conformes aux seuils calculés, zéro référence active aux SVG approximatifs |
| Recherche de secrets | Fichiers suivis de moins de 2 Mo parcourus : aucune correspondance aux motifs clés privées, jetons GitHub, clés AWS et affectations sensibles longues ; contrôle indicatif, pas un audit exhaustif de sécurité |

L’archive navigateur du run PR a été téléchargée et son SHA-256 vérifié : `356c5b03b75be36b8c53ed64914ccf2cb9abb125fbc5e49fc9793f442d3bb109`, artefact `12557274034`. Les [preuves et hashes des captures](evidence/consolidation-pr1.json) fixent leur source. Les dépendances et licences sont décrites dans [DEPENDENCIES.md](DEPENDENCIES.md) ; aucune nouvelle dépendance n’est introduite par cette revue documentaire.

## Inspection visuelle effectuée

Six captures de ce même artefact ont été ouvertes et inspectées : accueil et catalogue sous [Chromium mobile 375](images/consolidation/accueil-chromium-375.png), [catalogue mobile](images/consolidation/catalogue-chromium-375.png), [Firefox tablette 768](images/consolidation/accueil-firefox-768.png), [catalogue tablette](images/consolidation/catalogue-firefox-768.png), [WebKit desktop 1440](images/consolidation/accueil-webkit-1440.png) et [catalogue desktop](images/consolidation/catalogue-webkit-1440.png). Dans ces vues, pas de chevauchement ou de coupe manifeste des textes et commandes ; cartes et colonnes se replient, logos officiels et hiérarchie typographique sont cohérents. L’outline après fermeture du dialogue apparaît sur les captures concernées.

Cette inspection ne couvre pas chaque combinaison de thème/état ni les appareils physiques. Le zoom est vérifié par mesures et axe ; aucune nouvelle validation visuelle exhaustive du zoom n’est revendiquée. Les nouveaux formats 320/390/1024/1920 demandés pour l’accueil Frontend 02 seront testés dans ce lot ultérieur.

## Limites acceptées dans le périmètre technique proposé

- Figma : défauts natifs connus, synchronisation et Code Connect différés dans le [backlog](FIGMA_SYNC_BACKLOG.md), sans nouvel ID ni prétention de complétude.
- PWA : manifest, ressources et dimensions vérifiés ; zéro service worker, mode hors ligne non implémenté, installation réelle Android/iOS non testée. Aucune promesse de PWA complète.
- Accessibilité : axe et parcours clavier couverts ne remplacent pas une recette humaine, lecteur d’écran ou cognitive. WebKit Linux ne valide pas Safari sur macOS/iOS.
- L’accueil actuel est une vitrine de fondations. Il ne constitue pas la page immersive Frontend 02 et n’annonce aucun service d’entraînement opérationnel.
- Docker : validation CI de développement, sans durcissement de production revendiqué. Aucun déploiement réalisé.

## Consolidation et autorisation attendue

La [simulation d’intégration](CONSOLIDATION_PR_01_02.md) identifie deux conflits futurs avec la PR #2 : ci.yml et .gitignore. Ils ne bloquent pas la PR #1 seule ; ils doivent être résolus puis testés après son intégration autorisée. Les branches permanentes restent inchangées.

La mise à jour de cette PR ajoute la décision Code-First, ce rapport et les preuves. Son SHA documentaire final et ses nouveaux contrôles sont indiqués dans la description GitHub afin de ne pas attribuer les résultats d’un ancien commit à un autre SHA.

**Point A en attente : autorisation explicite de Jonathan Kakesa pour fusionner uniquement la PR #1 vers dev.** La PR #2 devra ensuite obtenir sa propre validation et sa propre autorisation.
