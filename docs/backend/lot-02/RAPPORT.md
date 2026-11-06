# Rapport de recette — Backend lot 02

Responsable : Jonathan Kakesa. Date de revue : 25 octobre 2026. PR : [#5](https://github.com/JonathanK-N/fluentia/pull/5), en brouillon vers `dev`.

## Décision technique

**GO technique pour revue et fusion vers dev, sous décision explicite du responsable. NO-GO production.** Les six jobs des deux exécutions du checkpoint applicatif sont réussis, y compris le parcours navigateur connecté à PostgreSQL. La PR #5 demeure en brouillon ; aucune fusion automatique. Le courrier réel, la validation pédagogique, l’exploitation et les autres lots ne sont pas déclarés terminés.

## Sources et autorisations

- PR #4 fusionnée après accord explicite du responsable ; commit de fusion/base du lot 02 : `3b0a1124d6543640a52a2a45c8139afa97104b90`.
- Dernier commit du lot 01 validé avant fusion : `72f6eb80455ecec771711b174eee795a7af2c9d3`, contrôles [40157132721](https://github.com/JonathanK-N/fluentia/actions/runs/40157132721) et [40157129889](https://github.com/JonathanK-N/fluentia/actions/runs/40157129889) réussis.
- Checkpoint applicatif du lot 02 examiné : `80b11e804be67efa3aafdb8c53385a350183532b`, contrôles [push 40215597773](https://github.com/JonathanK-N/fluentia/actions/runs/40215597773) et [PR 40215602708](https://github.com/JonathanK-N/fluentia/actions/runs/40215602708) réussis. Le commit ajoutant ce rapport est distinct ; ses propres contrôles et le HEAD livré sont indiqués dans la PR.
- Branche : `backend/lot-02-parcours-etudiant`. PR #3 préservée, ouverte en brouillon au SHA `1d4ffbcfaa0ba7228c0951f32932eb7bf55269b7`. Aucun changement sur sa branche, `main` ou `tests`, aucun déploiement Railway.

## Résultats obtenus

| Contrôle | Preuve réellement obtenue |
|---|---|
| Backend local SQLite | 60 tests découverts, 53 exécutés et réussis, sept courses PostgreSQL exclues ; aucun test retiré. Exécution au checkpoint `785286e232cc6b1dc68ec3107224f61c407b80c0`, backend inchangé au checkpoint applicatif final |
| Backend PostgreSQL 16 | 60 réussis, sans exclusion, [job 121235931981](https://github.com/JonathanK-N/fluentia/actions/runs/40215597773/job/121235931981) |
| Backend SQLite CI | 53 réussis et sept exclusions, [job 121235931954](https://github.com/JonathanK-N/fluentia/actions/runs/40215597773/job/121235931954) |
| Migrations comptes | `0001` à `0003`, retour à `0001`, réapplication à `0003` réussis sur SQLite et PostgreSQL éphémères |
| Garde-fous examens | Retour de `0002` à `0001`, réapplication de `0002`, tests d’intégrité et de concurrence conservés |
| Contrats | `check`, absence de dérive `makemigrations --check`, schéma OpenAPI strict réussis localement et en CI |
| Dépendances | Audits applicatifs backend/frontend sans vulnérabilité connue lors de la CI de ce checkpoint ; aucun nouveau paquet applicatif ajouté |
| Docker | Builds et contrôles de démarrage frontend/backend réussis en CI ; aucun Docker local ou déploiement production revendiqué |
| Frontend existant | Lint, TypeScript, build, sept tests de composants et 22 tests navigateur réussis ; deux exclusions de zoom conservées, [job web](https://github.com/JonathanK-N/fluentia/actions/runs/40215597773/job/121235932057). Ce sont les tests du dev intégré, pas ceux de la PR #3 |
| Nouveau parcours HTTP/PostgreSQL | Trois parcours complets réussis : Chromium, Firefox et WebKit mobile 390 × 844, [job 121235932126](https://github.com/JonathanK-N/fluentia/actions/runs/40215597773/job/121235932126) |

PostgreSQL et Docker sont vérifiés en CI, pas sur la machine Windows locale. L’installation npm locale a été interrompue après une attente réseau prolongée ; aucun build frontend Windows n’est revendiqué. Le [schéma validé](openapi.yaml) est aussi conservé comme artefact du job backend. Les captures du parcours sont présentes dans l’artefact `parcours-etudiant-postgresql` ([12607246976](https://github.com/JonathanK-N/fluentia/actions/runs/40215597773/artifacts/12607246976)), sans boîte de courrier ni traces réseau. Les résultats des checkpoints anciens ne sont pas attribués artificiellement au HEAD documentaire suivant. [Synthèse des deux CI](ci-summary.json).

Le parcours part de l’inscription dans React : lecture du message réellement généré dans la boîte locale, vérification du lien, connexion et profil, démarrage d’une lecture, refus sans CSRF, refus des résultats anticipés, isolation d’un second étudiant authentifié, coupure réseau sur une sauvegarde puis nouvelle tentative au clavier, conservation du focus, rechargement et reprise depuis le catalogue, soumission, résultat et explication après rechargement, puis déconnexion. L’audit axe WCAG 2/2.1 AA n’a relevé aucune violation sur l’écran de lecture stabilisé en clair et sombre dans ces trois environnements ; cela ne remplace pas une certification globale d’accessibilité.

Six captures originales sont versionnées, sans retouche : [lecture desktop](captures/lecture-desktop.png), [lecture desktop sombre](captures/lecture-sombre-desktop.png), [résultat desktop](captures/resultat-desktop.png), [lecture mobile](captures/lecture-mobile.png), [lecture mobile sombre](captures/lecture-sombre-mobile.png), [résultat mobile](captures/resultat-mobile.png). Inspection visuelle effectuée sur lecture desktop, lecture mobile sombre et résultat mobile : contenu lisible, choix et bouton accessibles, absence de débordement horizontal. La [provenance avec empreintes](captures/provenance.json) relie ces images au checkpoint et à l’artefact CI. Les images représentent une fixture technique, pas une question validée par une personne qualifiée.

## Garanties examinées

Inscription avec hachage et validation du mot de passe, unicité du courriel sans casse, réponse d’inscription générique, connexion sans divulgation d’existence, refus des comptes inactifs, rotation de session et déconnexion. Session HttpOnly et SameSite=Lax, durée serveur limitée, cookie expirant à la fermeture du navigateur. CSRF obligatoire sur les mutations anonymes et authentifiées ; origine étrangère refusée même avec un jeton valide. Profils personnels sans possibilité de changer les rôles ni de lire un autre compte.

Vérification par jeton aléatoire stocké sous empreinte, expirant, consommable une seule fois et lié à l’adresse destinataire. Renouvellement avec délai minimal ; l’ancien lien est invalidé. Une modification administrative du courriel ne conserve pas le statut vérifié. Deux connexions concurrentes ne peuvent ni consommer le même lien deux fois ni créer deux comptes avec le même courriel à la casse près.

Les tentatives et corrigés restent privés. Un compte non vérifié ne démarre pas d’exercice. Aucun corrigé avant soumission ; correction déterministe et soumission idempotente conservées, expiration persistante sans auto-correction. Reprise via la liste du compte connecté et données persistées en base. Les libellés des réponses et explications sont délivrés uniquement dans le résultat soumis. Les réponses privées des routes de comptes et de tentatives portent une directive de non-conservation en cache.

## Cycles de correction

1. Migration initiale : index d’unicité supprimé lors d’une reconstruction ultérieure de `auth_user` sur SQLite. Dépendance explicite vers la dernière migration auth ajoutée ; test de doublon direct en base réussi ensuite.
2. Première CI : avertissement de lint sur l’export de configuration Next ; configuration nommée. Boucle Next/Django due aux slashs API ; conservation des URL entrantes et destination Django terminée par slash. Origine frontend configurée explicitement pour CSRF derrière la passerelle.
3. Recette réelle : le choix radio attendait la sauvegarde et ne conservait pas son état après le clic immédiat. Sélection immédiate avec état en cours, confirmation serveur puis restauration du choix antérieur en cas d’échec ; scénario réseau ajouté.
4. Revue de sécurité : vérification attachée à l’adresse destinataire, invalidation après modification administrative et tests de non-régression. Deux courses PostgreSQL supplémentaires.
5. Recette multi-moteurs : sélection précise de l’alerte applicative, distincte de l’annonceur Next ; attente de la fin de navigation et titres explicites ; suppression de l’interpolation de couleur des boutons étudiants pour préserver le contraste pendant un changement de thème. Les audits ne sont pas désactivés. Pagination du catalogue et de l’historique, filtre de compétence et protection de cache des routes `/api/v1/` ajoutés et revérifiés.

Les CI intermédiaires échouées ou annulées ne constituent pas des preuves positives. Les exécutions périmées encore en cours ont été arrêtées après remplacement par un checkpoint plus récent.

## Limites et décision humaine restante

Le backend de courriel reste local (mémoire par défaut, fichiers privés en recette). Aucun message n’est envoyé à une adresse réelle et aucun fournisseur payant n’est activé. Livraison externe, reprise fiable des envois, récupération du mot de passe et changement autonome du courriel restent à traiter avant ouverture publique.

Les textes du seed et les [trois propositions originales](CONTENU_ORIGINAL.md) nécessitent une relecture humaine distincte de l’auteur. Une fixture synthétique publiée sur la base de recette permet les tests ; elle n’est ni une banque validée ni une validation pédagogique réelle. Le catalogue d’une base réelle reste vide tant qu’aucun contenu n’a été validé et publié. La compréhension écrite n’est pas un examen officiel complet de 39 questions dans ce parcours court.

Le contrôle de déploiement conserve l’avertissement HSTS du socle : voir [sortie brute](deploy-check.txt). TLS/proxy, protection distribuée des requêtes, rétention/effacement et séparation des rôles de base restent à définir. Pas de test de charge, audit de pénétration, délivrabilité e-mail ou recette de production. Le nouveau parcours n’a pas fait l’objet d’un test de zoom navigateur à 200 % ; les deux exclusions de la suite historique restent déclarées. La recette ne prétend pas couvrir chaque appareil, lecteur d’écran ou interruption possible.

La compréhension orale, l’expression, l’IA, le paiement, les espaces enseignants et la PWA restent les étapes suivantes de la [feuille de route](../lot-01/sources/ROADMAP_BACKEND.md). Le lot 02 ne constitue pas l’implémentation complète de Fluentia. Toute fusion vers dev puis promotion vers tests/main et tout déploiement nécessitent une décision distincte.
