# Fluentia — Développement progressif du produit

Responsable : Jonathan Kakesa.

## Cycle de travail reproductible

**Examiner → concevoir → implémenter → tester → auditer → corriger → documenter → PR → décision GO/NO-GO**.
Chaque itération doit livrer un parcours métier vertical réellement utilisable, pas uniquement des écrans simulés.

| Lot | Fonctionnalités | Prérequis / preuve de validation |
|---|---|---|
| 01 | Catalogue, QCM, tentatives, correction | Tests authentification, isolation, délai, correction |
| 02 | Comptes, onboarding, profils, permissions | Auth réelle, e-mails, tests sécurité |
| 03 | Compréhension orale, médias autorisés, écoute unique | Stockage sécurisé, tests de lecture |
| 04 | Compréhension écrite et examens complets | Minuteur, autosave, contraintes officielles |
| 05 | Expression écrite, versions et correction | Grilles pédagogiques, calibration humaine |
| 06 | Expression orale, audio, transcription | Consentement, latence, tests sur appareils |
| 07 | Coach, plan adaptatif, progression | Explicabilité, évaluations qualité |
| 08 | Abonnements, Stripe, quotas | Webhooks, idempotence, recette sandbox |
| 09 | Enseignants, classes, administration | RBAC, isolation multi-tenant |
| 10 | PWA, offline limité, notifications | Tests Android/iOS et sécurité |
| 11 | Recette E2E, accessibilité, charge, sécurité | Rapport GO/NO-GO production |

Les contenus doivent être originaux, validés ou correctement licenciés. Les examens doivent suivre la documentation officielle du TCF Canada et différencier **mode entraînement** / **mode simulation**. Les scores internes ne valent pas attestations officielles.
