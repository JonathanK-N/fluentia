# Inventaire et spécification des 62 écrans

Responsable : Jonathan Kakesa. Références locales, données fictives. **Tous les identifiants Figma v2 sont non obtenus.** Les pages et routes ci-dessous sont des cibles de conception, pas des routes métier déployées. Le prototype utilise des fragments locaux, par exemple `http://127.0.0.1:4173/#S01`.

## Contrat commun

1440 px : conteneur 1280 maximum, rail privé de 224 px ; 768 px : rail replié et menu accessible ; 375 px : une colonne, marges 20 px, actions repliables, tableaux dans leur propre région de défilement. Aux tailles intermédiaires, la grille ne doit jamais imposer un minimum plus large que le conteneur. Les boutons gardent une hauteur minimale de 46 px.

Nominal, chargement, vide, erreur, accès refusé et connexion interrompue sont examinables depuis « Examiner les états de conception ». Ce sélecteur est un outil de revue, pas une fonctionnalité produit cible. Le retour réessaie le même écran ; aucun événement réseau métier n’est simulé comme une vraie réussite.

Chaque écran conserve un h1, une navigation identifiée, des labels, un focus visible et des messages textuels. Le changement d’écran place le focus sur son titre. Les écrans légaux restent des structures à rédiger et faire valider ; les écrans administratifs génériques ne simulent pas un CRUD complet.

## Catalogue

