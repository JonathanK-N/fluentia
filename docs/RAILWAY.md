# 🚂 Déploiement sur Railway

Guide pas à pas pour mettre Fluentia en ligne sur Railway : un projet, trois services, un volume.

```text
                    Internet (HTTPS)
                           │
                ┌──────────▼──────────┐
                │   web  (Next.js)    │  domaine public : app.votre-domaine.com
                │   /apps/web         │  réécrit /api, /admin, /static/admin
                └──────────┬──────────┘
                           │ réseau privé  http://api.railway.internal:8000
                ┌──────────▼──────────┐       ┌────────────────────────┐
                │   api  (Django)     │──────▶│  Postgres (Railway)    │
                │   /apps/api         │       └────────────────────────┘
                │   Gunicorn gthread  │
                └──────────┬──────────┘
                           │ volume : /var/lib/fluentia/private-media
                           ▼  (audios et images privés)
```

Le navigateur ne parle qu'au service **web** : l'API reste privée, sans domaine public. Cookies de session et jeton CSRF restent sur la même origine.

> [!IMPORTANT]
> **Config as Code (`railway.json` / `railway.toml`) est déprécié chez Railway** : les nouveaux services ne peuvent plus l'utiliser et les fichiers existants cessent d'être lus le **1er décembre 2026**. Le dépôt n'en contient donc pas. Les réglages ci‑dessous se font dans le tableau de bord (ou plus tard via l'Infrastructure as Code de Railway, `.railway/railway.ts`). Les Dockerfiles portent l'essentiel : port, migrations, démarrage.

## 1. Créer le projet

1. Railway → **New Project** → **Deploy from GitHub repo** → `JonathanK-N/fluentia`.
2. Créer deux environnements : `staging` (branche `dev`) et `production` (branche `main`).
3. **+ New → Database → PostgreSQL**. Garder le nom `Postgres`.

## 2. Service `api` (Django)

| Réglage | Valeur |
|---|---|
| Nom du service | `api` |
| Root Directory | `/apps/api` |
| Builder | Dockerfile (détecté automatiquement) |
| Watch Paths | `/apps/api/**` |
| Healthcheck Path | `/api/v1/health/` |
| Réplicas | **1** (le volume ne s'attache qu'à un seul service et une réplique) |
| Domaine public | aucun |
| Volume | **+ Volume** monté sur `/var/lib/fluentia/private-media` |

Le conteneur exécute `bin/start.sh` : `migrate --noinput` (désactivable avec `RUN_MIGRATIONS=0`), puis Gunicorn sur `$PORT` en mode `gthread`, délai de 180 s pour la correction diffusée en continu. Sur Railway, Gunicorn écoute sur `[::]` (IPv4 + IPv6), exigé par le réseau privé.

Variables : voir la section `api` de [`.env.railway.example`](../.env.railway.example). Au minimum :

```bash
PORT=8000
DATABASE_URL=${{Postgres.DATABASE_URL}}
DJANGO_SECRET_KEY=<générée>
DJANGO_DEBUG=0
PUBLIC_WEB_ORIGIN=https://<domaine du service web>
PRIVATE_MEDIA_ROOT=/var/lib/fluentia/private-media
DJANGO_NUM_PROXIES=1      # sans elle, tous les visiteurs partagent la même limite de connexions
```

`RAILWAY_PUBLIC_DOMAIN`, `RAILWAY_PRIVATE_DOMAIN` et la sonde `healthcheck.railway.app` sont ajoutés automatiquement à `ALLOWED_HOSTS`.

## 3. Service `web` (Next.js)

| Réglage | Valeur |
|---|---|
| Nom du service | `web` |
| Root Directory | `/apps/web` |
| Builder | Dockerfile |
| Watch Paths | `/apps/web/**` |
| Healthcheck Path | `/` |
| Domaine public | **Generate Domain**, puis domaine personnalisé |

```bash
API_ORIGIN=http://${{api.RAILWAY_PRIVATE_DOMAIN}}:${{api.PORT}}
```

