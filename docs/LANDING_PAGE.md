# Accueil Discover — Frontend 02

Responsable et propriétaire : Jonathan Kakesa. Branche `frontend/mission-02-landing`, base dev consolidée `2e1ed545540e8ea5fb0c540475ce7e146fcf315f` après les deux autorisations explicites.

## Périmètre implémenté

| Section | Composant et comportement |
|---|---|
| Navigation | Header conserve le catalogue ; LandingNavigation sur `/`, menu natif, Échap/retour au résumé, pause globale du mouvement |
| Hero | Slogan approuvé, sphère décorative, apparition ponctuelle et repère de lecture Motion |
| Quatre compétences | CompetencyCard réutilise Card et les contenus existants ; icônes géométriques, sans substitution du logo |
| Coach | CoachDemo affiche un conseil prédéfini et réversible, sans traitement distant |
| Examinateur oral | VoiceDemo : sept états manuels, pause/reprise, erreur, fin et retour du focus ; aucun microphone ni son |
| Parcours | Diagnostic → programme → entraînement → simulation → progression ; méthode envisagée, examens non disponibles |
| Aperçu étudiant | DashboardPreview : zone Learn claire et données explicitement fictives ; composants Card, Badge et Progress |
| Tarifs | Configuration `features/landing/content.ts`, trois prix null ; « Prix à confirmer », aucune vente |
| FAQ | Details/summary natifs, réponses présentes dans le HTML sans JavaScript |
| Appel final | Disponibilité réelle expliquée ; liens vers démo et aperçu, aucune collecte de coordonnées |
| Footer | Navigation active, propriétaire réel, conditions/confidentialité/support à venir rendus comme texte |

L’inscription et la connexion pointent vers l’explication de disponibilité, sans formulaire ni fausse route d’authentification. Aucun compte, examen, résultat officiel, paiement ou coach IA réel n’est livré. Le slogan n’a pas valeur de garantie pédagogique.

## Architecture et thèmes

`app/page.tsx` compose des modules dans `features/landing/`. Seuls les comportements nécessitent des composants client. Le contenu SSR reste visible ; sans JavaScript, la FAQ et les ancres fonctionnent, la sphère est statique et un message explique la limite de la démo.

Les primitives, tokens, PNG et Poppins existants sont réutilisés. Les sélecteurs Discover et Learn réemploient les mêmes déclarations sémantiques de globals.css, sans copie de palette. L’accueil Discover reste sombre ; le sélecteur système/manuel reste disponible dans `/design-system`. Le logo officiel sombre est sélectionné explicitement pour Discover. Le footer détaillé remplace le footer générique uniquement sur l’accueil.

## Mouvement et poids

Motion déjà verrouillé à 12.43.0 est réutilisé. Sphères en gradients CSS : aucune dépendance Three.js, image générée, vidéo, WebGL ou média automatique. Les boucles sont arrêtées hors viewport, si la page est masquée, sous mouvement réduit ou pause globale. Voir [MOTION_DESIGN.md](MOTION_DESIGN.md) et [ADR 003](DECISIONS/003-accueil-discover.md).

## Validation en cours

Sept largeurs et tailles intermédiaires, trois moteurs, axe, clavier, menu, démos, mouvement réduit, sans JavaScript et zoom Chromium sont couverts par la recette ajoutée. Les résultats et captures inspectées seront consignés dans [FRONTEND_02.md](FRONTEND_02.md) après exécution, sans assimiler la CI à une validation visuelle complète. Aucun déploiement ni fusion de Frontend 02 autorisé.
