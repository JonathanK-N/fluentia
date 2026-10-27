<div align="center">

# 🌊 Fluentia
### Maîtrisez le français, allez plus loin.

![Statut](https://img.shields.io/badge/Statut-Fondations%20frontend-1769E0) ![Identité](https://img.shields.io/badge/Design-Cognito%20Inc.-21D4F4)

**Propriétaire du projet : Jonathan Kakesa** · [Dépôt](https://github.com/JonathanK-N/fluentia)

</div>

## Mission UX/UI 02 — conception

La direction v3 des pilotes est validée pour poursuite. La [généralisation aux interfaces existantes](docs/GENERALISATION_V3.md) est en cours de recette ; les références HTML restent des prototypes sans services métier. Fusion et déploiement ne sont pas autorisés.

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

Les lots backend [01](docs/backend/lot-01/README.md) et [02](docs/backend/lot-02/README.md) sont intégrés à `dev` après les fusions autorisées des PR #4 et #5. Le [lot 03](docs/backend/lot-03/README.md), dans la PR #6 en brouillon, ajoute banque pédagogique, médias privés, compréhension orale, simulations complètes et progression. Les contenus proposés restent en brouillon jusqu’à relecture humaine réelle ; ces lots ne constituent pas la plateforme complète.

Prérequis : Docker et Docker Compose.

```bash
cp .env.example .env
docker compose build
docker compose up -d db
docker compose run --rm api python manage.py migrate --noinput
docker compose up
```

Frontend : http://localhost:3000 · API : http://localhost:8000/api/v1/health/ · Swagger : http://localhost:8000/api/schema/swagger-ui/

## Expérience Fluentia v2 — espace étudiant complet

Branche `feature/fluentia-experience-v2` : lot 03 et pilotes v3 réunis, direction visuelle **Ivoire & Sable** (blanc et beige dominants, encre chaude, marine réservé à l’action, cyan limité à la signature vocale ; contrastes WCAG AA vérifiés en clair et en sombre). Détails dans [docs/EXPERIENCE_V2.md](docs/EXPERIENCE_V2.md).

| Page | Rôle |
|---|---|
| `/etudiant` | Tableau de bord : accueil, indicateurs réels, accès rapide aux quatre compétences, activités, catalogue |
| `/etudiant/comprehension-ecrite`, `/etudiant/comprehension-orale` | Format, méthode et exercices publiés par compétence |
| `/etudiant/expression-ecrite/tache-1..3` | Studio de rédaction : sujets originaux, compteur de mots, minuteur, brouillon local, auto-évaluation |
| `/etudiant/expression-orale/tache-1..3` | Studio oral : préparation, enregistrement local, niveau du micro, prises multiples |
| `/etudiant/examens-blancs` | Simulations complètes chronométrées |
| `/etudiant/progression` | Résultats soumis par compétence et par difficulté proposée |
| `/etudiant/plan` | Plan d’étude hebdomadaire indicatif, conservé sur l’appareil |
| `/etudiant/compte`, `/etudiant/support` | Compte et vérification ; aide et questions fréquentes |
| `/edition` | Banque pédagogique dans la même coque de navigation |

Démarrage local sans Docker (base SQLite jetable, données de recette fictives) : voir [docs/EXPERIENCE_V2.md](docs/EXPERIENCE_V2.md#démarrage-local).

## Structure

```text
apps/web/             Next.js + TypeScript
apps/api/             Django REST Framework
docs/                 Spécifications et guides
.github/workflows/    Pipeline de vérification
```

## Attribution

Co-auteur et contributeur de l’expérience v2 : **Mamadou Barry**.

Projet et responsabilité éditoriale : **Jonathan Kakesa**. Les commits doivent être créés avec le compte GitHub et l'identité Git configurés par le propriétaire. L'importation de ce projet ne modifie pas rétroactivement les auteurs des commits existants.

## Frontend — Mission 01

Vitrine et catalogue `/design-system`, thèmes clair/sombre, logos officiels et Poppins locale. Le lot 02 intégré fournit `/etudiant`, comptes et lecture connectée. La branche du [lot 03](docs/backend/lot-03/README.md) étend le parcours à l’oral, aux simulations, à la progression et à `/edition` pour les personnes habilitées ; coach et paiements restent ultérieurs. La PR #3 Human-Centered reste indépendante.

Démarrage : `cd apps/web`, `npm ci`, `npm run dev`.

Voir [la documentation](docs/README.md), [l’audit](docs/AUDIT_FRONTEND_01.md), [les tests](docs/TESTING.md) et [les contributions](CONTRIBUTING.md).

Premier lot : [rapport détaillé](docs/RAPPORT_FRONTEND_01.md) · [PR #1 vers dev](https://github.com/JonathanK-N/fluentia/pull/1) · [aperçu desktop](docs/images/accueil-1440.png).

Les PR #1 et #2 ont été fusionnées vers `dev` après validations techniques et autorisations explicites de Jonathan Kakesa. La [stratégie Code-First approuvée](docs/DECISIONS/002-code-first-et-consolidation.md) permet de poursuivre avec une [synchronisation Figma différée](docs/FIGMA_SYNC_BACKLOG.md). Les [pilotes v3](docs/UX_REVIEW.md) de `frontend/mission-02-landing` sont intégrés avec le lot 03 dans la branche `feature/fluentia-experience-v2`. Voir [le suivi Frontend 02](docs/FRONTEND_02.md).
