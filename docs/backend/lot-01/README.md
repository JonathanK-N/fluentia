# Lot 01 — moteur d’examens Fluentia

Responsable : Jonathan Kakesa. Branche `backend/lot-01-examens`, issue de dev `2e1ed545540e8ea5fb0c540475ce7e146fcf315f`. La PR #3 et son checkout frontend sont préservés dans leur branche ; aucun fichier frontend n’est intégré à ce lot.

## Audit de l’overlay

Les 14 fichiers ont été lus puis extraits sans écraser de fichier existant, sans chemin sortant du worktree et sans exécution de commande fournie par l’archive. Empreinte ZIP : `34a9d5254cf2c0fc27c76016819c4fb98703e2a883bcca2a75b03eea9572528a`. [Inventaire et empreintes individuelles](archive.json). Les guides reçus restent intacts dans [sources](sources/INTEGRATION.md) ; ils décrivent l’overlay initial, pas toutes les garanties de la version corrigée.

Le dev existant contient Django 5.2, DRF, drf-spectacular, SQLite/PostgreSQL et uniquement le diagnostic health, l’administration et le schéma. Aucun modèle d’examen ou route homonyme existant n’est écrasé. L’application exams est ajoutée aux settings et montée sous `/api/v1/` ; health et administration restent disponibles.

Défauts de l’overlay traités : expiration annulée par rollback, lecture sans rafraîchissement de l’état expiré, délais évalués avant acquisition du verrou, contenu publié modifiable, publication sans minimum de corrigé, absence de contraintes interrelations, administration des scores modifiable, absence de migrations. Les six tests de l’archive sont conservés ; leurs fixtures suivent maintenant le cycle brouillon → relecture → publication et une fenêtre temporelle cohérente. Aucun test n’est supprimé pour obtenir un résultat favorable.

## Données et publication

`Exam` : UUID, slug/version uniques, compétence, mode, durée positive, date de publication conservée après retrait. `Question` : ordre, texte, passage, référence audio privée, explication, difficulté explicitement non calibrée, origine et provenance, auteur/relecteur distincts, statut et date de validation. L’historique est constitué des versions d’examen ; une version publiée ne peut plus changer de contenu, même retirée du catalogue. Une nouvelle version se crée en brouillon avec le même slug et un numéro supérieur.

`Choice` : ordre unique, au plus une bonne réponse par question en base. Publication : quatre choix et exactement une bonne réponse, texte et explication nécessaires, relecture renseignée ; provenance/licence requise pour le contenu sous licence et les médias. Les simulations de compréhension exigent 39 questions et 3600 s en lecture ou 2100 s en écoute. Les petits entraînements sont distincts des simulations et ne produisent aucun score officiel.

