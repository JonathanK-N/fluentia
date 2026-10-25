# Lot 02 — Comptes et première lecture réelle

Responsable : Jonathan Kakesa. Documentation française. Aucun service payant, envoi externe, fusion du lot 02 ou déploiement production autorisé par ce document.

## Provenance et portée

La PR #4 a été fusionnée vers `dev` après autorisation explicite du responsable dans la conversation. Commit de fusion : `3b0a1124d6543640a52a2a45c8139afa97104b90`, sources validées : `72f6eb80455ecec771711b174eee795a7af2c9d3`. La branche `backend/lot-02-parcours-etudiant` part de ce nouveau dev. La PR #3 reste indépendante, sans fusion implicite de ses travaux UX/UI. Le point d’entrée ajouté dans la navigation existante devra être rapproché de sa navigation lors d’une intégration ultérieure.

Ce lot ajoute inscription, session, vérification du courriel, profil, catalogue de lecture, reprise des tentatives, sauvegarde, soumission et corrigés privés. Il ne réalise pas tous les lots de la [feuille de route](../lot-01/sources/ROADMAP_BACKEND.md). Aucun résultat interne ne constitue un score officiel TCF ou NCLC.

## Architecture et sécurité

Le modèle `auth.User` est conservé ; aucun remplacement destructif. `StudentProfile` lui est associé en un-à-un. L’adresse est normalisée à l’inscription, recherchée sans tenir compte de la casse et protégée par un index fonctionnel unique hors adresses vides. Les comptes historiques sans adresse peuvent subsister. Les doublons existants doivent être examinés par le responsable : la migration refuse de les supprimer ou fusionner automatiquement. La migration de l’index dépend de la dernière migration auth existante, afin qu’une reconstruction SQLite ne l’efface pas. Toute future reconstruction de cette table doit préserver cet index.

Mots de passe hachés par Django, validation minimale de 12 caractères, mots de passe courants/numériques/proches du compte refusés. Aucun rôle fourni par le client n’est appliqué. Les erreurs de connexion sont génériques ; l’inscription d’une adresse existante conserve la réponse générique sans renvoyer de courrier. Cela ne constitue pas une garantie contre toute analyse temporelle.

Toutes les mutations des comptes exigent un jeton CSRF, y compris inscription, connexion et validation anonyme. Les cookies de session sont HttpOnly et SameSite=Lax, Secure hors DEBUG. Connexion : rotation de session ; déconnexion : invalidation. Durée maximale de session 12 h, fermeture du navigateur demandée via cookie de session. Les routes personnelles imposent `Cache-Control: private, no-store`.

Les jetons de vérification contiennent 32 octets aléatoires, durent 24 h et sont stockés uniquement sous forme SHA-256 en base. Ils sont liés à l’adresse destinataire : une modification du courriel invalide le lien et le statut vérifié antérieur. Leur consommation est atomique, à usage unique. Un renvoi remplace le précédent lien et respecte un délai minimal de 60 s. Le lien utilise l’origine configurée, jamais l’en-tête Host, et place le jeton dans le fragment d’URL ; l’interface retire ce fragment avant validation explicite par POST. Le simple chargement d’un lien ne le consomme pas.

Trois migrations comptes : tables du profil et des liens, index unique des courriels, puis liaison de la vérification à son adresse. Un retour arrière de la troisième retire les colonnes de liaison : les comptes restent présents mais une nouvelle vérification est requise après réapplication. Les tickets plus anciens sans adresse liée ne sont pas acceptés. Le workflow teste le retour vers `0001` puis la réapplication jusqu’à `0003` uniquement sur une base jetable.

Un compte non vérifié peut se connecter et modifier son nom d’usage ; il ne peut pas démarrer un exercice. Les comptes historiques doivent vérifier leur adresse, sans validation automatique. Les tentatives et résultats demeurent accessibles uniquement à leur propriétaire ; aucun corrigé avant soumission. Les solutions enrichies après soumission incluent les libellés pour permettre une relecture après rechargement.

Limitation DRF locale : 20 requêtes anonymes/h aux mutations des comptes et 60/h par compte connecté ; bootstrap CSRF exclu. Les limites du moteur restent celles du lot 01. Un cache partagé, une protection en frontal et une politique de conservation restent nécessaires avant production. Ni ces limites ni les tests ne remplacent un audit de pénétration ou de charge.

## Contrat API

Toutes les routes ci-dessous commencent par `/api/v1/`. Pour une mutation : obtenir `GET auth/csrf/`, garder les cookies, envoyer `X-CSRFToken` et JSON. Le jeton est renouvelé après connexion. Aucun jeton de session n’est placé dans localStorage.

| Méthode / route | Corps | Accès / réponse |
|---|---|---|
| GET `auth/csrf/` | — | Public, cookie CSRF + jeton masqué |
| POST `auth/register/` | email, password, display_name | Public avec CSRF, 202 générique |
| POST `auth/login/` | email, password | Public avec CSRF, profil et cookie de session |
| POST `auth/logout/` | — | Session + CSRF, invalidation |
| GET `auth/profile/` | — | Profil du compte connecté uniquement |
| PATCH `auth/profile/` | display_name | Session + CSRF ; courriel et rôles non modifiables |
| POST `auth/verify/` | token | Public avec CSRF, 200 ou 400 invalide/expiré |
| POST `auth/verification/resend/` | — | Session + CSRF, message générique |
| GET `attempts/` | — | Liste paginée des tentatives du compte connecté |

