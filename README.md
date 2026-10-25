<div align="center">

# 🌊 Fluentia
### Maîtrisez le français, allez plus loin.

![Statut](https://img.shields.io/badge/Statut-Fondations%20frontend-1769E0) ![Identité](https://img.shields.io/badge/Design-Cognito%20Inc.-21D4F4)

**Propriétaire du projet : Jonathan Kakesa** · [Dépôt](https://github.com/JonathanK-N/fluentia)

</div>

## Mission UX/UI 02 — conception

Les [spécifications et références locales](docs/ux-ui-02/README.md) couvrent Discover, Learn et Voice. Le [rapport GO/NO-GO](docs/ux-ui-02/REPORT.md) distingue les livrables locaux, les éléments partiels et la conception native Figma bloquée par le quota. Ces références ne sont pas des pages métier implémentées ni des maquettes Figma enregistrées. Aucune fusion ni mise en production automatique.

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

Moteur d’examens backend lot 01 en recette : [intégration, modèles, API et limites](docs/backend/lot-01/README.md), [rapport GO/NO-GO](docs/backend/lot-01/RAPPORT.md), [préparation du lot 02](docs/backend/lot-01/PREPARATION_LOT_02.md). Les questions fournies restent en brouillon jusqu’à relecture réelle ; ce moteur ne constitue pas la plateforme complète.

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

## Frontend — Mission 01

Vitrine et catalogue `/design-system`, thèmes clair/sombre, logos officiels et Poppins locale. Les interactions sont locales : examens, comptes, coach et paiements restent à développer.

Démarrage : `cd apps/web`, `npm ci`, `npm run dev`.

Voir [la documentation](docs/README.md), [l’audit](docs/AUDIT_FRONTEND_01.md), [les tests](docs/TESTING.md) et [les contributions](CONTRIBUTING.md).

Premier lot : [rapport détaillé](docs/RAPPORT_FRONTEND_01.md) · [PR #1 vers dev](https://github.com/JonathanK-N/fluentia/pull/1) · [aperçu desktop](docs/images/accueil-1440.png).

La PR #1 a été fusionnée vers `dev` après validation technique et autorisation explicite de Jonathan Kakesa. La [stratégie Code-First approuvée](docs/DECISIONS/002-code-first-et-consolidation.md) permet de poursuivre avec une [synchronisation Figma différée](docs/FIGMA_SYNC_BACKLOG.md). Les défauts natifs et limites PWA restent documentés. La PR #2 est en cours de validation sur ce socle intégré ; sa fusion exige une deuxième autorisation. Voir [le suivi Frontend 02](docs/FRONTEND_02.md).
