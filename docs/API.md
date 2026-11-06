# 🔌 API v1 — Fluentia

**Auteur : Jonathan Kakesa**

## Route disponible

Les lots 01 et 02 intégrés à dev fournissent le [moteur privé](backend/lot-01/README.md) et les [comptes/lecture connectée](backend/lot-02/README.md). La branche du [lot 03](backend/lot-03/README.md) ajoute les API éditoriales, médias privés et progression ; son [OpenAPI validé](backend/lot-03/openapi.yaml) constitue le contrat actuel de cette branche. Les contrats « prévus » ci-dessous sont un historique du socle, pas une liste de fonctions opérationnelles. IA et paiements restent ultérieurs.

| Verbe | URL | Description |
|---|---|---|
| GET | `/api/v1/health/` | État minimal de l'API |

Schéma généré : `/api/schema/` · Swagger : `/api/schema/swagger-ui/`.

## Contrats prévus (non implémentés)

| Domaine | Routes |
|---|---|
| Identité | `POST /auth/register`, `POST /auth/login` |
| Examens | `GET /exams`, `POST /exams/{id}/attempts` |
| Réponses | `PUT /attempts/{id}/responses/{taskId}` |
| Résultats | `POST /attempts/{id}/submit`, `GET /attempts/{id}/results` |
| Écriture | `POST /ai/writing/evaluations` |
| Oral | `POST /ai/oral/sessions` |
| Progression | `GET /dashboard/overview` |
| Paiements | `POST /billing/checkout` |

Les routes implémentées appliquent les permissions et protections décrites dans leurs guides de lot ; le [schéma du lot 03](backend/lot-03/openapi.yaml) précise les corps et réponses de la branche en revue. Les limites d’exploitation et les contrats futurs restent distincts.
