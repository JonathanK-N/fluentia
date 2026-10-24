<div align="center">

# 🌊 Fluentia
### La maîtrise du français, intelligemment.

![Statut](https://img.shields.io/badge/Statut-Socle%20initial-1769E0) ![Identité](https://img.shields.io/badge/Design-Cognito%20Inc.-21D4F4)

**Propriétaire du projet : Jonathan Kakesa** · [Dépôt](https://github.com/JonathanK-N/fluentia)

</div>

> [!IMPORTANT]
> Le présent dépôt constitue les fondations du produit. Il n'est pas encore une plateforme TCF complète. Les évaluations futures devront être validées pédagogiquement.

## 📚 Sommaire

| Référence | Document |
|---|---|
| 🧱 Architecture | [ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| 🎓 Modules métier | [PRODUCT.md](docs/PRODUCT.md) |
| 🎨 Design system | [BRAND.md](docs/BRAND.md) |
| 🔌 API | [API.md](docs/API.md) |
| 🛡️ Sécurité | [SECURITY.md](docs/SECURITY.md) |
| 🚀 Exploitation | [DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| 🗺️ Backlog | [ROADMAP.md](docs/ROADMAP.md) |

## Démarrage

Prérequis : Docker et Docker Compose.

```bash
cp .env.example .env
docker compose up --build
```

Frontend : http://localhost:3000 · API : http://localhost:8000/api/v1/health/ · Swagger : http://localhost:8000/api/schema/swagger-ui/

## Structure

```text
apps/web/             Next.js + TypeScript
apps/api/             Django REST Framework
docs/                 Spécifications et guides
.github/workflows/    Pipeline de vérification
```

## Attribution

Projet et responsabilité éditoriale : **Jonathan Kakesa**. Les commits doivent être créés avec le compte GitHub et l'identité Git configurés par le propriétaire. L'importation de ce projet ne modifie pas rétroactivement les auteurs des commits existants.