| ID | Écran | Route cible | Rôle | Univers | Page Figma cible | Action / destination |
|---|---|---|---|---|---|---|
| P01 | Accueil | `/` | visiteur | Discover | 05 — Public Website | A01 |
| P02 | Fonctionnalités | `/fonctionnalites` | visiteur | Discover | 05 — Public Website | S05 |
| P03 | Notre méthode | `/methode` | visiteur | Discover | 05 — Public Website | A06 |
| P04 | Examens | `/examens` | visiteur | Discover | 05 — Public Website | S09 |
| P05 | Tarifs | `/tarifs` | visiteur | Discover | 05 — Public Website | S19 |
| P06 | Démonstration | `/demo` | visiteur | Discover | 05 — Public Website | S13 |
| P07 | Questions fréquentes | `/faq` | visiteur | Discover | 05 — Public Website | P08 |
| P08 | Contact | `/contact` | visiteur | Discover | 05 — Public Website | confirmation locale |
| P09 | Confidentialité | `/confidentialite` | visiteur | Discover | 05 — Public Website | P08 |
| P10 | Conditions d’utilisation | `/conditions` | visiteur | Discover | 05 — Public Website | P08 |
| P11 | Accessibilité | `/accessibilite` | visiteur | Discover | 05 — Public Website | P08 |
| A01 | Inscription | `/inscription` | visiteur | Learn | 06 — Authentication | A05 |
| A02 | Connexion | `/connexion` | visiteur | Learn | 06 — Authentication | S01 |
| A03 | Mot de passe oublié | `/mot-de-passe-oublie` | visiteur | Learn | 06 — Authentication | confirmation neutre locale |
| A04 | Réinitialisation | `/reinitialisation` | visiteur | Learn | 06 — Authentication | A02 |
| A05 | Vérification du courriel | `/verification-courriel` | visiteur | Learn | 06 — Authentication | A06 |
| A06 | Bienvenue | `/bienvenue` | visiteur | Learn | 06 — Authentication | S01 |
| S01 | Tableau de bord | `/app` | étudiant | Learn | 07 — Student App | S05 |
| S02 | Diagnostic | `/app/diagnostic` | étudiant | Learn | 07 — Student App | choix de compétence |
| S03 | Plan d’étude | `/app/plan` | étudiant | Learn | 07 — Student App | S05 |
| S04 | Catalogue | `/app/catalogue` | étudiant | Learn | 07 — Student App | séance sélectionnée |
| S05 | Compréhension orale | `/app/oral` | étudiant | Learn | 07 — Student App | S22 |
| S06 | Compréhension écrite | `/app/lecture` | étudiant | Learn | 07 — Student App | S22 |
| S07 | Expression écrite | `/app/ecriture` | étudiant | Learn | 07 — Student App | S23 |
| S08 | Expression orale | `/app/expression-orale` | étudiant | Learn | 07 — Student App | S13 |
| S09 | Examens blancs | `/app/examens` | étudiant | Learn | 07 — Student App | S10 |
| S10 | Session d’examen | `/app/examens/session` | étudiant | Learn | 07 — Student App | S11 |
| S11 | Résultats | `/app/resultats` | étudiant | Learn | 07 — Student App | S03 |
| S12 | Coach | `/app/coach` | étudiant | Learn | 07 — Student App | séance ciblée |
| S13 | Studio vocal | `/app/studio` | étudiant | Voice | 08 — Voice Studio | S24 |
| S14 | Rédaction et brouillons | `/app/redaction` | étudiant | Learn | 07 — Student App | S07 |
| S15 | Progression | `/app/progression` | étudiant | Learn | 07 — Student App | tableau équivalent |
| S16 | Historique | `/app/historique` | étudiant | Learn | 07 — Student App | S22 / S23 |
| S17 | Calendrier | `/app/calendrier` | étudiant | Learn | 07 — Student App | séance sélectionnée |
| S18 | Notifications | `/app/notifications` | étudiant | Learn | 07 — Student App | marquer comme lu |
| S19 | Abonnement | `/app/abonnement` | étudiant | Learn | 07 — Student App | confirmation sans transaction |
| S20 | Profil | `/app/profil` | étudiant | Learn | 07 — Student App | confirmation locale |
| S21 | Paramètres | `/app/parametres` | étudiant | Learn | 07 — Student App | confirmation locale |
| S22 | Correction | `/app/correction` | étudiant | Learn | 07 — Student App | S05 |
| S23 | Retour sur la rédaction | `/app/feedback` | étudiant | Learn | 07 — Student App | S07 |
| S24 | Rapport de séance orale | `/app/rapport-oral` | étudiant | Learn | 07 — Student App | S03 |
| T01 | Espace enseignant | `/enseignant` | enseignant | Learn | 09 — Teachers & Schools | T02 |
| T02 | Classes | `/enseignant/classes` | enseignant | Learn | 09 — Teachers & Schools | T04 |
| T03 | Étudiants | `/enseignant/etudiants` | enseignant | Learn | 09 — Teachers & Schools | T05 |
| T04 | Devoirs | `/enseignant/devoirs` | enseignant | Learn | 09 — Teachers & Schools | confirmation d’attribution |
| T05 | Corrections | `/enseignant/corrections` | enseignant | Learn | 09 — Teachers & Schools | confirmation de retour |
| T06 | Statistiques de classe | `/enseignant/statistiques` | enseignant | Learn | 09 — Teachers & Schools | tableau équivalent |
| E01 | Établissement | `/etablissement` | gestionnaire | Learn | 09 — Teachers & Schools | E02 |
| E02 | Membres | `/etablissement/membres` | gestionnaire | Learn | 09 — Teachers & Schools | confirmation illustrative |
| E03 | Groupes | `/etablissement/groupes` | gestionnaire | Learn | 09 — Teachers & Schools | confirmation illustrative |
| E04 | Licences | `/etablissement/licences` | gestionnaire | Learn | 09 — Teachers & Schools | confirmation illustrative |
| E05 | Facturation établissement | `/etablissement/facturation` | gestionnaire | Learn | 09 — Teachers & Schools | factures fictives |
| M01 | Administration | `/admin` | administrateur | Learn | 10 — Administration | M03 |
| M02 | Utilisateurs | `/admin/utilisateurs` | administrateur | Learn | 10 — Administration | confirmation illustrative |
| M03 | Contenus | `/admin/contenus` | administrateur | Learn | 10 — Administration | M06 |
| M04 | Questions | `/admin/questions` | administrateur | Learn | 10 — Administration | liste de questions |
| M05 | Examens | `/admin/examens` | administrateur | Learn | 10 — Administration | structure fictive |
| M06 | Validations | `/admin/validations` | administrateur | Learn | 10 — Administration | validation / retour au brouillon |
| M07 | Modèles d’évaluation | `/admin/modeles` | administrateur | Learn | 10 — Administration | critères non calibrés |
| M08 | Paiements | `/admin/paiements` | administrateur | Learn | 10 — Administration | opérations fictives |
| M09 | Support | `/admin/support` | administrateur | Learn | 10 — Administration | tickets fictifs |
| M10 | Paramètres administration | `/admin/parametres` | administrateur | Learn | 10 — Administration | confirmation locale |

## Fiches de conception

### P01 — Accueil

- Intention : Choisir un premier parcours sans pression.
- Hiérarchie : navigation de l’univers, titre « Maîtrisez le français, allez plus loin. », contenu `landing`, action principale `A01`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### P02 — Fonctionnalités

- Intention : Explorer les outils sans promettre de résultats officiels.
- Hiérarchie : navigation de l’univers, titre « Quatre compétences, un parcours cohérent. », contenu `features`, action principale `S05`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### P03 — Notre méthode

