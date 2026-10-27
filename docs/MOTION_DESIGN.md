# Motion design

Responsable : Jonathan Kakesa.

## Accueil Frontend 02

**Pilotes v3 :** le hero est statique, sans repère de lecture animé. Les Reveal publics utilisent l’option `subtle` : opacité 0,97 → 1, 180 ms, sans translation. Voice réagit une fois pendant 180 ms aux états écoute/parole ; `repeat: 0`, aucun mouvement au repos ou pendant l’analyse. Les gardes hors écran, visibilité, pause et mouvement réduit sont conservées. Le catalogue garde son Reveal par défaut. Le détail immersif ci-dessous décrit le checkpoint antérieur ; résultats actuels dans [UX_REVIEW.md](UX_REVIEW.md).

Le hero utilise une apparition ponctuelle de 650 ms, sans masquer le HTML initial. Le repère de lecture suit useScroll ; les sections réutilisent Reveal. VoiceOrb anime seulement rotation/échelle avec Motion, sur une sphère CSS. useInView et visibilitychange suspendent les boucles hors écran/page masquée. Les états pause/fin/erreur arrêtent également la sphère.

`Providers` expose une pause globale et observe la media query avec useSyncExternalStore, y compris ses changements à chaud. MotionConfig reçoit always si réduction ou pause, sinon never ; la politique système est centralisée. Le hook useReducedMotion de la version installée conserve sa valeur initiale et ne réactualise pas React sur changement système : cette limite a été constatée en recette, d’où l’abonnement explicite. Le snapshot serveur false et le DOM initial stable évitent une divergence d’hydratation ; CSS applique aussi la media query.

Les animations/transitions/défilements CSS sont neutralisés sous réduction/pause. Le repère reste dans le HTML et est masqué par CSS, sans retirer conditionnellement un nœud au premier rendu client. Texte et commandes expliquent les états sans dépendre du mouvement. Aucun WebGL ni média à charger ; aucun gain de performance chiffré non mesuré. Sources et arbitrages dans [ADR 003](DECISIONS/003-accueil-discover.md). Résultats dans [FRONTEND_02.md](FRONTEND_02.md).

## Socle initial, conservé ci-dessous

`Providers` applique `MotionConfig reducedMotion="user"`. `Reveal` utilise `useReducedMotion`, un déclenchement ponctuel dans le viewport et une transition de 350 ms. Le contenu SSR reste visible avec `initial={false}`. Les transitions CSS utilisent 180 ms. Les skeletons cessent après trois cycles ; les éléments décoratifs vocaux sont statiques.

`prefers-reduced-motion: reduce` désactive animations, transitions et défilement doux. Les cartes se déplacent seulement sur écran large sans réduction demandée. Aucun canvas, média automatique, 3D ou parallaxe continue n’est nécessaire. Les transitions de page élaborées et visualisations vocales branchées sur l’audio restent à développer selon des usages validés. Les écrans d’examen futurs doivent éviter la décoration animée.

Référence : [Accessibilité Motion](https://motion.dev/docs/react-accessibility).
