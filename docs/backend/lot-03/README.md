# Lot 03 — Banque pédagogique, oral et examens complets

Responsable : Jonathan Kakesa. Branche `backend/lot-03-banque-oral`, PR [#6](https://github.com/JonathanK-N/fluentia/pull/6) en brouillon vers dev. Base : `cb3e3ec62c5e4673b9b6a64d3ae7e3c5e2dbcf03`, fusion de #5 après le « go » explicite du responsable. [Audit avant fusion](VALIDATION_PR_05_AVANT_FUSION.md) et [spécification](SPECIFICATION.md). Aucune fusion de #3, promotion vers tests/main ou production autorisée par cette documentation.

Livrables : [rapport GO/NO-GO](RAPPORT.md), [OpenAPI](openapi.yaml), [preuves CI](ci-summary.json), [captures et provenance](captures/provenance.json), [exemples originaux](exemples/banque-originale.json) et [audio français en brouillon](exemples/PROVENANCE_GENERATION.md).

## Séparation des contenus et des résultats

Le nouvel espace `pedagogy` prépare les contenus ; les modèles `exams` des lots précédents restent le moteur de passation. Aucune table historique d’examens, questions, réponses ou comptes n’est reconstruite par ce lot.

- `BankItem` : famille et version, révision technique, compétence, difficulté proposée, énoncé, texte ou média, quatre choix distincts, index correct, explication, origine, provenance, attribution réelle, responsable éditorial et relecteur.
- `EditorialEvent` : acteur réel ou non attribué pour un seed, date, action et instantanés avant/après. Les lignes sont immuables ; les écritures passent par les services pour enregistrer les changements.
- `MediaAsset` : UUID, titre, empreinte SHA-256, taille, durée, transcription, provenance et compte d’import. Le fichier est stocké hors des statiques et n’a aucune URL publique.
- `PublishedItem` : lien immuable entre la version éditoriale et la question figée d’un examen. Une nouvelle publication crée une nouvelle version d’examen, sans modifier les anciennes tentatives.
- `ListeningAccess` : tentative, question, instant de délivrance et fin minimale du document en simulation. Une unicité garantit une délivrance par question ; le verrou de la tentative sérialise les requêtes.
- `ExamSeries` : verrou partagé par slug, y compris entre deux comptes éditeurs. La contrainte d’unicité des versions d’examen demeure la garantie finale.

## Workflow de relecture

1. Un éditeur habilité crée ou importe un **brouillon**. Les difficultés `A1` à `C2` sont des propositions, pas des niveaux calibrés ; `non_calibree` est la valeur initiale.
2. L’éditeur demande une **révision**. Un support audio est obligatoire à ce stade pour l’oral. Le contenu ne peut plus être modifié pendant sa révision.
3. Un relecteur habilité, distinct du dernier responsable éditorial, approuve ou renvoie en brouillon avec une note. L’approbation exige une attestation explicite de relecture réelle du texte, des choix, du corrigé, du média éventuel et des droits. L’application impose deux comptes distincts et conserve l’attestation ; elle ne peut pas démontrer à elle seule l’identité ni le travail humain réel. Le responsable doit attribuer ces comptes à de vraies personnes.
4. Une version approuvée est **figée**. Un changement exige « Créer une nouvelle version » ; ni l’approbation ni le relecteur ne sont hérités.
5. Le rôle de publication assemble les items approuvés, dans l’ordre de sélection, dans une **nouvelle version d’examen**. Le premier assemblage marque les items `published` ; ce statut décrit une publication historique, pas la visibilité actuelle de chaque examen.

Les versions publiées peuvent être retirées du catalogue avec l’administration `Exam` existante et le droit correspondant. Leur contenu et leur date de publication ne sont pas dégelés. Les événements éditoriaux conservent les publications ; les changements de visibilité via Django Admin figurent dans son journal d’administration.

## Administration et droits

Interface React : `/edition`. Connexion dans `/etudiant/compte` avec un compte **réel**, actif et staff. Les droits doivent être attribués par le responsable via les groupes et permissions Django existants ; aucun compte staff/relecteur de production n’est créé automatiquement.

| Fonction | Droits nécessaires, en plus de staff actif et `pedagogy.view_bankitem` |
|---|---|
| Créer/importer/nouvelle version | `pedagogy.add_bankitem` |
| Modifier/demander une relecture | `pedagogy.change_bankitem` |
| Approuver/rejeter | `pedagogy.review_bankitem` |
| Assembler/publier | `pedagogy.publish_bankitem` |
| Importer un WAV | `pedagogy.add_mediaasset` |

`/edition` fournit formulaires complets, médias, sélection et assemblage, relecture, historique et import/export. Une révision technique évite d’écraser un changement concurrent : recharger après refus de version périmée. Django Admin propose recherche, filtres, consultation du journal et actions de demande de relecture/nouvelle version. Les médias, liens, accès et événements y sont en lecture seule. Un simple compte étudiant ou un staff sans les permissions ne peut pas consulter la banque ou les corrigés éditoriaux.

Les champs privés ne sont jamais une source de confiance côté navigateur. L’API utilise des listes explicites de champs ; le client ne choisit ni l’auteur d’une action ni un statut d’approbation à l’import. Les changements SQL directs de contenus approuvés, médias, liens de publication et événements sont bloqués par huit nouveaux triggers. Les onze garde-fous examens du Lot 01 sont conservés. Un administrateur de base capable de modifier le DDL reste une autorité de confiance ; les journaux ne sont pas une preuve cryptographique extérieure au système.

## API et formats

Préfixe `/api/v1/`. Banque et médias : authentification de session, CSRF sur toutes les mutations et permissions serveur. Obtenir `GET auth/csrf/` puis envoyer le cookie et `X-CSRFToken`, y compris pour le média binaire. Les réponses API v1 sont privées et non mises en cache. Les contrats exacts sont générés par `manage.py spectacular --validate --fail-on-warn`.

| Méthode / chemin | Usage |
|---|---|
| GET / POST `bank/` | Liste paginée filtrable par skill/difficulty/state ; création d’un brouillon |
| GET / PUT `bank/{uuid}/` | Consultation ou modification complète avec `revision` attendue |
| POST `bank/{uuid}/transition/` | `request_review`, `approve`, `reject`, avec révision et note ; attestation pour approbation |
| POST `bank/{uuid}/versions/` | Nouveau brouillon de la même famille, version incrémentée |
| GET `bank/{uuid}/history/` | Journal réservé aux personnes habilitées |
| POST `bank/import/` | Import atomique JSON, toujours en brouillon |
| GET `bank/export/?offset=0` | Export de 100 items maximum ; en-tête `X-Export-Next-Offset` ; limite d’offset dix millions |
| POST `bank/media/` | Multipart : file, title, transcript, provenance ; réponse sans chemin privé |
| POST `bank/publish/` | slug, title, skill, mode, durée, liste ordonnée d’UUID et description |
| POST `attempts/{uuid}/questions/{uuid}/audio/` | WAV privé autorisé à partir de la tentative, jamais une URL permanente |
| GET `progress/` | Bilan agrégé privé par compétence/mode et répartition des réponses par difficulté proposée |

Format d’import/export : `fluentia.bank.v1`, `items` limités à 100, corps importé à 2 Mo. [Exemple original importable](exemples/banque-originale.json). Les UUID/familles d’origine sont conservés dans la provenance textuelle de l’export ; un import crée de nouveaux identifiants et ne restaure pas des approbations, relecteurs ou statuts. Les fichiers audio ne sont pas intégrés au JSON : les importer dans l’environnement de destination et remplacer les références `media` avant import/révision. Il ne s’agit pas d’une sauvegarde complète de la base ou d’une archive autonome de médias. L’ordre des lots exportés est stable tant que la banque ne change pas ; pour un instantané global d’exploitation, utiliser une sauvegarde de base cohérente et le volume privé.

Les erreurs restent explicites : 400 pour entrée, transition, révision ou lecture impossibles ; 403 pour droits/CSRF ; 404 pour tentative étrangère ou document introuvable ; 429 pour limitation. Les contraintes de base protègent les versions et relations ; les collisions de publication remontent sans publication partielle. Le filtre pédagogique ne publie pas de brouillons.

## Médias, durée et écoute

`PRIVATE_MEDIA_ROOT` doit désigner un volume privé persistant et, en exploitation, un chemin absolu hors du build et des statiques. Par défaut : `apps/api/.private-media`. Ni Django URLs ni Next n’exposent ce dossier. `.gitignore` et `.dockerignore` excluent médias, courrier local, bases SQLite et fichiers d’environnement. Le conteneur de validation est un environnement éphémère, pas un stockage de production.

Le Compose de développement construit la passerelle Next avec `API_ORIGIN=http://api:8000`, configure `PUBLIC_WEB_ORIGIN=http://localhost:3000` et monte un volume nommé privé à `/var/lib/fluentia/private-media`. Les migrations doivent être appliquées avant utilisation, selon le démarrage du README racine. Les secrets backend du fichier `.env` ne sont pas transmis au service web. Changer l’origine privée exige de reconstruire le frontend. Le job Compose vérifie PostgreSQL, la passerelle, une inscription/connexion de recette, CSRF et déconnexion ; aucun envoi de courrier externe. Une réussite de ce contrôle ne vaut pas configuration de production, validation pédagogique ou test de sauvegarde/restauration.

WAV PCM uniquement : 20 Mo, 15 minutes maximum, mono ou stéréo, 8/16 bits, fréquences admises 8/16/22,05/24/44,1/48 kHz. Vérification de la structure, de la taille et de l’empreinte avant publication/délivrance. Pas de transcodage, d’analyse antivirus exhaustive, de stockage objet, CDN ou DRM revendiqué. Une transcription et une provenance sont requises. Une correction du fichier ou de la transcription crée un autre média, sans écrasement.

En entraînement : chargement authentifié, lecteur natif et commande explicite au clavier ; pause/réécoute et transcription disponibles. En simulation : délivrance unique, progression séquentielle, énoncé/choix affichés après la durée minimale du document et réponses aux questions dépassées refusées côté serveur. Le chargement et le délai global continuent même si le navigateur ne joue pas réellement le son. Le clic de lecture est activé après disponibilité des données décodables pour respecter les restrictions des navigateurs.

Le serveur ne peut pas prouver l’écoute humaine ni empêcher l’enregistrement d’un média reçu légitimement. Un document consommé ne peut pas être redemandé après un rechargement, une coupure ou une erreur de décodage en simulation ; les réponses déjà enregistrées sont conservées. Commencer une nouvelle tentative ou traiter l’incident avec le responsable. Ce mode d’entraînement n’est pas une certification du logiciel officiel de passation.

Un échec de transaction après l’écriture d’un média peut laisser un fichier privé orphelin. Ne pas supprimer automatiquement des fichiers sur la seule base d’un échec d’interface : une maintenance contrôlée doit comparer les enregistrements et le volume. Une sauvegarde doit inclure base et médias de façon cohérente. Cette maintenance, la politique d’effacement et la séparation des rôles DB restent à définir avant production.

## Simulations et analyses

Le moteur existant impose 39 QCM et les durées de compréhension prévues pour les simulations. Le nouveau chemin de publication impose aussi des difficultés proposées renseignées et non décroissantes ; leur classement n’est pas une calibration psychométrique. À l’oral, la durée cumulée des fichiers doit laisser du temps pour répondre dans le délai total. Les documents doivent contenir le support puis la question : vérification humaine requise.

Sources primaires : [TCF Canada — France Éducation international](https://www.france-education-international.fr/test/tcf-canada) et [manuel du candidat, version indexée sur le domaine officiel](https://www.france-education-international.fr/en/document/manuel-candidat-tcf-es). Les extraits officiels indexés consultés indiquent 39 questions, quatre choix et une seule réponse, 35 minutes à l’oral et 60 minutes à l’écrit ; le manuel décrit une diffusion unique du document et la question après le support. L’accès direct à certaines pages/manuels renvoie ERR-BOT-403 dans cet environnement. Aucun corrigé ni audio officiel n’est copié, aucun niveau ou score officiel n’est produit.

`/etudiant` permet de choisir lecture/oral et entraînement/simulation selon les versions publiées. `/etudiant/lecture/{tentative}` reste compatible avec le Lot 02 ; `/etudiant/ecoute/{tentative}` réutilise le parcours pour l’oral. `/etudiant/progression` ne calcule que les résultats réellement soumis du compte connecté. Les omissions figurent dans le total d’examen ; elles ne sont pas présentées comme des réponses dans les catégories. Aucune progression fictive n’apparaît dans un état vide.

La hiérarchie, les rayons 10/7 px, l’absence d’ombre et les cartes sobres reprennent les conventions Human-Centered examinées dans #3, sans fusionner ses fichiers d’accueil/dashboard. Poppins et les logos officiels sont conservés. Les titres sont proportionnés au contenu et aucune animation décorative continue n’est ajoutée. Les tokens clair/sombre et le focus existants restent utilisés. La compatibilité visuelle/runtime avec l’ensemble de #3 doit encore être validée dans une intégration commune autorisée ; les deux conflits documentaires et les anciens liens d’accueil signalés par l’audit ne sont pas implicitement résolus ici.

## Migrations et recette reproductible

Deux migrations nouvelles uniquement dans `pedagogy` : `0001_initial` crée les six modèles et contraintes ; `0002_editorial_guards` installe huit triggers réversibles. Les migrations dépendent du moteur examens existant ; aucun remplacement du modèle utilisateur. Toute future reconstruction SQLite des tables éditoriales doit retirer/réinstaller les triggers et revérifier les tests. Revenir sous `exams.0002` peut désinstaller les migrations dépendantes du nouvel espace : ce n’est pas une procédure de production sans sauvegarde et revue.

Sur une base de développement configurée : `python manage.py migrate`, puis éventuellement `python manage.py seed_original_bank`. Le seed est idempotent, ajoute trois brouillons sans relecteur, sans média approuvé et sans publication. Ne pas utiliser des identités fictives pour les valider. Les exemples originaux et le [WAV français synthétique](exemples/PROVENANCE_GENERATION.md) restent à relire par de vraies personnes.

Depuis `apps/api` : `python manage.py test accounts exams pedagogy health`, `python manage.py makemigrations --check --dry-run`, `python manage.py check`, puis OpenAPI strict. La CI exécute SQLite/PostgreSQL et les cycles de migrations sur bases jetables. Elle vérifie également les images Docker avec des sentinelles non sensibles placées dans les chemins qui doivent être exclus.

Depuis `apps/web` : contrôles frontend existants puis `npx playwright test --config=playwright.student.config.ts`. Installer les trois moteurs et préparer une base PostgreSQL jetable avec les scripts `seed-student-e2e.py` et `seed-lot03-e2e.py`, uniquement avec `FLUENTIA_E2E=1` et DEBUG. Les scripts refusent toute base autre que PostgreSQL nommé `fluentia_e2e` sur localhost/127.0.0.1, ou SQLite dans `.venv` avec un nom finissant par `-e2e.sqlite3`. Un test vérifie le refus de cibles non jetables, sans établir de connexion à celles-ci. Leurs comptes et approbations sont explicitement fictifs, sans valeur pédagogique réelle. Les fixtures audio sont des signaux PCM courts, pas des voix ; le navigateur doit néanmoins décoder et lire les médias jusqu’à leur fin. Les parcours complets couvrent 39 questions/documents, sauvegarde, reprise, correction et espace éditorial.

La boîte e-mail de recette est locale. `ACCOUNT_ANON_RATE=240/hour` est une configuration explicite du seul job navigateur pour ses nombreux comptes jetables ; le défaut applicatif reste 20/h. Les secrets et courriels ne figurent pas dans les captures/artefacts ; les traces réseau sont désactivées. Les premiers échecs peuvent arrêter la suite pour accélérer la correction, mais une exécution verte doit terminer tous les quinze tests sur les trois moteurs. Aucun test n’est supprimé pour cacher une anomalie.

## Limites avant une ouverture publique

Relecture pédagogique humaine et calibration, vérification des droits, délivrabilité et reprise des e-mails réels, récupération du mot de passe, gestion des incidents d’écoute, stockage et sauvegarde, rétention/effacement, cache distribué et frontal, HSTS/TLS/proxy, audit de sécurité et charge restent nécessaires. Les comptes administratifs réels et leur séparation sont à fournir par le responsable. Les lots expression, IA, paiement, enseignants et PWA restent distincts. Aucun service payant ni déploiement Railway Production n’a été activé. Le Lot 03 ne constitue pas la plateforme complète ni une banque prête à publier sans personnes qualifiées.