> [!WARNING]
> `API_ORIGIN` est **figé pendant la construction** (les réécritures Next.js sont compilées dans `.next/routes-manifest.json`). Railway le transmet comme argument Docker (`ARG API_ORIGIN`). Toute modification de cette variable ou du nom du service `api` exige un **nouveau build** du service web.

## 4. Premier déploiement

```bash
# 1. Déployer api puis web (Railway le fait au push).
# 2. Créer le compte d'administration (Railway CLI) :
railway link                       # choisir le projet et l'environnement
railway ssh --service api          # shell dans le conteneur api
python manage.py createsuperuser
# 3. (optionnel, staging) contenus de démonstration :
python manage.py seed_original_tcf
python manage.py seed_original_bank
```

## 5. Vérifications après déploiement

```bash
WEB=https://<domaine web>
curl -fsS $WEB/api/v1/health/                     # {"status":"ok","service":"fluentia-api"}
curl -fsSI $WEB/admin/login/ | head -1            # 200
curl -fsSI $WEB/static/admin/css/base.css | head -1   # 200 (WhiteNoise)
```

Puis, dans un navigateur : inscription → courriel de vérification reçu → connexion → une série de Lecture → une correction de Rédaction → import d'une série dans `/edition/import`.

## 6. Avant d'ouvrir au public

- [ ] **Courriel** : fournisseur SMTP configuré (`EMAIL_*`). Railway restreint le SMTP sortant selon le forfait : vérifier le vôtre, ou utiliser un fournisseur qui accepte le port 2525 / une API HTTP.
- [ ] **HTTPS** validé sur le domaine final, puis `DJANGO_HSTS_SECONDS=31536000`.
- [ ] `PUBLIC_WEB_ORIGIN` et `DJANGO_CSRF_TRUSTED_ORIGINS` alignés sur le domaine final.
- [ ] Sauvegardes PostgreSQL activées et **sauvegarde du volume** des médias privés.
- [ ] `WRITING_CORRECTOR=openai` + clé et modèle seulement après validation du coût et de la politique de données.
- [ ] Alertes Railway (crash, mémoire) et journaux consultés après chaque déploiement.

## 7. Courriels

Sept courriels transactionnels partent du backend (gabarits dans `apps/api/accounts/templates/emails/`) : confirmation d'adresse, bienvenue, mot de passe oublié, mot de passe modifié, nouvel appareil, Premium activé, Premium bientôt terminé.

- Sans SMTP configuré (`DJANGO_EMAIL_BACKEND=…console.EmailBackend`), ils s'affichent dans les journaux du service `api`.
- Le rappel « Premium bientôt terminé » est envoyé par une commande à lancer une fois par jour : créer un service Railway **Cron** sur le même dépôt (`/apps/api`), mêmes variables, horaire `0 13 * * *` (8 h à Toronto), commande `python manage.py send_premium_reminders --days 7`.

## 8. Retour arrière

Railway → service → **Deployments** → déploiement précédent → **Redeploy**. Les migrations Django ne sont pas annulées automatiquement : une migration destructive se prépare en deux déploiements (ajout, puis suppression).

## Dépannage

| Symptôme | Cause probable | Correction |
|---|---|---|
| `502` sur `/api/...` depuis le web | `API_ORIGIN` incorrect ou figé dans un ancien build | Corriger la variable, **redéployer web** |
| `400 Bad Request` de Django | hôte absent d'`ALLOWED_HOSTS` | Ajouter le domaine à `DJANGO_ALLOWED_HOSTS` |
| `403 CSRF` à la connexion | domaine public ≠ `PUBLIC_WEB_ORIGIN` | Aligner l'origine ou compléter `DJANGO_CSRF_TRUSTED_ORIGINS` |
| Boucle de redirection | proxy sans `X-Forwarded-Proto` | `DJANGO_SECURE_SSL_REDIRECT=0` (Railway force déjà HTTPS) |
| Admin sans style | `collectstatic` absent | Reconstruire l'image api |
| Audios disparus après redéploiement | volume non monté | Monter le volume sur `PRIVATE_MEDIA_ROOT` |
| Correction coupée au bout de 30 s | délai Gunicorn | `GUNICORN_TIMEOUT=180` (défaut du dépôt) |