Les sept routes examens du [lot 01](../lot-01/README.md) sont conservées. Démarrer nécessite désormais un courriel vérifié. Les routes privées refusent les anonymes (403 avec SessionAuthentication), les identifiants étrangers retournent 404, les résultats anticipés 409, les entrées invalides 400 et les limitations 429. Le schéma généré par `manage.py spectacular --validate --fail-on-warn` est la source exacte des DTO.

## Démarrage et courriel

Backend : installer `apps/api/requirements.txt`, configurer DEBUG uniquement en local, appliquer `python manage.py migrate`, puis démarrer sur `127.0.0.1:8000` depuis `apps/api`.

Frontend : `npm ci`, `npm run build`, `npm run start` depuis `apps/web`. `API_ORIGIN` configure à la construction la passerelle Next vers Django ; défaut `http://127.0.0.1:8000`. Les requêtes navigateur restent de même origine sous `/api/v1/`, sans activer CORS. `PUBLIC_WEB_ORIGIN` doit correspondre à l’URL réelle du frontend pour les liens de vérification et constitue l’unique origine explicitement autorisée par CSRF derrière cette passerelle ; aucun joker ni origine fournie par le client n’est accepté.

Par défaut le backend de courriel est en mémoire : aucun message externe. Pour essayer manuellement la vérification en développement, configurer `DJANGO_EMAIL_BACKEND=django.core.mail.backends.filebased.EmailBackend` et `DJANGO_EMAIL_FILE_PATH` vers un dossier privé hors des fichiers servis. Ces fichiers contiennent des secrets temporaires : ne pas les committer, publier, ajouter aux captures ou aux artefacts CI. `.local-mail` est ignoré. Aucun fournisseur SMTP n’est choisi ou activé. Avant production, un adaptateur fiable avec reprise d’envoi, supervision et configuration explicite sera nécessaire.

Parcours : `/etudiant/compte`, `/etudiant/verifier`, `/etudiant`, `/etudiant/lecture/{tentative}`. La sauvegarde attend l’accusé serveur avant de cocher le choix, désactive les mutations pendant l’écriture et propose une nouvelle sélection en cas d’échec. La liste personnelle permet la reprise sans stockage navigateur des réponses. Une tentative expirée conserve les réponses sans calculer de score automatique. Les résultats sont relus depuis l’API après soumission et rechargement.

## Recette reproductible

Depuis `apps/api` : `python manage.py test accounts exams health`, `python manage.py makemigrations --check --dry-run`, `python manage.py check`, puis validation stricte du schéma. Le workflow exécute les tests sur SQLite et PostgreSQL 16, vérifie les migrations existantes et construit les conteneurs.

Le job `student-journey` utilise PostgreSQL, le frontend construit et une vraie API HTTP. Une boîte de courriel locale permet de vérifier réellement le lien reçu. `scripts/seed-student-e2e.py` refuse de fonctionner sans `FLUENTIA_E2E=1` et DEBUG ; il est réservé à une base jetable. Son auteur/relecteur synthétiques ne constituent aucune validation pédagogique humaine. Ce script ne doit jamais être lancé sur une base réelle.

Depuis `apps/web` : `npx playwright test --config=playwright.student.config.ts`, après migration et installation de cette fixture. Variables : base jetable `DATABASE_URL`, `DJANGO_DEBUG=1`, `FLUENTIA_E2E=1`, backend de courrier fichier, `DJANGO_EMAIL_FILE_PATH` absolu privé, `PUBLIC_WEB_ORIGIN=http://127.0.0.1:3101`. Les serveurs sont lancés par Playwright. `E2E_PYTHON` peut désigner un interpréteur précis. Chromium, Firefox et WebKit mobile sont configurés ; seules les exécutions effectivement terminées seront déclarées réussies dans le rapport. Captures sans secrets et résultats sont conservés par le workflow, jamais le courrier ou les traces réseau contenant des secrets.

## Contenus et suite

Les trois textes originaux du seed lot 01 restent en brouillon et doivent être relus par des personnes qualifiées. Une proposition complémentaire figure dans [CONTENU_ORIGINAL.md](CONTENU_ORIGINAL.md). Le catalogue vide sur une base réelle non relue est un comportement volontaire, pas une panne. Aucune question propriétaire de Pack Ayoub n’est reprise.

Limites avant production : HSTS/TLS et proxy à valider, envoi e-mail réel avec reprise, récupération du mot de passe et changement du courriel, politique de rétention/effacement, cache distribué, audit de sécurité et charge. La compréhension orale, expression, IA, paiements, enseignants et PWA restent des lots distincts. Toute fusion du lot 02, promotion vers tests/main ou production exige une nouvelle décision explicite.