- Intention : Comprendre diagnostic, entraînement et révision.
- Hiérarchie : navigation de l’univers, titre « Un rythme qui vous ressemble. », contenu `method`, action principale `A06`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### P04 — Examens

- Intention : Distinguer entraînement, examen blanc et épreuve officielle.
- Hiérarchie : navigation de l’univers, titre « Se préparer avec des repères clairs. », contenu `exams`, action principale `S09`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### P05 — Tarifs

- Intention : Comparer des formules de démonstration ; prix à valider.
- Hiérarchie : navigation de l’univers, titre « Choisir votre accompagnement. », contenu `pricing`, action principale `S19`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### P06 — Démonstration

- Intention : Découvrir une simulation sans compte ni microphone.
- Hiérarchie : navigation de l’univers, titre « Essayez une séance guidée. », contenu `demo`, action principale `S13`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### P07 — Questions fréquentes

- Intention : Trouver une réponse et contacter le support.
- Hiérarchie : navigation de l’univers, titre « Les réponses, simplement. », contenu `faq`, action principale `P08`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### P08 — Contact

- Intention : Simuler une demande sans transmission de données.
- Hiérarchie : navigation de l’univers, titre « Parlons de votre projet. », contenu `contact`, action principale `confirmation locale`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### P09 — Confidentialité

- Intention : Structure de notice à faire valider ; aucun texte juridique approuvé.
- Hiérarchie : navigation de l’univers, titre « Vos données, vos choix. », contenu `legal`, action principale `P08`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### P10 — Conditions d’utilisation

- Intention : Structure contractuelle à faire valider avant publication.
- Hiérarchie : navigation de l’univers, titre « Un cadre d’utilisation clair. », contenu `legal`, action principale `P08`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### P11 — Accessibilité

- Intention : Présenter objectif, limites connues et canal de signalement.
- Hiérarchie : navigation de l’univers, titre « Une préparation ouverte à chacun. », contenu `legal`, action principale `P08`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### A01 — Inscription

- Intention : Créer un compte simulé avec consentement explicite.
- Hiérarchie : navigation de l’univers, titre « Votre prochain chapitre commence ici. », contenu `signup`, action principale `A05`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### A02 — Connexion

- Intention : Accéder à un espace fictif sans authentification réelle.
- Hiérarchie : navigation de l’univers, titre « Heureux de vous retrouver. », contenu `login`, action principale `S01`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### A03 — Mot de passe oublié

- Intention : Présenter une confirmation neutre, sans révéler un compte existant.
- Hiérarchie : navigation de l’univers, titre « Retrouver votre espace. », contenu `recover`, action principale `confirmation neutre locale`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### A04 — Réinitialisation

- Intention : Gérer lien expiré et confirmation de mot de passe.
- Hiérarchie : navigation de l’univers, titre « Un nouveau départ sécurisé. », contenu `reset`, action principale `A02`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### A05 — Vérification du courriel

- Intention : Simuler renvoi, lien expiré et vérification.
- Hiérarchie : navigation de l’univers, titre « Vérifiez votre courriel. », contenu `verify`, action principale `A06`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### A06 — Bienvenue

- Intention : Choisir objectif, disponibilité et diagnostic facultatif.
- Hiérarchie : navigation de l’univers, titre « Construisons votre rythme. », contenu `onboarding`, action principale `S01`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S01 — Tableau de bord

- Intention : Choisir une action utile et reprendre une séance.
- Hiérarchie : navigation de l’univers, titre « Une petite étape, chaque jour. », contenu `dashboard`, action principale `S05`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S02 — Diagnostic

- Intention : Diagnostic illustratif sans prédiction de score officiel.
- Hiérarchie : navigation de l’univers, titre « Trouvons votre point de départ. », contenu `diagnostic`, action principale `choix de compétence`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S03 — Plan d’étude

- Intention : Ajuster la charge et déplacer une séance.
- Hiérarchie : navigation de l’univers, titre « Votre semaine, à votre rythme. », contenu `plan`, action principale `S05`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S04 — Catalogue

- Intention : Filtrer par compétence et durée illustrative.
- Hiérarchie : navigation de l’univers, titre « La bonne séance, au bon moment. », contenu `catalog`, action principale `séance sélectionnée`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S05 — Compréhension orale

- Intention : QCM fictif avec transcription de démonstration.
- Hiérarchie : navigation de l’univers, titre « Écouter, comprendre, choisir. », contenu `audio-question`, action principale `S22`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S06 — Compréhension écrite

