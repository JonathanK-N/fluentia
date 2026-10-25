# 🔌 API v1 — Fluentia

**Auteur : Jonathan Kakesa**

## Route disponible

Le lot 01 intégré à dev fournit le [catalogue et les tentatives privées](backend/lot-01/README.md). Le [lot 02](backend/lot-02/README.md) ajoute comptes, sessions/CSRF, vérification du courriel, profil et première lecture React connectée sur sa branche de développement. Leurs guides précisent les routes effectivement implémentées et les limites ; les contrats « prévus » ci-dessous sont un historique du socle, pas un contrat actuel. IA et paiements restent ultérieurs.

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
