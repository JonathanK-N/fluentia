# Lot 03 — Spécification de réalisation

Responsable : Jonathan Kakesa. Base : dev après fusion autorisée de #5, `cb3e3ec62c5e4673b9b6a64d3ae7e3c5e2dbcf03`. Branche : `backend/lot-03-banque-oral`. PR #3 préservée ; son accueil et son dashboard de démonstration ne sont pas fusionnés implicitement.

## Contrats

La banque éditoriale est séparée des versions d’examens déjà publiées. Un item possède une famille, une version, une compétence, une difficulté proposée non calibrée, un texte ou un média privé, quatre choix, une réponse correcte, une explication et une provenance. Parcours : brouillon → révision → approbation humaine → publication dans une nouvelle version d’examen. Une correction d’un item approuvé exige une nouvelle version. L’import JSON crée toujours un brouillon, sans importer d’approbation ni d’identité de relecteur. L’historique conserve acteur, date et instantanés ; les droits éditoriaux sont distincts du rôle étudiant.

Les médias du premier incrément sont des WAV PCM contrôlés : taille, durée, canaux, fréquence, intégrité SHA-256 et transcription. Aucun chemin ou URL privée n’est fourni dans le catalogue. Les fichiers sont hors des fichiers statiques et ne sont délivrés qu’au propriétaire d’une tentative active, par une requête authentifiée et protégée CSRF. En entraînement, réécoute autorisée. En simulation orale, délivrance unique par question, progression séquentielle, réponse après la durée du document, sans retour sur une question dépassée. Une copie ou capture par un navigateur autorisé n’est pas empêchable par cette application ; aucune promesse de DRM ou de preuve d’écoute humaine.

La réception d’un média et sa lecture effective sont distinctes : une délivrance consommée ne peut pas être annulée sur la seule parole du navigateur. L’interface doit expliquer les erreurs réseau et les limites de reprise d’une simulation. Les questions orales doivent être incluses dans les documents enregistrés ; les transcriptions ne sont accessibles qu’en entraînement ou après soumission, jamais comme aide implicite d’une simulation.

Le moteur conserve les tentatives privées et la correction idempotente existantes. Les simulations complètes restent des entraînements non officiels. Les analyses portent uniquement sur les tentatives soumises et des catégories internes ; aucune conversion vers un score officiel, CECRL ou NCLC. Les versions déjà publiées et les résultats historiques restent figés.

## Référence officielle et limites pédagogiques

Source primaire : [TCF Canada — France Éducation international](https://www.france-education-international.fr/test/tcf-canada). Les résultats indexés officiels consultés confirment 39 QCM à quatre choix/une réponse, 35 minutes en compréhension orale et 60 minutes en compréhension écrite. La page directe renvoie ERR-BOT-403 dans cet environnement ; le manuel officiel sera également consulté pour les modalités de passation. Cette réalisation ne copie aucune question, aucun audio ou corrigé d’une banque propriétaire. Les exemples et fixtures de recette ne valent jamais validation pédagogique humaine.

## Acceptation et vérification

- Import/export bornés, validations structurées, publication réservée à des items approuvés et historisés, auteur et relecteur distincts.
- Média privé : anonyme/tiers refusés, parcours et délai vérifiés côté serveur, absence de fuite de corrigé ou de transcription avant remise en simulation.
- SQLite et PostgreSQL : migrations non destructives, garde-fous existants conservés, courses sur édition/publication et délivrance audio vérifiées sur PostgreSQL.
- React : catalogue lecture/oral, lecteur accessible, sauvegarde/reprise, simulation complète, résultats et progression ; erreurs et clavier vérifiés sur trois moteurs via API réelle/PostgreSQL.
- Aucun contenu réellement publié sans relecture humaine ; une banque vide demeure un état valide. Administration exploitable et exemples originaux fournis en brouillon.
- Rapport avec SHA, preuves CI, captures et limites ; PR en brouillon vers dev, aucune fusion ou production automatique.
