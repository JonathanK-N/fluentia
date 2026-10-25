# Rapport de validation — backend lot 01

Responsable : Jonathan Kakesa.

## Décision proposée

**GO technique pour la revue d’intégration du moteur backend vers dev, sous réserve des contrôles du HEAD livré et de l’accord explicite du propriétaire. NO-GO production et plateforme complète.** Aucune fusion, promotion de branche ou production n’est effectuée par ce rapport.

## Périmètre et Git

Intégration dans un worktree distinct, branche `backend/lot-01-examens`, base dev `2e1ed545540e8ea5fb0c540475ce7e146fcf315f`. [PR #4 en brouillon vers dev](https://github.com/JonathanK-N/fluentia/pull/4).

La PR #3 conserve le HEAD frontend `1d4ffbcfaa0ba7228c0951f32932eb7bf55269b7`. Aucun fichier de `apps/web` ou `design/ux-ui-02` n’est changé par ce lot. dev reste à sa base ; tests/main restent à `6fe83c281d9b2d94499a0208f8bd4ef3251edc5a`. Les identités Git configurées et les attributions du pack sont conservées.

| Checkpoint | Preuve et portée |
|---|---|
| Intégration initiale `57cb0fa594ab2f8f712bc49e8d76e41a5dd2d145` | CI [40155952902](https://github.com/JonathanK-N/fluentia/actions/runs/40155952902) : PostgreSQL réussi, repli SQLite vide à corriger |
| Sécurité corrigée `f137c09ad419e9169679b433a06ea64487efddbc` | CI [40156156208](https://github.com/JonathanK-N/fluentia/actions/runs/40156156208) : tous les jobs réussis, dont conteneurs et frontend |
| Réversibilité `8bc5b35919eab0c46594f82e1a3edfa467c7cd45` | [40156383633](https://github.com/JonathanK-N/fluentia/actions/runs/40156383633) et [40156380636](https://github.com/JonathanK-N/fluentia/actions/runs/40156380636) réussies, retrait/réinstallation des triggers compris |
| Recette étendue `c79ca87372f36a35d68fccfc8ce0f0a7ad4b685b` | [40156536525](https://github.com/JonathanK-N/fluentia/actions/runs/40156536525), [40156533464](https://github.com/JonathanK-N/fluentia/actions/runs/40156533464) : 40 tests PostgreSQL, 35 exécutés sur SQLite et cinq exclusions PostgreSQL |

Ces SHA désignent les sources mesurées ; le commit ajoutant le rapport ne remplace pas leur provenance. Le HEAD livré et ses derniers contrôles sont indiqués dans la PR. Le formatage ultérieur de treize fichiers Python a été vérifié sans changement d’AST : [preuve](format-review.json).

## Fonctions livrées

Catalogue public limité aux versions publiées, passation privée authentifiée, choix sauvegardés pour reprise, soumission idempotente, correction déterministe et résultats privés après soumission. L’expiration est persistée avant de retourner une erreur et peut être constatée par lecture. Un retard dans la validation/correction ne prolonge pas le délai. Les requêtes concurrentes sont sérialisées autour de la tentative ; la publication est également protégée contre les mutations concurrentes de contenu.

Les cinq modèles et leurs contraintes sont décrits dans [le guide d’intégration](README.md). Deux migrations versionnées : `0001_initial` (tables, index, unicité, durées, statuts et scores cohérents), `0002_integrity_guards` (onze triggers SQLite/PostgreSQL, publication, gel des versions, relations des réponses et fonctions PostgreSQL réversibles). Le seed idempotent garde les trois textes d’origine en brouillon, sans attribuer de validation humaine ou d’auteur/relecteur fictif.

Publication : quatre choix, exactement un correct, relecture datée par une personne distincte de l’auteur, texte/explication et provenance des médias nécessaires. Une simulation de lecture de 39 questions et 3600 s est acceptée dans les tests ; les entraînements courts sont identifiés séparément. Aucun résultat n’est une attestation, un score TCF ou une conversion NCLC.

## API et fichiers

Les sept endpoints, corps de requête et accès sont documentés dans [README.md](README.md#api-et-accès) ; schéma [OpenAPI validé](openapi.yaml). Health, Swagger et administration existants sont conservés. L’administration des tentatives/réponses est en lecture seule, même pour un superutilisateur.

Fichiers principaux : `apps/api/exams/` (modèles, services, API, schémas, administration, seed, migrations et trois fichiers de tests), `config/settings.py` (activation et repli SQLite), `config/urls.py` (montage API), `health/views.py` (schéma explicite du diagnostic), `requirements.txt` (versions corrigées), workflow CI (matrice SQLite/PostgreSQL, migrations réversibles, audit et conteneur backend). Documentation et preuves : ce dossier, README racine et docs/API.md.

L’archive de 14 fichiers a été extraite sans écrasement ni chemin sortant du worktree. ZIP SHA-256 `34a9d5254cf2c0fc27c76016819c4fb98703e2a883bcca2a75b03eea9572528a`. [Inventaire](archive.json) et [guides reçus intacts](sources/INTEGRATION.md).

## Tests effectivement exécutés

| Contrôle | Résultat / limite |
|---|---|
| SQLite Windows, Python 3.12.14 | 40 découverts, **35 exécutés et réussis**, cinq courses PostgreSQL exclues ; aucun test supprimé |
| PostgreSQL 16 en CI | **40 réussis**, y compris cinq tests sur connexions distinctes |
| Courses | Double soumission, sauvegarde/soumission, double sauvegarde, expiration pendant attente d’un verrou et publication face à une mutation de choix |
| Délais | Égalité à l’échéance refusée, juste avant acceptée, recontrôle après validation/correction, expiration enregistrée, idempotence après échéance ultérieure |
| Confidentialité / accès | Anonyme refusé, tentative étrangère/inexistante 404 sur les quatre routes privées, aucun corrigé avant soumission, résultats 409 avant soumission, refus des UUID/champs invalides |
| Session / CSRF | Connexion Django de test réelle, écriture sans CSRF refusée, avec jeton acceptée ; inscription/connexion frontend non implémentées |
| Données | Contenus publiés non modifiables par instance, update SQL, insertion groupée ou suppression ; refus des incohérences réponse/question/examen et des scores/durées invalides |
| Publication | Refus sans relecture, sans bonne réponse, sans quatrième choix, sans audio autorisé ou avec simulation incomplète ; simulation de lecture conforme acceptée |
| Migrations | Application et absence de migration oubliée ; retrait/réinstallation de 0002 sur SQLite et PostgreSQL CI ; trois questions et onze triggers conservés sur la base SQLite dédiée locale |
| Seed | Double exécution sans doublon, brouillons non publiés et aucune relecture inventée |
| OpenAPI / Django | Contrôle système et schéma strict sans erreur ni avertissement ; annotations explicites de health et des API |
| Dépendances | Django 5.2.18, DRF 3.18.3 ; audit des dépendances applicatives sans vulnérabilité connue au moment de l’exécution |
| Conteneur backend | Build Linux, démarrage Gunicorn avec DEBUG de test, migrations et seed ; health 200 et catalogue vide après insertion des brouillons. Aucun build Docker Windows local revendiqué |
| Frontend du dev | Recette conservée : 7 tests de composants et 22 navigateur réussis, deux exclusions de zoom ; build/lint/TypeScript et conteneur frontend réussis, notamment au checkpoint c79ca87 |

Les chiffres de non-régression frontend concernent **le dev de base**, pas les 61 tests des pilotes non fusionnés de la PR #3. Leurs sources ne sont pas mélangées.

## Preuves concrètes et cycles

[api-proof.json](api-proof.json) rejoue dix requêtes dans les handlers REST avec session/CSRF et une base SQLite persistante dédiée de vérification : 200 catalogue, 201 tentative, 409 résultats anticipés, 200 sauvegarde/reprise/soumission répétée/résultats, puis 400 pour expiration et état `expired` relu en base. Ce jeu est synthétique, sans compte produit, validation humaine, cookie, mot de passe ou jeton exposé ; ce n’est pas un serveur réseau ou une interface d’examen React.

Autres preuves : [synthèse CI du checkpoint](ci-summary.json), [audit des dépendances](dependency-audit.json), [cycle des migrations](migration-review.json), [contrôle de déploiement](deploy-check.txt), [revue indicative des sources](source-review.json). Le schéma et les traces API constituent les preuves pertinentes de cette intégration backend ; aucun écran étudiant n’est ajouté dans ce lot.

Anomalies corrigées durant les cycles : fixture d’expiration incohérente avec une fenêtre positive (début reculé sans retirer le test), schéma health absent, erreur 500 sur champ de sauvegarde inconnu (désormais 400), variable DATABASE_URL vide empêchant SQLite, et cinq vulnérabilités de DRF 3.16.1. Les [notes officielles DRF](https://www.django-rest-framework.org/community/release-notes/) ont été consultées avant passage à 3.18.3. Les défauts de l’overlay sur rollback, stabilité des versions et soumission concurrente sont couverts par les tests ajoutés.

## Sécurité et intégrations restantes

Le contrôle `check --deploy` a été exécuté hors DEBUG avec une clé forte éphémère non conservée : avertissement `security.W004` (politique HSTS à définir). Les cookies sécurisés, la redirection SSL et le refus de la clé de secours restent en place ; cela ne valide ni le TLS réel, ni un reverse proxy, ni une production. Aucun changement d’infrastructure n’est effectué.

La limitation DRF 30 démarrages/h et 120 écritures/min par utilisateur est testée ; elle nécessite un cache partagé et une protection en frontal pour une politique distribuée. Pas d’audit de pénétration, test de charge, audit exhaustif de secrets ou recette de production revendiqué. Les credentials de la base CI sont uniquement des valeurs éphémères de test. Politique de rétention/effacement et séparation des rôles runtime/migrations restent à arrêter avant production.

Les trois textes restent à relire par des personnes qualifiées. Les contenus média ne sont pas livrés ; l’oral, l’expression, les IA, les e-mails, Stripe, les rôles multi-tenant et la PWA complète restent ultérieurs. Aucun service payant ou message à un tiers n’est activé. Le lot 01 **ne constitue pas la plateforme Fluentia complète**, ni un parcours étudiant React de bout en bout.

## Suite après décision

1. Revue du lot et autorisation distincte avant fusion de la PR #4 vers dev ; coordination avec la PR #3, sans fusion automatique.
2. Après intégration autorisée, préparer la promotion vers tests et le lot 02 depuis le nouveau dev.
3. Réaliser authentification/CSRF, profils et première lecture réelle, selon [PREPARATION_LOT_02.md](PREPARATION_LOT_02.md) et [la feuille de route fournie](sources/ROADMAP_BACKEND.md).
4. Validation pédagogique, médias autorisés, IA calibrées et services externes testés par lots, puis recette de charge/sécurité/accessibilité avant tout GO production distinct.
