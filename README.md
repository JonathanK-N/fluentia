<div align="center">

# 🌊 Fluentia
### Maîtrisez le français, allez plus loin.

![Statut](https://img.shields.io/badge/Statut-Fondations%20frontend-1769E0) ![Identité](https://img.shields.io/badge/Design-Cognito%20Inc.-21D4F4)

**Propriétaire du projet : Jonathan Kakesa** · [Dépôt](https://github.com/JonathanK-N/fluentia)

</div>

## Mission UX/UI 02 — conception

**Pilotes Human-Centered v3 :** accueil clair sur `/` et tableau de bord sans compte sur `/apercu/etudiant`. Consulter [la direction proposée](docs/DESIGN_DIRECTION_V3.md), [l’audit](docs/HUMAN_CENTERED_UX.md) et [la revue avec captures et contrôles](docs/UX_REVIEW.md). La [PR #3](https://github.com/JonathanK-N/fluentia/pull/3) reste en brouillon vers `dev`. Les 62 références historiques ne sont pas refondues ; généralisation, fusion et déploiement attendent une décision explicite.

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

Les PR #1 et #2 ont été fusionnées vers `dev` après validations techniques et deux autorisations explicites de Jonathan Kakesa. La [stratégie Code-First approuvée](docs/DECISIONS/002-code-first-et-consolidation.md) permet de poursuivre avec une [synchronisation Figma différée](docs/FIGMA_SYNC_BACKLOG.md). Le nouvel [accueil Discover](docs/LANDING_PAGE.md) est développé sur `frontend/mission-02-landing` depuis ce dev consolidé et validé. Voir [le rapport Frontend 02](docs/FRONTEND_02.md) et la [PR #3 en brouillon](https://github.com/JonathanK-N/fluentia/pull/3). Sa fusion et tout déploiement restent soumis à décision explicite.
