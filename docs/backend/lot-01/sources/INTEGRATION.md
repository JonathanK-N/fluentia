# Fluentia — Intégration du moteur TCF (lot 01)

**Responsable du projet : Jonathan Kakesa**  
**Périmètre :** backend Django REST, QCM de compréhension écrite/orale, tentatives et correction déterministe.

> [!IMPORTANT]
> Ce dossier est un **overlay**, pas une copie complète du dépôt GitHub. Il doit être appliqué sur une branche temporaire créée depuis le dernier `dev`. Il ne doit pas remplacer les travaux frontend de Work ni être poussé sur `main`.

## Étapes

```bash
# Depuis le dépôt Fluentia déjà cloné
 git switch dev
 git pull --ff-only origin dev
 git switch -c feature/tcf-exam-engine-01
# Copier le dossier apps/api/exams/ de ce pack dans apps/api/exams/
```

Modifier **apps/api/config/settings.py** : ajouter `"exams"` à `INSTALLED_APPS`.

Modifier **apps/api/config/urls.py** :

```python
from django.urls import path, include
# Ajouter à urlpatterns :
path("api/v1/", include("exams.urls")),
```

Installer les dépendances existantes, puis :

```bash
cd apps/api
python manage.py makemigrations exams
python manage.py migrate
python manage.py seed_original_tcf
python manage.py test exams
python manage.py check
```

**Ne pas générer les migrations sur la production.** Les migrations générées, relues et testées doivent être versionnées dans la branche avant fusion.

## API

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/api/v1/exams/` | Public | Catalogue des examens publiés |
| GET | `/api/v1/exams/{id}/` | Public | Détail sans réponses |
| POST | `/api/v1/exams/{id}/attempts/` | Authentifié | Démarrer une tentative |
| GET | `/api/v1/attempts/{id}/` | Propriétaire | Récupérer les questions sans solutions pendant une tentative |
| PUT | `/api/v1/attempts/{id}/answers/` | Propriétaire | Sauvegarder une réponse |
| POST | `/api/v1/attempts/{id}/submit/` | Propriétaire | Corriger, soumettre et figer la tentative |
| GET | `/api/v1/attempts/{id}/results/` | Propriétaire | Résultats et explications après soumission |

Exemple de sauvegarde : `{"question_id":"UUID", "choice_id":"UUID"}`.

## Limites et tests

- Cette première tranche ne contient pas encore de système de connexion frontend, de streaming audio, d'épreuves d'expression, de paiements, ni d'un véritable examen blanc complet.
- Le chronomètre est contrôlé côté serveur. Une tentative expirée n'est pas automatiquement notée : le traitement métier des abandons est prévu dans le lot suivant.
- Les examens publiés doivent être figés côté admin : le verrou métier sur toute modification de questions publiées reste à ajouter.
- La limite d'une seule bonne réponse est appliquée au niveau de la base ; un contrôle garantissant **au moins** une bonne réponse doit être ajouté avant publication.
- Pas encore de journal d'audit métier, de quotas anti-abus ni de protection renforcée contre la copie de médias audio.
- L'API est destinée à être protégée par le mécanisme d'authentification déjà en place ; une intégration CSRF/session de production est à finaliser.
- Les questions fournies sont originales et illustratives, sans prétention d'être des sujets officiels ou des reproductions de Pack Ayoub.

## Cycle de validation

1. Installer et générer migrations sur une branche isolée.
2. Exécuter les tests Django et vérifier OpenAPI.
3. Vérifier isolation des tentatives et absence de corrigés avant soumission.
4. Préparer la PR en brouillon vers `dev`.
5. Fusion et promotion vers `tests` **uniquement après validation explicite**.
6. Aucun déploiement production sans GO distinct.
