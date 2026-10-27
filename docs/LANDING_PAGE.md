# Accueil public — Frontend 02, pilote v3

Responsable et propriétaire : Jonathan Kakesa. Branche `frontend/mission-02-landing`, base dev consolidée `2e1ed545540e8ea5fb0c540475ce7e146fcf315f` après les deux autorisations explicites.

## Périmètre implémenté

| Section | Composant et comportement |
|---|---|
| Navigation | Header conserve le catalogue ; LandingNavigation sur `/`, menu natif, Échap/retour au résumé, pause globale du mouvement |
| Hero | Slogan approuvé, rendu statique, aperçu de parcours et lien vers le pilote étudiant ; aucune sphère décorative |
| Quatre compétences | CompetencyCard réutilise Card et les contenus existants ; icônes géométriques, sans substitution du logo |
| Coach | CoachDemo affiche un conseil prédéfini et réversible, sans traitement distant |
| Examinateur oral | VoiceDemo : sept états manuels, pause/reprise, erreur, fin et retour du focus ; aucun microphone ni son |
| Parcours | Diagnostic → programme → entraînement → simulation → progression ; méthode envisagée, examens non disponibles |
| Aperçu étudiant | Résumé utile et lien `/apercu/etudiant` ; état vide par défaut, exemple fictif uniquement sur demande |
| Tarifs | Configuration `features/landing/content.ts`, trois prix null ; « Prix à confirmer », aucune vente |
| FAQ | Details/summary natifs, réponses présentes dans le HTML sans JavaScript |
| Appel final | Disponibilité réelle expliquée ; liens vers démo et aperçu, aucune collecte de coordonnées |
| Footer | Navigation active, propriétaire réel, conditions/confidentialité/support à venir rendus comme texte |

L’inscription et la connexion pointent vers l’explication de disponibilité, sans formulaire ni fausse route d’authentification. Aucun compte, examen, résultat officiel, paiement ou coach IA réel n’est livré. Le slogan n’a pas valeur de garantie pédagogique.

## Architecture et thèmes

`app/page.tsx` compose des modules dans `features/landing/`. Seuls les comportements nécessitent des composants client. Le contenu SSR reste visible ; sans JavaScript, la FAQ et les ancres fonctionnent, la sphère est statique et un message explique la limite de la démo.

Le repli de chargement est conservé dans `app/design-system/loading.tsx` plutôt qu’à la racine : la page publique ne dépend plus d’un script de révélation de la frontière de chargement pour être lue. Le repli d’erreur global reste en place. La préférence de mouvement est observée de façon réactive et partagée via Providers ; le bouton de pause a un pictogramme SVG décoratif distinct de son libellé visible/accessibilité.

Les primitives, PNG et Poppins existants sont réutilisés. `features/human-centered/pilot.css` applique les rôles pilotes sous `.human-pilot` : blanc, fond clair et texte bleu nuit, même sous préférence système sombre. Le sélecteur de thème reste disponible dans `/design-system`. Le logo PNG officiel clair est sélectionné explicitement pour les pilotes. Le footer détaillé remplace le footer générique sur l’accueil ; l’aperçu étudiant possède son footer compact. Aucun changement global des tokens des 62 références.

## Mouvement et poids

Motion déjà verrouillé à 12.43.0 est réutilisé. La seule sphère se trouve dans Voice, en CSS, sans halo ni orbites ; sa réaction dure 180 ms et ne se répète pas. Aucune dépendance Three.js, image générée, vidéo, WebGL ou média automatique. Les gardes hors viewport, visibilité, mouvement réduit et pause globale sont conservées. Voir [MOTION_DESIGN.md](MOTION_DESIGN.md), [direction v3](DESIGN_DIRECTION_V3.md) et [ADR 003 historique](DECISIONS/003-accueil-discover.md).

## Validation en cours

Sept largeurs et tailles intermédiaires, trois moteurs, axe, clavier, menu, démos, mouvement réduit, sans JavaScript et zoom Chromium sont couverts par la recette. Les résultats exécutés et captures inspectées sont consignés dans [UX_REVIEW.md](UX_REVIEW.md), sans assimiler la CI à une validation visuelle du client. Aucun déploiement ni fusion de Frontend 02 autorisé.
