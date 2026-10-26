# Rapport de recette — Backend Lot 03

Responsable : Jonathan Kakesa. Revue du 25 octobre 2026 (America/Toronto). PR [#6](https://github.com/JonathanK-N/fluentia/pull/6), en brouillon vers dev.

## Décision technique

**GO technique pour revue et fusion vers dev, sous décision explicite du responsable. NO-GO production.** Les six jobs du checkpoint applicatif final sont réussis, y compris les quinze parcours navigateur. Aucun contenu généré n’est déclaré validé humainement. Aucune fusion de #6, de #3 ou promotion vers tests/main, aucun déploiement Railway Production et aucun service payant activé.

## Provenance des sources

- Autorisation explicite « go » après le [rapport de phase 1](VALIDATION_PR_05_AVANT_FUSION.md).
- PR #5 fusionnée au commit `cb3e3ec62c5e4673b9b6a64d3ae7e3c5e2dbcf03`, base de `backend/lot-03-banque-oral`.
- PR #3 préservée au SHA `1d4ffbcfaa0ba7228c0951f32932eb7bf55269b7`, sans fusion implicite de l’accueil ou du dashboard de démonstration.
- Premier checkpoint complet réussi : `eeb2c43eac719f1ad6595dd27451bd97c0ab1571`, [CI push 40260130037](https://github.com/JonathanK-N/fluentia/actions/runs/40260130037), six jobs réussis.
- Checkpoint applicatif final validé : `51a24dc0e741f7e026e8b878a10a8d4138780839`, [CI push 40261048069](https://github.com/JonathanK-N/fluentia/actions/runs/40261048069), six jobs réussis. Les commits documentaires suivants ne doivent pas être confondus avec les sources des captures ou des tests antérieurs ; le HEAD livré et ses derniers contrôles figurent dans la PR. [Synthèse des preuves](ci-summary.json).
- Complément de raccordement Compose : `7b6f35baa1917109b0f1c410c787ec988e6ac151`, [job Compose réussi](https://github.com/JonathanK-N/fluentia/actions/runs/40262178301/job/121376702838). Ce complément change le build et la configuration de développement, pas le moteur ou les composants des captures. La CI comporte désormais sept jobs ; leurs résultats au HEAD documentaire livré sont indiqués dans la PR.

## Fonctions livrées

Banque éditoriale versionnée avec responsable, attribution, compétence, difficulté proposée, provenance, quatre choix distincts, clé et explication. Parcours brouillon/révision/approbation humaine/publication ; relecteur habilité distinct, note et attestation nécessaires. Import/export JSON bornés, jamais d’approbation importée ; historique immuable et nouvelle version obligatoire après approbation. Publication transactionnelle en versions d’examen figées, sans changer les résultats antérieurs.

Médias WAV PCM privés contrôlés, délivrés uniquement dans une tentative authentifiée appartenant au demandeur. Entraînement oral avec lecture, réécoute et transcription ; simulation séquentielle avec une délivrance par document, délai serveur, réponses après durée minimale et interdiction de modifier une question dépassée. Aucun chemin public de média, corrigé ou transcription anticipée en simulation. Lecture et oral complets de 39 questions, reprise des réponses, remise idempotente et résultats privés. Progression réelle par compétence/mode, analyses descriptives par difficulté proposée, sans score officiel.

Interface React `/edition` : filtrage, formulaires, média, relecture, historique, import/export, sélection et ordre des questions. Django Admin : consultation, filtres, recherche et transitions autorisées. Interfaces étudiantes `/etudiant`, `/etudiant/ecoute/{id}` et `/etudiant/progression` ; route de lecture Lot 02 conservée. Hiérarchie et tokens sobres Human-Centered repris localement sans modifier la branche #3. Logos et assets officiels inchangés dans le diff.

## Vérifications réellement effectuées

| Contrôle | Résultat / limite |
|---|---|
| Windows SQLite, dernier code applicatif | 84 tests découverts, 74 réussis, dix exclusions PostgreSQL ; 29,865 s |
| PostgreSQL 16 | 84 tests réussis, sans exclusion, [job 121373310673](https://github.com/JonathanK-N/fluentia/actions/runs/40261048069/job/121373310673) |
| Courses PostgreSQL | Cinq du moteur, deux des comptes, trois nouvelles : édition concurrente, versions de publication et double demande audio |
| Cas fonctionnels nouveaux | Workflow, auto-approbation refusée, attestation obligatoire, édition périmée, retour en brouillon, gel SQL, nouvelle version non approuvée, quatre choix distincts, import/export, rollback de publication, WAV invalide/tronqué/tamper, propriétaire/CSRF/expiration, durée audio cumulée, confidentialité et progression |
| Simulations backend | Écrit 39/39 et oral 39/39 ; budgets/délais, ordre, délivrance unique et accès aux transcriptions vérifiés sur fixtures techniques |
| Migrations | Deux nouvelles migrations, six modèles et huit triggers ; retours arrière/réapplication sur SQLite/PostgreSQL jetables en CI ; migrations/contraintes historiques préservées |
| Django / OpenAPI | Aucun changement à générer ; validation stricte sans avertissement après harmonisation des enums. [Schéma](openapi.yaml) |
| Conteneurs | Builds et démarrage frontend/backend réussis en CI ; sentinelles non sensibles exclues de l’image API vérifiées après ajout du dockerignore |
| Compose connecté | PostgreSQL, migrations, proxy Next vers le service API, neuf requêtes de session/CSRF via le frontend et absence de secrets backend dans l’environnement web : job Compose réussi au complément de configuration |
| Frontend existant | Lint, TypeScript, build, sept tests de composants, 22 tests navigateur réussis et deux exclusions historiques de zoom au checkpoint complet ; aucune suppression de test |
| Nouveau parcours HTTP/PostgreSQL | Quinze tests réussis au checkpoint final : cinq parcours sur Chromium, Firefox et WebKit mobile, [job 121373310405](https://github.com/JonathanK-N/fluentia/actions/runs/40261048069/job/121373310405) |
| Accessibilité ciblée | Axe sur lecture clair/sombre et oral entraînement, commandes clavier et focus ; aucune certification globale ou test matériel iOS/Android revendiqué |
| Sécurité de livraison | Pages étudiant/édition avec protections de cadrage/référent, API non conservées en cache, permissions et sessions/CSRF ; pas de pentest ou de test de charge |

PostgreSQL, conteneurs et navigateurs ont été exécutés dans les runners CI ; aucun PostgreSQL/Docker ni build frontend Windows local n’est revendiqué. Les dix exclusions SQLite sont explicites et ne deviennent pas des réussites. Le zoom à 200 % du nouveau parcours n’est pas validé par cette recette.

Les parcours React utilisent réellement le frontend construit, une API HTTP et PostgreSQL. Ils couvrent : inscription/vérification via courrier local, session/profil, lecture et reprise Lot 02 ; oral entraînement avec décodage/lecture du média et transcription ; simulation écrite complète de 39 questions ; simulation orale complète de 39 documents avec fin réelle du signal audio avant réponse ; interface éditoriale avec brouillon, révision et historique. Les fixtures sont des signaux courts et des contenus explicitement synthétiques, pas une évaluation de compréhension ni une attestation pédagogique humaine.

Six captures non retouchées sont livrées : [oral desktop](captures/oral-desktop.png), [oral mobile](captures/oral-mobile.png), [édition desktop](captures/edition-desktop.png), [édition mobile](captures/edition-mobile.png), [résultat écrit 39 questions](captures/lecture-39-resultats-desktop.png), [résultat oral 39 documents](captures/oral-39-resultats-mobile.png). Leur [provenance et empreinte](captures/provenance.json) les rattachent au SHA final applicatif, à la CI et à l’artefact `12624534293`. Les vues orales desktop/mobile ont été inspectées pour la lisibilité, les choix, le lecteur, la transcription et l’absence de débordement apparent ; l’éditeur a été examiné en vue d’ensemble. Les captures très longues sont conservées à leur résolution originale et ne remplacent pas une revue complète des interactions. Le compteur natif des signaux de moins d’une seconde peut afficher 0:00 ; ces fixtures ne sont pas des voix pédagogiques.

## Cycles et anomalies traitées

1. Reprise du Lot 02 validé ; comparaison #3/#5, deux conflits documentaires et liens d’accueil anciens identifiés. Fusion de #5 uniquement après autorisation, branche créée depuis le nouveau dev.
2. Mise en place d’une banque indépendante pour éviter de reconstruire les tables historiques et perdre leurs triggers SQLite. Journal, médias et liens approuvés protégés au niveau SQL.
3. Première validation OpenAPI : collisions entre labels d’enums des DTO et modèles ; contrats harmonisés puis validation stricte réussie.
4. Test multi-navigateurs : un sélecteur confondait le bilan global et sa répartition par difficulté ; sélection précise du résultat global, sans retirer l’assertion ni le parcours.
5. WebKit a présenté une fin de lecture intermittente sur une très courte fixture silencieuse. Préchargement et attente de décodage avant activation du bouton ; fixture sonore PCM non nulle, attente effective de la fin, puis relance complète. Les erreurs de lecture ne sont pas masquées ni remplacées par un simple délai.
6. Revue d’exploitation : exclusion Docker des courriels, bases et médias privés, vérification avec sentinelles ; protections des pages sensibles ; contrôle du budget total des documents audio.
7. Revue des fixtures privilégiées : scripts limités à une base locale explicitement jetable, avec test de refus des cibles non jetables. Les comptes fictifs ne sont pas créés par les migrations ou seeds pédagogiques normaux.
8. Relecture du démarrage Docker : correction de l’origine privée de l’API construite dans le frontend Compose, migration explicite, volume privé nommé et retrait des secrets backend de l’environnement web. La recette Compose PostgreSQL/session/CSRF est réussie et distinguée des six jobs du checkpoint moteur/interfaces ci-dessus.

Les exécutions intermédiaires échouées et celles annulées après remplacement ne sont pas des preuves de réussite du HEAD final. `maxFailures` accélère le retour des premières anomalies ; un job vert doit exécuter tous les quinze parcours. Les snapshots de navigation périmés ne remplacent plus une sélection éditoriale ou des réponses venant d’être enregistrées.

## Pédagogie, sources et originalité

Trois [propositions originales importables](exemples/banque-originale.json), également disponibles par seed idempotent en brouillon, et une [annonce française synthétique avec transcription et provenance](exemples/PROVENANCE_GENERATION.md). Durée instrumentale du WAV : 12,603 s ; empreinte `1d3074795ab2ec0dbb0134d0a44edcdc6f29345e0c317c9443ca37f716489afb`. Ces données ne sont pas une banque validée ni un jeu d’épreuves calibré. Aucune personne fictive n’est attribuée comme relecteur de ces propositions réelles.

Structure consultée sur le domaine primaire [France Éducation international](https://www.france-education-international.fr/test/tcf-canada), avec [manuel indexé](https://www.france-education-international.fr/en/document/manuel-candidat-tcf-es). L’accès direct à certaines ressources est bloqué par ERR-BOT-403 ; les extraits officiels indexés confirment le format de compréhension et la diffusion unique. Aucun contenu propriétaire de Pack Ayoub, FEI ou d’une autre banque n’est repris. Les niveaux de difficulté restent proposés ; aucune conversion en score TCF, CECRL ou NCLC.

Un relecteur humain réel doit vérifier langue, pertinence, distracteurs, réponse, explication, prononciation/débit et droits avant approbation/publication. Le système vérifie une attestation et des comptes distincts ; il ne prouve pas qu’une personne a réellement écouté ou relu. Aucun exercice réel n’est automatiquement publié par un seed ou une génération. Le catalogue vide reste correct tant qu’aucun contenu n’est approuvé par des personnes qualifiées.

## Limites restantes et NO-GO production

- Délivrance unique ne signifie pas DRM : copie/enregistrement par un navigateur autorisé impossibles à empêcher complètement. La réception et l’écoute humaine sont distinctes. Le délai inclut le chargement ; après consommation d’un document, une coupure ou un rechargement de simulation ne permettent pas de le redemander. La gestion humaine des incidents et les accommodations doivent être approfondies avant une ouverture publique.
- WAV PCM uniquement, pas de stockage objet/CDN/transcodage ni d’analyse antivirus exhaustive. Prévoir volume privé persistant, sauvegarde cohérente base/fichiers, contrôle des orphelins, rétention/effacement et rôles DB. L’export JSON ne transporte pas les médias ni ne restaure des approbations ; une migration d’environnement nécessite import privé des fichiers et remappage des UUID.
- Courrier local de développement/recette ; aucun SMTP réel ou fournisseur payant activé. Délivrabilité, reprise d’envois, récupération du mot de passe et changement autonome de courriel restent à terminer.
- Le [check de déploiement](deploy-check.txt) relève toujours `security.W004` (HSTS à définir). TLS/proxy, cache distribué/limitation en frontal, monitoring, tests de charge et audit de sécurité demeurent nécessaires. Les contrôles du conteneur utilisent DEBUG de test et ne valent pas un durcissement production.
- La PR #3 reste indépendante. L’intégration commune des styles, de son dashboard et de ses entrées de connexion doit être autorisée, rapprochée et testée ; ses prototypes ne sont pas présentés comme une interface branchée aux données. Aucune validation Figma ou de sa suite spécifique n’est inventée.
- Expression, IA, coaching adaptatif, paiements, enseignants/multi-tenant et PWA restent des lots distincts. Le Lot 03 ne constitue pas Fluentia complète.

Les décisions de fusion vers dev, de promotion vers tests/main et de déploiement demeurent distinctes. La PR #6 reste en brouillon jusqu’à décision explicite du responsable.
