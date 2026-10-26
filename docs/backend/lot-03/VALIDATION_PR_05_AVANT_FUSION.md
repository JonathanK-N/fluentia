# Lot 03 — Phase 1 : validation de la PR #5

> Archive de l’audit initial, rédigé avant autorisation. La PR #5 a ensuite été fusionnée après le « go » explicite du responsable, au commit `cb3e3ec62c5e4673b9b6a64d3ae7e3c5e2dbcf03`. Le rapport d’origine, alors séparé du dépôt, est conservé ci-dessous pour sa traçabilité ; ses mentions d’attente de fusion décrivent cet état historique.

Responsable : Jonathan Kakesa. Audit du 25 octobre 2026.

## Décision

**GO technique pour fusionner la PR #5 seule vers dev, sous autorisation explicite de Jonathan Kakesa.** Aucun défaut bloquant supplémentaire identifié pendant cet audit du périmètre Lot 02.

**NO-GO pour intégrer ensemble les PR #3 et #5 sans rapprochement supplémentaire. NO-GO production.** Deux conflits documentaires et une navigation d’accueil devenue obsolète doivent être traités avant une intégration commune. Les tests des branches séparées ne prouvent pas le fonctionnement de leur combinaison.

Ce rapport est un livrable d’audit séparé du dépôt : il ne modifie pas le SHA examiné. Aucune fusion réelle, création de branche Lot 03, modification de la PR #3 ou implémentation des phases suivantes n’a été effectuée. Le dépôt de travail est propre après les vérifications.

## Références exactes

| Élément | Référence |
|---|---|
| PR #5 | [Comptes et première lecture connectée](https://github.com/JonathanK-N/fluentia/pull/5), ouverte en brouillon vers dev, sans fusion automatique |
| HEAD #5 audité | `6e9153a3c9cced50b048155d3bfda5a5ad24143b` |
| Base dev | `3b0a1124d6543640a52a2a45c8139afa97104b90` |
| PR #3 | [Travaux frontend Human-Centered](https://github.com/JonathanK-N/fluentia/pull/3), ouverte en brouillon, préservée |
| HEAD #3 comparé | `1d4ffbcfaa0ba7228c0951f32932eb7bf55269b7` |
| CI push #5 | [40216022126](https://github.com/JonathanK-N/fluentia/actions/runs/40216022126), réussie au HEAD #5 ci-dessus |
| CI PR #5 | [40216026484](https://github.com/JonathanK-N/fluentia/actions/runs/40216026484), réussie au même HEAD |

Les deux exécutions comportent six jobs réussis : web, API SQLite, API PostgreSQL, conteneur API, conteneur frontend, parcours étudiant PostgreSQL. Le SHA applicatif antérieur `80b11e8` présent dans le rapport historique du Lot 02 n’est pas confondu avec le HEAD livré `6e9153a` : les dernières CI du HEAD ont été relues directement.

## Tests et migrations effectivement vérifiés

