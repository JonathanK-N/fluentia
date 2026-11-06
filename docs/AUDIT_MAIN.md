# 🔍 Audit de la branche `main`

**Commit audité :** `35e9121` — *Merge pull request #7 from JonathanK-N/Mamadou* (5 novembre 2026)
**Périmètre :** `apps/api` (Django), `apps/web` (Next.js), CI GitHub Actions, Docker, documentation, préparation Railway.

## Synthèse

| Domaine | État | Commentaire |
|---|---|---|
| Backend Django | 🟢 Solide | 135 tests OK, `check` propre, aucune migration manquante, `pip-audit` sans vulnérabilité |
| Frontend Next.js | 🟢 Solide | Lint 0 avertissement, typage OK, 12 tests unitaires OK, build de production OK |
| Sécurité applicative | 🟢 Bonne base | Sessions même origine, CSRF strict, médias privés contrôlés (taille + SHA‑256), quotas |
| Prêt pour la production | 🔴 → 🟢 | 7 blocages corrigés sur la branche `deploiement/railway` (détail ci‑dessous) |
| CI | 🟠 → 🟢 | Le job `web` échouait sur `npm audit` (6 alertes modérées) : corrigé |
| Documentation | 🟠 | Riche mais dispersée (40+ fichiers), plusieurs statuts obsolètes ; README réécrit |

### Vérifications exécutées

| Commande | Résultat |
|---|---|
| `python manage.py check` | ✅ aucun problème |
| `python manage.py makemigrations --check` | ✅ aucune migration manquante |
| `python manage.py test` (SQLite) | ✅ 135 tests, 10 ignorés (concurrence : PostgreSQL seulement, couverts en CI) |
| `python manage.py check --deploy` | ⚠️ HSTS absent → rendu configurable |
| `pip-audit` | ✅ aucune vulnérabilité |
| `npm run lint` / `typecheck` / `test` / `build` | ✅ |
| `npm audit --audit-level=moderate` | ❌ 6 modérées (`minimatch` via `eslint-config-next`) → ✅ 0 après correctif |
| Recette « production » locale (DEBUG=0, Gunicorn + `next start`, proxy HTTPS simulé) | ✅ santé, admin + CSS, CSRF, connexion, profil, refus d'une origine hostile |

## 🔴 Blocages de mise en production (corrigés)

