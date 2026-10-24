# 🔌 API v1 — Fluentia

**Auteur : Jonathan Kakesa**

## Route disponible

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

Les endpoints sensibles nécessiteront authentification, permissions, validation, quotas et idempotence.