Ces formats ont été recoupés avec les ressources publiques de [France Éducation international](https://www.france-education-international.fr/test/tcf-canada) et le [manuel candidat](https://www.france-education-international.fr/document/manuelcandidattoutes20dc3a9clinaisonsi). La page directe a refusé la lecture automatisée ; seuls les extraits officiels accessibles ont été utilisés. Aucun contenu propriétaire de Pack Ayoub ni sujet officiel n’est copié. Les trois textes fournis restent des exemples originaux de l’archive, sans revendication d’étalonnage humain.

`Attempt` : propriétaire, version d’examen, début, expiration, état, compteurs et date de soumission, compteur interne de verrouillage. `Answer` : une réponse par tentative/question ; cohérence tentative/examen/question/choix garantie en base. Contraintes d’état : pas de résultat en actif/expiré ; soumission avec date antérieure à l’expiration et compteurs cohérents.

Migrations versionnées : `0001_initial` crée les cinq modèles, index et contraintes ; `0002_integrity_guards` installe les garde-fous SQL SQLite/PostgreSQL pour la publication, le gel des contenus et les relations des réponses. PostgreSQL verrouille les parents avant de vérifier une mutation de contenu, afin de sérialiser avec la publication. Migration inverse fournie. Une future migration reconstruisant une table doit préserver ou réinstaller ces triggers ; les tests d’intégrité doivent alors être rejoués. Les autres moteurs sont refusés explicitement.

## Transactions et temps

Toutes les écritures et lectures susceptibles d’expirer une tentative prennent le même verrou transactionnel : mise à jour atomique du compteur interne, puis lecture. PostgreSQL sérialise les opérations sur la ligne ; SQLite sérialise les écritures mais n’est pas présenté comme une solution de production fortement concurrente. [Django rappelle la différence entre SQLite et les verrous de lignes](https://docs.djangoproject.com/en/5.2/ref/models/querysets/#select-for-update).

La comparaison est `maintenant >= expires_at`, après acquisition du verrou, avec recontrôle après validation/correction. L’horloge du serveur fait autorité, jamais un champ envoyé par le navigateur. L’instant d’admission métier est la dernière vérification serveur avant l’écriture ; il ne s’agit pas d’une garantie physique à la microseconde de la fin du commit.

L’expiration est enregistrée et la transaction validée **avant** de lever l’erreur REST. Une tentative expirée n’est pas notée automatiquement. Une tentative soumise conserve son résultat lors de répétitions, même après dépassement ultérieur du délai. Une sauvegarde concurrente passe entièrement avant la soumission ou est refusée après elle. La lecture actualise l’expiration sans dévoiler de corrigé.

## API et accès

| Méthode | Route | Accès / comportement |
|---|---|---|
| GET | `/api/v1/exams/` | Public, publiés seulement ; pagination 50, maximum 100 |
| GET | `/api/v1/exams/{uuid}/` | Public, métadonnées sans questions/corrigés |
| POST | `/api/v1/exams/{uuid}/attempts/` | Authentifié ; début et délai définis par le serveur |
| GET | `/api/v1/attempts/{uuid}/` | Propriétaire ; questions sans solutions si actif, réponses personnelles pour reprise |
| PUT | `/api/v1/attempts/{uuid}/answers/` | Propriétaire, UUID question/choix, actif et avant échéance |
| POST | `/api/v1/attempts/{uuid}/submit/` | Propriétaire ; correction déterministe, soumission idempotente |
| GET | `/api/v1/attempts/{uuid}/results/` | Propriétaire ; 409 avant soumission, explications après |

Une tentative étrangère ou inexistante renvoie 404. Erreurs de saisie et délais : 400. Authentification absente : 401/403 selon le mécanisme DRF. Limitation : 429. Les schémas de réponse sont explicites ; aucun `is_correct`, corrigé, explication ou clé audio ne figure dans les questions de passation. Les résultats portent `official: false`, sans conversion TCF/NCLC.

L’authentification existante de Django/DRF est conservée, avec contrôle CSRF pour les sessions. Les comptes, inscription, récupération et connexion frontend restent le lot 02. Les tests de session utilisent une vraie connexion Django en plus des tests d’isolation. L’administration des tentatives/réponses est en lecture seule, y compris pour un superutilisateur. Les actions de publication sont réservées au personnel ayant les permissions Django.

Limites anti-abus : 30 démarrages/h/utilisateur et 120 écritures/min/utilisateur via le cache DRF ; ce mécanisme n’est pas un quota distribué strict. Cache partagé, limitation en frontal et politique de rétention/effacement devront être définis avant production. Aucune permission n’est accordée en changeant d’écran ou de rôle dans les prototypes.

## Exécution locale

Dans un environnement isolé, depuis `apps/api`, configurer `DJANGO_DEBUG=1` pour le développement puis :

```sh
python -m pip install -r requirements.txt
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py migrate --noinput
python manage.py seed_original_tcf
python manage.py test exams health
python manage.py spectacular --validate --fail-on-warn --file schema.yaml
```

Le seed est idempotent : trois questions en brouillon, sans auteur/relecteur inventé. Un personnel compétent doit renseigner les vrais auteurs/relecteurs, effectuer la relecture puis publier via l’administration. Aucun compte, mot de passe, contenu déclaré validé ou abonnement n’est créé automatiquement. Les secrets de production restent dans l’environnement, jamais dans Git. Les migrations de production sont un acte distinct soumis à autorisation, pas une étape exécutée ici.

Versions vérifiées : Django 5.2.18 et DRF 3.18.3. Le minimum DRF a été relevé après audit de la version héritée ; les [notes officielles](https://www.django-rest-framework.org/community/release-notes/) et les [résultats d’audit](dependency-audit.json) sont conservés comme références. Le contrôle Django de déploiement laisse un avertissement HSTS à traiter avant production. Les contraintes d’exploitation et le périmètre exact figurent dans le rapport.

## Recette et décision

Les résultats réellement exécutés, SHA, liens CI et décision finale seront consignés dans [RAPPORT.md](RAPPORT.md). Les tests PostgreSQL utilisent des connexions distinctes : double soumission, sauvegarde/soumission, double sauvegarde, expiration pendant attente du verrou et publication concurrente avec mutation d’un choix. Ils sont explicitement exclus sur SQLite ; leur succès n’y est pas simulé.

**NO-GO production et plateforme complète.** Ce lot est un moteur backend, sans interface d’examen React réelle, inscription frontend, audio livré, IA, paiement, e-mails, PWA installée ou banque pédagogique validée. La PR #3 n’est pas fusionnée implicitement. La suite est préparée dans [PREPARATION_LOT_02.md](PREPARATION_LOT_02.md), sous réserve de revue du lot 01.