- Intention : Texte fictif, question et correction expliquée.
- Hiérarchie : navigation de l’univers, titre « Lire avec intention. », contenu `reading`, action principale `S22`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S07 — Expression écrite

- Intention : Rédiger un texte fictif et demander un retour simulé.
- Hiérarchie : navigation de l’univers, titre « Faire entendre vos idées. », contenu `writing`, action principale `S23`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S08 — Expression orale

- Intention : Choisir une tâche et entrer dans le studio simulé.
- Hiérarchie : navigation de l’univers, titre « Prendre la parole avec confiance. », contenu `speaking`, action principale `S13`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S09 — Examens blancs

- Intention : Choisir une simulation sans prétendre reproduire un examen certifié.
- Hiérarchie : navigation de l’univers, titre « Vous préparer au jour J. », contenu `mock-list`, action principale `S10`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S10 — Session d’examen

- Intention : Durée illustrative ; quitter exige confirmation.
- Hiérarchie : navigation de l’univers, titre « Une question à la fois. », contenu `exam`, action principale `S11`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S11 — Résultats

- Intention : Afficher des repères fictifs, jamais un niveau TCF certifié.
- Hiérarchie : navigation de l’univers, titre « Comprendre pour avancer. », contenu `results`, action principale `S03`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S12 — Coach

- Intention : Conseils prédéfinis, aucune IA connectée.
- Hiérarchie : navigation de l’univers, titre « Une piste claire pour la suite. », contenu `coach`, action principale `séance ciblée`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S13 — Studio vocal

- Intention : Simulation graphique ; aucun accès au microphone.
- Hiérarchie : navigation de l’univers, titre « Votre voix a de l’avenir. », contenu `voice`, action principale `S24`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S14 — Rédaction et brouillons

- Intention : Brouillon temporaire en mémoire, perdu au rechargement.
- Hiérarchie : navigation de l’univers, titre « Laissez vos idées prendre forme. », contenu `drafts`, action principale `S07`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S15 — Progression

- Intention : Données fictives, tableau équivalent au graphique.
- Hiérarchie : navigation de l’univers, titre « Voir le chemin parcouru. », contenu `progress`, action principale `tableau équivalent`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S16 — Historique

- Intention : Consulter les séances fictives et leurs retours.
- Hiérarchie : navigation de l’univers, titre « Retrouver vos apprentissages. », contenu `history`, action principale `S22 / S23`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S17 — Calendrier

- Intention : Agenda en liste utilisable au clavier.
- Hiérarchie : navigation de l’univers, titre « Un rendez-vous avec vous-même. », contenu `calendar`, action principale `séance sélectionnée`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S18 — Notifications

- Intention : Marquer comme lu et régler les préférences simulées.
- Hiérarchie : navigation de l’univers, titre « L’essentiel, au bon moment. », contenu `notifications`, action principale `marquer comme lu`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S19 — Abonnement

- Intention : Changement et annulation simulés, aucun paiement.
- Hiérarchie : navigation de l’univers, titre « Garder la maîtrise de votre formule. », contenu `billing`, action principale `confirmation sans transaction`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S20 — Profil

- Intention : Modifier un profil fictif sans données sensibles.
- Hiérarchie : navigation de l’univers, titre « Un espace qui vous ressemble. », contenu `profile`, action principale `confirmation locale`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S21 — Paramètres

- Intention : Préférences locales temporaires et suppression simulée.
- Hiérarchie : navigation de l’univers, titre « Votre confort, vos préférences. », contenu `settings`, action principale `confirmation locale`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S22 — Correction

- Intention : Expliquer une réponse de démonstration.
- Hiérarchie : navigation de l’univers, titre « Chaque réponse ouvre une piste. », contenu `correction`, action principale `S05`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S23 — Retour sur la rédaction

- Intention : Retour prédéfini et explicitement non évalué par une IA.
- Hiérarchie : navigation de l’univers, titre « Une idée, puis une amélioration. », contenu `feedback`, action principale `S07`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### S24 — Rapport de séance orale

- Intention : Rapport fictif sans analyse ni enregistrement audio.
- Hiérarchie : navigation de l’univers, titre « Faire le point, sereinement. », contenu `oral-report`, action principale `S03`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### T01 — Espace enseignant

- Intention : Accéder aux classes et corrections en attente.
- Hiérarchie : navigation de l’univers, titre « Accompagner chaque progression. », contenu `teacher-dashboard`, action principale `T02`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### T02 — Classes