| # | Problème | Effet en production | Correctif |
|---|---|---|---|
| 1 | `SECURE_SSL_REDIRECT=True` sans `SECURE_PROXY_SSL_HEADER` | Derrière le proxy Railway, Django voit du HTTP : redirections en boucle, sonde de santé en `301` → déploiement refusé | En‑tête `X-Forwarded-Proto` reconnu, sonde exemptée, redirection désactivable |
| 2 | Aucun `STATIC_ROOT` ni serveur de fichiers statiques | Administration Django sans CSS avec `DEBUG=0` | WhiteNoise + `collectstatic` dans l'image |
| 3 | Gunicorn synchrone, délai par défaut de 30 s | La correction IA diffusée en continu (jusqu'à 90 s côté OpenAI) est coupée net | `gthread`, 4 fils, délai de 180 s (`gunicorn.conf.py`) |
| 4 | Port fixé à `8000`, écoute IPv4 seulement | Incompatible avec `$PORT` et le réseau privé Railway (IPv6) | `$PORT`, écoute `[::]` sur Railway |
| 5 | Limitation de débit basée sur `REMOTE_ADDR` | Derrière Next.js, **tous les visiteurs partagent un seul compteur** : 20 tentatives de connexion/heure pour toute la plateforme | `DJANGO_NUM_PROXIES=1` → adresse réelle via `X-Forwarded-For` |
| 6 | Paramètres SMTP non lus depuis l'environnement | Courriels de vérification impossibles à envoyer : inscription bloquée | `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS` |
| 7 | Migrations jamais lancées au déploiement | Base vide ou schéma en retard après une mise à jour | `bin/start.sh` : `migrate` puis Gunicorn (`RUN_MIGRATIONS=0` pour désactiver) |

**Autres améliorations apportées**

- Image web en deux étapes : dépendances de développement retirées, exécution sous l'utilisateur `node` (non root).
- `CSRF_TRUSTED_ORIGINS` complétables (`DJANGO_CSRF_TRUSTED_ORIGINS`), domaines Railway ajoutés automatiquement à `ALLOWED_HOSTS`.
- Journaux Django sur la sortie standard (lisibles dans Railway).
- `.env.railway.example`, guide [RAILWAY.md](RAILWAY.md), README refondu.

## 🟠 Points à traiter ensuite (non bloquants)

| Priorité | Sujet | Constat | Recommandation |
|---|---|---|---|
| Haute | **Médias privés** | Stockés sur le disque du conteneur | Volume Railway monté sur `PRIVATE_MEDIA_ROOT` (documenté) ; à terme, stockage objet S3/R2 avec URLs signées pour permettre plusieurs réplicas |
| Haute | **Mémoire à l'import** | `importer.py` charge l'archive entière en mémoire (`io.BytesIO(payload)`, jusqu'à 250 Mo), et Next.js met aussi le corps en tampon (`middlewareClientMaxBodySize: 250mb`) | Lire le zip depuis le fichier temporaire de Django (`uploaded.temporary_file_path()`), prévoir ≥ 1 Go de RAM pour l'API pendant les imports |
| Haute | **Courriel sur Railway** | Le SMTP sortant est restreint selon le forfait Railway | Vérifier le forfait ou utiliser un fournisseur via API HTTP / port 2525 |
| Moyenne | **Cache des quotas** | Cache mémoire local : chaque processus Gunicorn a ses propres compteurs | Redis Railway (`django.core.cache.backends.redis.RedisCache`) ou cache en base |
| Moyenne | **En‑têtes de sécurité** | `X-Frame-Options`, CSP `frame-ancestors` et `no-store` posés seulement sur `/etudiant` et `/edition` | Étendre une CSP de base et `X-Content-Type-Options` à tout le site ; activer HSTS après validation du domaine |
| Moyenne | **`API_ORIGIN` figé au build** | Les réécritures Next.js sont compilées | Documenté ; rebuild obligatoire si l'API change d'adresse |
| Basse | **Variable morte** | `NEXT_PUBLIC_API_BASE_URL` présente dans `.env.example` mais jamais lue | La retirer |
| Basse | **Documentation** | Plus de 40 fichiers dans `docs/`, plusieurs avec des statuts dépassés (« NO-GO », « PR en brouillon ») | Archiver les rapports de lot dans `docs/archive/`, garder un index court |
| Basse | **Branches** | 10 branches distantes, dont plusieurs fusionnées (`frontend/mission-01`, `backend/lot-0x`, `tests`) | Supprimer les branches fusionnées ; garder `main`, `dev` et les branches actives |
| Basse | **CODEOWNERS** | Seul `@JonathanK-N` est propriétaire | Ajouter Mamadou sur les zones qu'il maintient pour les relectures automatiques |
| Basse | **Flux Git** | `CONTRIBUTING.md` impose `dev` → PR, mais la PR #7 a fusionné `Mamadou` directement dans `main` | Protéger `main` (PR obligatoire, CI verte requise) et repasser par `dev` |

## Points forts relevés

- Moteur d'examen robuste : tests de concurrence sur PostgreSQL, garde‑fous d'intégrité en base, barème pondéré.
- Sécurité pensée dès la conception : CSRF même avant l'authentification, réponses génériques à l'inscription (pas d'énumération de comptes), quotas d'IA comptés en base.
- Correction IA découplée (`demo` / `openai`) et rien n'est compté en cas d'échec.
- CI complète : trois navigateurs, zoom 200 %, axe WCAG, Docker Compose de bout en bout, vérification que l'image ne contient ni `.env` ni base locale.

## Fichiers modifiés ou ajoutés

```text
apps/api/config/settings.py     proxy HTTPS, WhiteNoise, SMTP, quotas derrière proxy, HSTS, journaux
apps/api/requirements.txt       + whitenoise
apps/api/Dockerfile             collectstatic, dossier média, démarrage via bin/start.sh
apps/api/gunicorn.conf.py       nouveau : $PORT, gthread, délai 180 s, IPv6 sur Railway
apps/api/bin/start.sh           nouveau : migrations puis Gunicorn
apps/web/Dockerfile             deux étapes, sans dépendances de dev, utilisateur non root
apps/web/package.json (+ lock)  override minimatch ^11.0.5 (npm audit)
.github/workflows/ci.yml        RUN_MIGRATIONS=0 pour le contrôle d'image
.env.railway.example            nouveau : variables de production commentées
.gitignore                      autorise .env.railway.example
docs/RAILWAY.md                 nouveau : guide de déploiement
docs/DEPLOYMENT.md              renvoi vers RAILWAY.md
docs/AUDIT_MAIN.md              ce rapport
docs/images/readme/             bannière animée et captures à jour
README.md                       réécrit
```