| Vérification | Résultat et preuve |
|---|---|
| Nouvelle exécution SQLite Windows | `manage.py test accounts exams health --noinput` : 60 découverts, 53 réussis, sept exclusions PostgreSQL, 17,368 secondes |
| Nouvelle vérification Django | `check` : aucun problème ; `makemigrations --check --dry-run` : aucun changement détecté |
| Nouvelle validation OpenAPI | `spectacular --validate --fail-on-warn` terminé avec succès ; [schéma versionné du HEAD](https://github.com/JonathanK-N/fluentia/blob/6e9153a3c9cced50b048155d3bfda5a5ad24143b/docs/backend/lot-02/openapi.yaml) |
| PostgreSQL 16, CI du HEAD | 60 tests réussis sans exclusion, [job 121237204172](https://github.com/JonathanK-N/fluentia/actions/runs/40216022126/job/121237204172) |
| SQLite, CI du HEAD | 53 réussis et sept exclusions, [job 121237204892](https://github.com/JonathanK-N/fluentia/actions/runs/40216022126/job/121237204892) |
| Migrations des comptes | Application de `0001`, `0002`, `0003`, retour à `0001`, puis réapplication jusqu’à `0003` : réussis sur les deux bases CI jetables |
| Migrations examens | Garde-fous du Lot 01 conservés ; retour arrière/réapplication contrôlés par la CI et tests métier conservés |
| Frontend du HEAD | Sept tests de composants et 22 navigateur réussis, deux exclusions historiques de zoom ; lint, TypeScript et build réussis, [job web](https://github.com/JonathanK-N/fluentia/actions/runs/40216022126/job/121237204228) |
| Parcours React/API/PostgreSQL | Trois parcours réussis : Chromium, Firefox et WebKit mobile, [job 121237204199](https://github.com/JonathanK-N/fluentia/actions/runs/40216022126/job/121237204199) |
| Docker | Deux jobs de construction/démarrage réussis en CI ; aucun Docker Windows local revendiqué |

Les résultats PostgreSQL, Docker et navigateur ci-dessus proviennent des derniers contrôles GitHub existants du SHA audité. Ils n’ont pas été réexécutés localement ni sur une combinaison #3+#5 lors de cette phase. Les sept exclusions SQLite sont les cinq scénarios concurrents du moteur et les deux scénarios concurrents des comptes ; aucun test n’est supprimé.

La migration `accounts.0002` protège les courriels non vides avec un index unique sur `LOWER(email)`, après la dernière migration auth actuelle. Elle ne fusionne ni ne supprime les comptes existants : des doublons préexistants imposent une résolution revue par le responsable. Le retour arrière de `0003` retire les colonnes de liaison à l’adresse ; les comptes subsistent mais une nouvelle vérification est nécessaire après réapplication. Toute reconstruction future de `auth_user` devra préserver l’index.

## Sécurité et contrat du Lot 02

Revue du code et des tests : session Django avec rotation à la connexion et invalidation à la déconnexion, cookies HttpOnly/SameSite et Secure hors DEBUG, CSRF sur les mutations anonymes et authentifiées, origine frontend explicitement configurée, profil limité au compte connecté et rôles non modifiables par le client.

Les jetons e-mail sont aléatoires, stockés sous empreinte, expirants, à usage unique et liés à l’adresse destinataire. Une modification du courriel ne conserve pas son statut vérifié. Les tests PostgreSQL vérifient l’usage concurrent d’un même lien et la création concurrente avec une même adresse à la casse près.

Le démarrage d’un exercice exige un courriel vérifié. Liste des tentatives, sauvegarde, soumission et résultats restent limités au propriétaire ; les accès étrangers retournent 404. Aucun corrigé avant soumission. Expiration persistée, correction déterministe et soumission idempotente conservées, y compris les scénarios concurrents du moteur. Le serveur reste l’autorité sur le délai.

Le parcours navigateur existant vérifie une inscription réelle dans l’API, la lecture d’un courriel local, la vérification, la connexion, le profil, la sauvegarde interrompue puis réessayée au clavier, la reprise après rechargement, l’isolation d’un second compte authentifié, les résultats et la déconnexion. Il utilise une fixture pédagogique explicitement synthétique. Il ne valide ni la délivrabilité SMTP réelle ni la qualité pédagogique des questions.

## Compatibilité avec la PR #3

Comparaison des deux HEAD et simulation par `git merge-tree --write-tree` : arbre de comparaison `16723d76b212df5d6fae69ada04b00b98d903caf`. Cette commande produit une analyse dans les objets Git, sans fusion de branche ni modification de l’index ou des fichiers de travail.

1. **Conflits textuels :** `README.md` et `docs/README.md`. Il faudra conserver les historiques frontend et backend et les statuts actuels des PR. Les fichiers applicatifs et le workflow se combinent textuellement sans conflit signalé.
2. **Backend et dépendances :** #3 ne modifie pas le backend Django. Les manifests et lockfiles npm des deux branches sont identiques. Les routes d’aperçu `/apercu/etudiant` de #3 et les routes réelles `/etudiant` de #5 sont distinctes. Le composant Button reste compatible avec ses usages Lot 02. Aucun changement de migration concurrent dans #3 identifié.
3. **Navigation fonctionnelle à rapprocher :** dans #3, le Header rend `LandingNavigation` sur `/`. Cette navigation pointe encore Connexion/Inscription vers `#disponibilite` et indique que la connexion n’est pas ouverte. Le lien « Espace étudiant » ajouté par #5 est conservé dans le Header commun de l’arbre simulé, mais ce Header commun est contourné sur l’accueil. Après intégration commune, les entrées d’accueil devront mener au compte et au catalogue réels, avec textes et tests mis à jour.
4. **Aperçu et expérience réelle :** le dashboard #3 reste explicitement une démonstration avec données fictives et ne devient pas connecté par simple fusion. Son ergonomie et ses tokens sont réutilisables, mais sa connexion aux API nécessite une intégration dédiée. Les styles partagés, thèmes, composants, footer et navigation doivent être revérifiés sur le parcours réel.
5. **Limite de la vérification :** aucun build, audit visuel ou test navigateur du mélange #3+#5 n’a été exécuté. La simulation Git ne prouve pas l’absence de régression CSS, de navigation ou de tests. Il faudra exécuter les suites Human-Centered et le parcours PostgreSQL ensemble dans une intégration autorisée ; ne pas attribuer les 22 tests du dev aux tests spécifiques de #3.

Ces points ne bloquent pas la fusion de #5 seule dans son dev actuel. Ils empêchent d’annoncer une intégration commune ou une harmonisation complète Human-Centered comme déjà validée. La PR #3 ne doit pas être fusionnée implicitement lors de l’autorisation de #5.

## Limites restantes et préparation du Lot 03

Le courrier est en mémoire par défaut ou dans un dossier privé de recette ; aucun fournisseur externe ou service payant activé. Reprise fiable des envois, récupération du mot de passe, changement autonome d’adresse et délivrabilité restent à traiter. HSTS/TLS/proxy, protection distribuée, conservation/effacement, audit de charge et de pénétration restent des prérequis de production. Le zoom navigateur 200 % du nouveau parcours n’est pas revendiqué.

La banque contient des brouillons et des exemples non validés humainement. Les contrôles auteur/relecteur et le gel des publications existants sont un socle, pas un système complet d’import/export, d’historique éditorial et de médias. Le champ privé `audio_key` et les contraintes de simulation présents dans les modèles ne constituent pas un lecteur audio, une distribution sécurisée ni une banque orale opérationnelle. La conformité aux contraintes officielles devra être revalidée sur les sources officielles pendant la spécification du Lot 03.

Après autorisation et fusion de #5 uniquement : partir du nouveau dev, créer une branche temporaire descriptive sans nom d’outil, puis spécifier les transitions éditoriales, provenance, validation humaine, versions et historique ; développer import/export et administration ; intégrer les médias privés et la compréhension orale ; compléter simulations et analyses ; raccorder les interfaces sobres au Design System Human-Centered sans écraser #3. Les contenus créés resteront des brouillons tant qu’un véritable relecteur ne les aura pas validés.

La décision attendue porte uniquement sur la fusion de [#5](https://github.com/JonathanK-N/fluentia/pull/5) vers dev et le démarrage du Lot 03 depuis ce nouveau dev. Aucune autorisation de fusion de #3, de promotion vers tests/main, de service payant ou de déploiement production n’en découle.
