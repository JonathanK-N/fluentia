# 🔌 API v1 — Fluentia

**Auteur : Jonathan Kakesa**

## Route disponible

Le lot 01 ajoute le [catalogue et les tentatives privées](backend/lot-01/README.md) sur sa branche temporaire. Les contrats ci-dessous indiqués « prévus » sont l’historique du socle ; seuls les endpoints effectivement listés et testés dans ce guide de lot sont implémentés. Authentification frontend, IA et paiements restent à développer.

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
