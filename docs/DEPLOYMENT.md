# 🚀 Déploiement et exploitation

**Auteur : Jonathan Kakesa**

## Local

```bash
cp .env.example .env
docker compose up --build
```

## Railway

Guide complet, variables et vérifications : **[RAILWAY.md](RAILWAY.md)** · modèle de variables : [`.env.railway.example`](../.env.railway.example).

## Frontend reproductible

Le Dockerfile web utilise `npm ci` et le lockfile versionné. `.dockerignore` exclut les modules natifs de l’hôte, les builds et les fichiers d’environnement. Le job Docker de la CI a construit puis démarré le frontend et contrôlé accueil, catalogue, manifest et icône. Docker est absent de la machine Windows locale ; le succès est celui de la CI Linux. Le déploiement et Docker Compose complet restent non exécutés. La PR est NO-GO pour fusion tant que les défauts Figma ne sont pas résolus. Toute fusion et tout déploiement nécessitent une décision explicite ; Railway Production demeure interdit dans cette mission.