- Intention : Ouvrir une classe fictive, sans données d’élèves réels.
- Hiérarchie : navigation de l’univers, titre « Votre classe, en un regard. », contenu `classes`, action principale `T04`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### T03 — Étudiants

- Intention : État des apprentissages et filtres simulés.
- Hiérarchie : navigation de l’univers, titre « Un suivi attentif et structuré. », contenu `students`, action principale `T05`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### T04 — Devoirs

- Intention : Préparer et attribuer un devoir fictif.
- Hiérarchie : navigation de l’univers, titre « Donner du sens à l’entraînement. », contenu `assignment`, action principale `confirmation d’attribution`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### T05 — Corrections

- Intention : Commentaire et publication simulés, sans note officielle.
- Hiérarchie : navigation de l’univers, titre « Un retour qui fait progresser. », contenu `review`, action principale `confirmation de retour`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### T06 — Statistiques de classe

- Intention : Agrégats fictifs, aucun classement nominatif réel.
- Hiérarchie : navigation de l’univers, titre « Repérer les besoins du groupe. », contenu `teacher-stats`, action principale `tableau équivalent`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### E01 — Établissement

- Intention : Synthèse des accès et groupes fictifs.
- Hiérarchie : navigation de l’univers, titre « Un cadre pour apprendre ensemble. », contenu `school-dashboard`, action principale `E02`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### E02 — Membres

- Intention : Invitation et révocation simulées.
- Hiérarchie : navigation de l’univers, titre « Les bonnes personnes, les bons accès. », contenu `members`, action principale `confirmation illustrative`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### E03 — Groupes

- Intention : Affectation d’un groupe avec vérification de périmètre.
- Hiérarchie : navigation de l’univers, titre « Organiser les apprentissages. », contenu `groups`, action principale `confirmation illustrative`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### E04 — Licences

- Intention : Attribution fictive, sans achat.
- Hiérarchie : navigation de l’univers, titre « Des accès lisibles et maîtrisés. », contenu `licenses`, action principale `confirmation illustrative`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### E05 — Facturation établissement

- Intention : Factures fictives, aucune donnée bancaire ni transaction.
- Hiérarchie : navigation de l’univers, titre « Votre facturation, en toute clarté. », contenu `school-billing`, action principale `factures fictives`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### M01 — Administration

- Intention : Supervision fictive et accès aux validations.
- Hiérarchie : navigation de l’univers, titre « Piloter avec précision. », contenu `admin-dashboard`, action principale `M03`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### M02 — Utilisateurs

- Intention : Rôles fictifs et confirmation des actions sensibles.
- Hiérarchie : navigation de l’univers, titre « Gérer les accès avec discernement. », contenu `users`, action principale `confirmation illustrative`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### M03 — Contenus

- Intention : Brouillon, relecture et publication simulée.
- Hiérarchie : navigation de l’univers, titre « Des ressources prêtes à apprendre. », contenu `content`, action principale `M06`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### M04 — Questions

- Intention : Versionner consigne, distracteurs et explication fictifs.
- Hiérarchie : navigation de l’univers, titre « La qualité commence par une question. », contenu `questions`, action principale `liste de questions`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### M05 — Examens

- Intention : Structure fictive et vérification de complétude.
- Hiérarchie : navigation de l’univers, titre « Assembler un parcours cohérent. », contenu `admin-exams`, action principale `structure fictive`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### M06 — Validations

- Intention : Accepter ou renvoyer un contenu avec commentaire.
- Hiérarchie : navigation de l’univers, titre « Relire avant de publier. », contenu `approval`, action principale `validation / retour au brouillon`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### M07 — Modèles d’évaluation

- Intention : Critères de travail, non calibrés et non officiels.
- Hiérarchie : navigation de l’univers, titre « Des critères explicites. », contenu `rubric`, action principale `critères non calibrés`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### M08 — Paiements

- Intention : Données fictives ; aucune opération de remboursement réelle.
- Hiérarchie : navigation de l’univers, titre « Comprendre chaque opération. », contenu `payments`, action principale `opérations fictives`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### M09 — Support

- Intention : Ticket fictif, sans coordonnées personnelles.
- Hiérarchie : navigation de l’univers, titre « Une réponse attentive. », contenu `support`, action principale `tickets fictifs`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.

### M10 — Paramètres administration

- Intention : Paramètres simulés ; secrets et clés exclus de la maquette.
- Hiérarchie : navigation de l’univers, titre « Un fonctionnement sous contrôle. », contenu `admin-settings`, action principale `confirmation locale`, retours et états.
- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.
- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.
- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.
- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.
- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.
