# Rapport de mission UX/UI 02 — NO-GO pour livraison complète

Responsable : Jonathan Kakesa. 24 octobre 2026. Branche `design/ux-ui-02`, issue de dev `6fe83c281d9b2d94499a0208f8bd4ef3251edc5a`. [PR #2](https://github.com/JonathanK-N/fluentia/pull/2) en brouillon ; PR #1 non écrasée et non fusionnée.

**Statut historique ci-dessous :** ce rapport concerne la livraison UX/UI avant la mission Frontend 02. Depuis, la stratégie [Code-First](../DECISIONS/002-code-first-et-consolidation.md) a été explicitement approuvée et la PR #1 fusionnée vers dev avec autorisation au commit `62f6ff43dcd0e03e006849e317b20a4c4795adfc`. Ce dev est intégré dans la branche de la PR #2. Le [rapport du point B](../VALIDATION_PR_02.md) donne le statut technique actuel et les nouveaux SHA/tests. Le NO-GO de conception native complète et les limites ci-dessous restent vrais ; le quota Figma seul n’empêche plus l’avancement technique autorisé.

## État initial et état final

La PR #1 reste sur `82c5a0ecff25bc81cdf0366a274024d578fbf7a5`, avec ses derniers runs réussis et un NO-GO Figma. Les branches permanentes ont été relues. La lecture Figma actuelle a été tentée puis refusée pour quota Starter ; le contrôle de compte retourne un siège View. L’édition effective n’a donc pas pu être confirmée. [Audit détaillé](AUDIT.md).

Le repli demandé est réalisé sous forme de références HTML/CSS/JS locales : catalogue de 62 écrans, huit parcours, trois univers, états communs, formulaires de démonstration, dialogues, QCM, rédaction temporaire, gestion d’abonnement simulée, devoir fictif, validation de contenu fictive et sept états de sphère. Aucun compte, paiement, capture audio, IA ou résultat officiel réel.

Les spécifications françaises couvrent inventaire, fondations v2, pages 00–13, écrans, variantes, interactions, motion, accessibilité, matrice Figma/React et backlog. Les trois PNG sont issus du pack officiel et leurs hashes sont contrôlés ; les quatre graisses Poppins sont locales et la licence OFL est conservée.

## Livrables réalisés, partiels et bloqués

| Domaine | État exact |
|---|---|
| Audit GitHub, PR, code, tokens, rapports | Réalisé ; références et différences avec dev documentées |
| Design System v2 | Proposition locale ; rayons et dimensions à arbitrer, bibliothèque native non créée |
| 62 écrans | Fiches et références locales créées ; structures légales et certaines listes/éditeurs professionnels partiels |
| Huit parcours | Simulations locales préparées et soumises aux tests ; résultats ci-dessous |
| Voice | Sept états graphiques/textuels ; transitions locales, aucune capture audio réelle |
| Motion | Storyboards et étude des options ; pas d’animation immersive complète ni scène 3D |
| Mapping | 14 familles React héritées et 15 propositions métier ; aucun nouvel export React métier |
| Figma natif | Bloqué : aucun nouvel ID de nœud, aucune page ni maquette enregistrée dans cette mission |
| Corrections héritées PR #1 | Non appliquées au canevas, quota atteint |
| Code Connect | Non configuré ; indisponibilité du forfait déjà constatée dans la mission 01 |
| Accessibilité humaine | Lecteurs d’écran, appareils physiques et tests cognitifs non exécutés |

## Contrôles et cycles de correction

Le script Python exécuté valide 62 identifiants/routes uniques, huit parcours référencés, les trois hashes d’assets et seize paires de contraste. Les vérifications syntaxiques JavaScript ont été exécutées. Les dépendances de test sont verrouillées ; le prototype lui-même ne dépend d’aucun service ni package d’exécution externe.

Première recette locale Chromium : les huit parcours et les 62 écrans en 375/768 réussissent ; axe détecte le bandeau de revue hors des landmarks et un état de repli sans h1. Corrections appliquées : région nommée, titre dans les états de repli, lien d’évitement qui conserve la route et focus du studio maintenu sur les commandes.

La seconde recette locale obtient 11 réussites et un dépassement du délai de 180 s lors de l’audit axe des 62 écrans regroupés en un scénario. Ce dépassement n’est pas une réussite. Les audits ont été répartis par lot sans désactiver les règles axe. La revue des captures a aussi conduit à dégager l’eyebrow de l’outline du titre.

Le contrôle renforcé du thème confirme ensuite un défaut persistant sous WebKit lors du passage Learn → Voice : les panneaux peuvent conserver les tokens clairs. Le déplacement du thème vers html seul ne suffit pas. Le défaut a été reproduit avec WebKit 27.2 installé localement : la racine indique #102944 mais les descendants conservent #FFFFFF. Le correctif recalcule l’héritage sur le conteneur avant de remplacer son sous-arbre, uniquement lorsque l’univers change. La séquence Learn → Voice → Learn → Discover → Voice retrouve alors les couleurs attendues. Les règles axe et l’assertion explicite sur la surface restent actives ; le test attend également le titre du bon écran, les polices et deux frames avant mesure.

| Référence de cycle CI | Résultat avant correction finale |
|---|---|
| `d41589c91c86b0d7f89950542cc5b65e2f9c6196`, [40105139428](https://github.com/JonathanK-N/fluentia/actions/runs/40105139428) | 56 réussites, un échec de contraste WebKit sur S13 |
| `d7cb016fb23109c064946846df2766cb4b71d34e`, [40105512924](https://github.com/JonathanK-N/fluentia/actions/runs/40105512924) | 53 réussites, cinq échecs de surface WebKit, deux exclusions de zoom |
| `de534b24689af1024efd95fe798d7814eb26ad3e`, [40105923532](https://github.com/JonathanK-N/fluentia/actions/runs/40105923532) | Déplacement du thème seul insuffisant ; 53 réussites, cinq échecs, deux exclusions |

Le [diagnostic local WebKit](evidence/webkit-theme-diagnostic.json) conserve la séquence observée et sa portée ; il ne remplace pas la recette complète.

Une recette locale ciblée des 62 écrans aux trois tailles obtient trois scénarios réussis. Elle vérifie débordements et chevauchements de cartes ; ce résultat local n’est pas une recette complète des trois moteurs. [Résultat local](evidence/local-geometry-results.json), [structure et contrastes](evidence/structure.json).

## Recette CI exécutée sur le correctif

Référence de code : `99966b921857e2bae03da87f8f57dedffcc4933a`. Les deux exécutions UX/UI [40106734251](https://github.com/JonathanK-N/fluentia/actions/runs/40106734251) et [40106729481](https://github.com/JonathanK-N/fluentia/actions/runs/40106729481) réussissent : **58 scénarios réussis, deux exclus, aucun échec ni test instable**. Les deux contrôles du socle [40106734269](https://github.com/JonathanK-N/fluentia/actions/runs/40106734269) et [40106729428](https://github.com/JonathanK-N/fluentia/actions/runs/40106729428) réussissent aussi : typecheck/build web et check/test API.

| Contrôle exécuté | Résultat |
|---|---|
| npm ci du package de recette | Réussi depuis le lockfile, scripts d’installation désactivés |
| npm audit du package de recette | Zéro vulnérabilité signalée ; ce résultat ne constitue pas un audit de tout le produit |
| Syntaxe JavaScript et vérification Python | Réussies ; 62 écrans, huit parcours, trois hashes officiels, seize paires de contraste |
| Géométrie, trois tailles et trois moteurs | 558 combinaisons écran/largeur/moteur ; pas de débordement horizontal ni chevauchement de cartes détecté |
| Axe sur les écrans nominaux | 62 écrans par moteur à 1440 px, sans violation détectée |
| Parcours F01 à F08 | Réussis sur Chromium, Firefox et WebKit ; confirmations, erreurs et interruptions prévues par les tests |
| États de repli, composants, clavier, menu et mouvement réduit | Réussis dans les parcours automatisés ; ne remplacent pas une recette humaine exhaustive |
| Zoom navigateur Chromium | Facteur réel 2, largeur CSS 1440 → 720 ; parcours de contrôle sur les 62 références et axe sur P01/S01/S13 |
| Zoom Firefox/WebKit | Deux scénarios explicitement exclus, API d’extension Chromium non disponible |
| Figma natif | Aucun contrôle exécuté au-delà de la tentative refusée pour quota ; aucun nouveau nœud créé |

Les [preuves structurées](evidence/ci-validation.json), [résultats navigateur](evidence/ci-browser-results.json), [558 mesures](evidence/ci-geometry.json) et [mesures de zoom](evidence/ci-zoom.json) sont conservés. L’archive de l’artefact 12565081965 a été téléchargée et son SHA-256 vérifié : `01a921b91db515c8392df84d7980e96de27a64ae98146a083466a25e08853855`.

Le test de zoom livré attend également le titre du bon écran et deux frames avant chaque mesure. Le HEAD de livraison documentaire est distinct du SHA de ce checkpoint ; sa valeur et les contrôles ultérieurs figurent dans la description de la PR. Aucun document n’essaie de contenir son propre SHA.

## Captures et inspection

Treize captures locales sont inspectées : P01/S01/S13 à 375, 768 et 1440 px ; A01 à 375 ; T01/E01/M01 à 1440. Elles montrent la composition, les logos officiels et les commandes. Les captures après le correctif d’espacement confirment que l’outline du titre ne recouvre plus l’eyebrow. Elles précèdent le déplacement du thème vers html ; la correction WebKit nécessite une preuve CI séparée. [Registre et hashes](evidence/visual-and-figma-audit.json). Les autres écrans ne sont pas déclarés inspectés individuellement.

Les captures sont des références locales, jamais des preuves de maquettes enregistrées dans Figma. Les audits automatiques de géométrie ne remplacent pas la recette visuelle de chaque écran.

Après le correctif WebKit, les captures CI P01/S01/S13 à 1440 px et S13 à 375 px ont été inspectées : surfaces, textes, focus et disposition sont cohérents dans ces vues. [Voice desktop WebKit](images/webkit-S13-1440.png) · [Voice mobile WebKit](images/webkit-S13-375.png).

La capture full-page au zoom 200 % a aussi été inspectée, mais son export est partiel : elle ne couvre pas toute la largeur du rendu agrandi. Elle n’est **pas utilisée comme preuve de validation visuelle complète du zoom**. Le facteur de zoom, la largeur CSS et les mesures DOM sont vérifiés séparément. [Capture partielle identifiée](images/chromium-S13-zoom-200-capture-partielle.png).

## Limites et risques

Quota et permissions Figma empêchent la livraison centrale de cette mission. Les maquettes natives intégrales, leurs variantes et les huit parcours Figma n’existent pas comme nouveaux livrables. Les valeurs héritées de la mission 01 ne sont pas déclarées corrigées ou relues sur le canevas actuel.

Les écrans légaux ne sont pas des textes approuvés, les prix ne sont pas définis, les résultats sont fictifs et non convertibles en niveau TCF. Les éditeurs professionnels complets, conflits, isolation serveur et contrats audio restent à détailler et implémenter. Les risques sont repris dans [BACKLOG.md](BACKLOG.md).

## Décision

**NO-GO pour la livraison UX/UI complète et pour commencer Frontend 02.** Les références et spécifications locales sont proposées à la revue dans la PR #2. Un GO complet nécessite la correction et la conception natives Figma, leur inspection, les arbitrages de tokens et de contenus et une décision explicite de Jonathan Kakesa.

Aucune modification des pages ou du backend dans apps/, aucune fusion, aucun déploiement ni activation payante. Le seul ajustement de la CI existante limite DJANGO_DEBUG=1 au job de test, sans changer les paramètres de production. Aucun test Docker de la mission 01 n’est réattribué à ce prototype.
