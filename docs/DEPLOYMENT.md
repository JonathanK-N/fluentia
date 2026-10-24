# 🚀 Déploiement et exploitation

**Auteur : Jonathan Kakesa**

## Local

```bash
cp .env.example .env
docker compose up --build
```

## Railway (préparation)

1. Connecter `JonathanK-N/fluentia` à Railway.
2. Créer des environnements **staging** et **production** séparés.
3. Créer services frontend, API et PostgreSQL.
4. Fournir les variables d'environnement sécurisées dans Railway.
5. Exécuter migrations et tests de staging.
6. Mettre en place domaine, HTTPS, monitoring, sauvegardes et retour arrière.
7. Vérifier le statut GO/NO-GO avant bascule de production.

> [!IMPORTANT]
> Le dépôt ne configure pas automatiquement ton compte Railway. Les instructions décrivent une procédure à exécuter et contrôler.

## Frontend reproductible

Le Dockerfile web utilise `npm ci` et le lockfile versionné. `.dockerignore` exclut les modules natifs de l’hôte, les builds et les fichiers d’environnement du contexte Docker. Le build Docker doit être vérifié séparément avant staging ; aucun déploiement n’est réalisé dans la mission frontend.
