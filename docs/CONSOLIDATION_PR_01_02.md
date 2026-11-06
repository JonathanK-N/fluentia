# Consolidation des PR #1 et #2

Responsable : Jonathan Kakesa. 24 octobre 2026.

## Consolidation terminée après le point B

Les deux autorisations explicites ont été obtenues successivement. La PR #2 est fusionnée vers dev au commit `2e1ed545540e8ea5fb0c540475ce7e146fcf315f`, contenu identique à son HEAD approuvé `1100a99382f23842a3e5faa76da9c77c842771de`. La CI du dev [40120241790](https://github.com/JonathanK-N/fluentia/actions/runs/40120241790) est réussie. La branche Frontend 02 a été créée depuis ce dev consolidé et validé. Les sections suivantes conservent l’audit et les états intermédiaires. Aucun changement de tests/main ni déploiement Production.

## État après autorisation du point A

Jonathan Kakesa a autorisé la fusion de la PR #1. Fusion GitHub effectuée vers dev au commit `62f6ff43dcd0e03e006849e317b20a4c4795adfc`, depuis le HEAD approuvé `826f08d198b6ba9d861e5eeb01851300d22e6650`. Aucun squash, rebase, force push ou suppression de branche.

Sur `design/ux-ui-02`, une fusion ordinaire de ce dev a produit `32ed8a5b8cdc40acf985596232a5c0b66c733e66`. Les deux conflits prévus ont été résolus : ci.yml garde tous les contrôles frontend/API/Docker de la PR #1 ; .gitignore réunit les exclusions des deux lots. Le workflow UX/UI autonome est conservé. Les dossiers apps/ et ci.yml sont identiques à dev ; les références UX/UI ne remplacent pas le frontend React. README conserve les deux guides et indique la stratégie Code-First approuvée.

Le [rapport de validation PR #2](VALIDATION_PR_02.md) documente les exécutions sur l’ensemble intégré. La PR #2 reste non fusionnée, en attente de sa propre autorisation au point B. tests et main sont inchangés. L’audit initial ci-dessous reste conservé avec ses références historiques.

## Références relues

| Référence | SHA observé | État |
|---|---|---|
| dev, tests, main | `6fe83c281d9b2d94499a0208f8bd4ef3251edc5a` | Branches permanentes inchangées |
| [PR #1](https://github.com/JonathanK-N/fluentia/pull/1) | `82c5a0ecff25bc81cdf0366a274024d578fbf7a5` | Ouverte, brouillon, base dev |
| [PR #2](https://github.com/JonathanK-N/fluentia/pull/2) | `dc151f766cc5498e64efe9591f736ea69db8c232` | Ouverte, brouillon, base dev |

Ce sont les références de l’audit initial ; une mise à jour documentaire ultérieure de la PR #1 a son propre SHA et ses propres contrôles, indiqués dans sa description. Les deux PR ont le même ancêtre dev. La PR #2 ne contient pas le frontend de la PR #1 : sa CI web verte sur le socle initial ne valide pas le frontend consolidé.

## Périmètres et chevauchements

Différences avec dev au moment de l’audit : 144 fichiers dans la PR #1, 70 dans la PR #2. Trois chemins communs : `.github/workflows/ci.yml`, `.gitignore`, `README.md`. Les composants React et assets de la PR #1 sont séparés des références autonomes `design/ux-ui-02/` et documents de la PR #2.

Une simulation **sans modifier les branches ni l’index**, `git merge-tree --write-tree origin/frontend/mission-01 origin/design/ux-ui-02`, retourne des conflits de contenu sur **ci.yml et .gitignore**. README se combine automatiquement à ces références ; son sens et ses liens devront néanmoins être relus. La simulation écrit seulement un objet Git inaccessible aux branches ; elle n’est pas une intégration ni une validation du résultat résolu.

## Résolution prévue après le point A

| Chemin | Règle de conservation |
|---|---|
| `.github/workflows/ci.yml` | Garder npm ci, cache/lockfile, audit, lint, typecheck, DOM, build, trois moteurs et artefacts de la PR #1 ; conserver le job Docker et `DJANGO_DEBUG=1` limité aux tests API. Ne pas revenir à npm install et à une simple compilation. |
| `.github/workflows/ux-ui-02.yml` | Conserver le workflow autonome de la PR #2 et ses dépendances verrouillées, audit, vérification Python, trois moteurs et artefacts. |
| `.gitignore` | Réunir exclusions frontend et prototype, y compris les deux test-results/playwright-report et les tsbuildinfo ; préserver l’exception `.env.example`. |
| `README.md` | Conserver les guides React et UX/UI, mettre les statuts en accord avec ADR 002, vérifier les liens. |

Ne pas remplacer un fichier en conflit par une version entière sans comparaison. Fusion ordinaire de dev dans `design/ux-ui-02`, sans réécriture ni force push, uniquement après intégration autorisée de la PR #1. Réexécuter les deux suites et Docker sur le résultat intégré.

## Contrôles de la PR #2 relus

Sur `dc151f766cc5498e64efe9591f736ea69db8c232`, [UX/UI PR 40107493479](https://github.com/JonathanK-N/fluentia/actions/runs/40107493479) et [push 40107488970](https://github.com/JonathanK-N/fluentia/actions/runs/40107488970) sont réussis, ainsi que [qualité PR 40107493483](https://github.com/JonathanK-N/fluentia/actions/runs/40107493483) et [push 40107488937](https://github.com/JonathanK-N/fluentia/actions/runs/40107488937). Les recettes UX/UI comptent chacune 58 réussites et deux exclusions de zoom, avec 558 combinaisons écran/largeur/moteur. Ces résultats restent ceux du prototype autonome, sans backend réel.

Le [rapport UX/UI](https://github.com/JonathanK-N/fluentia/blob/dc151f766cc5498e64efe9591f736ea69db8c232/docs/ux-ui-02/REPORT.md) garde sa valeur historique : références légales et éditeurs partiels, synchronisation native absente, capture zoom partielle, recette humaine non effectuée. Le dépassement local Windows n’est pas un succès. L’ADR 002 lève seulement le blocage de progression dû au quota Figma.

## État au terme de l’audit initial, avant autorisation

**dev non consolidé.** Rapport technique de la PR #1 disponible dans [VALIDATION_PR_01.md](VALIDATION_PR_01.md). L’intégration et la validation combinée de la PR #2 ne sont pas exécutées avant le point A. La branche `frontend/mission-02-landing` et l’accueil Frontend 02 ne sont pas créés. Le second rapport de validation et les livrables d’accueil restent à produire après les étapes autorisées.
