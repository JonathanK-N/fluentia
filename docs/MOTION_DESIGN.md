# Motion design

Responsable : Jonathan Kakesa.

## Accueil Frontend 02

Le hero utilise une apparition ponctuelle de 650 ms, sans masquer le HTML initial. Le repère de lecture suit useScroll ; les sections réutilisent Reveal. VoiceOrb anime seulement rotation/échelle avec Motion, sur une sphère CSS. useInView et visibilitychange suspendent les boucles hors écran/page masquée. Les états pause/fin/erreur arrêtent également la sphère.

`Providers` expose une pause globale ; MotionConfig passe à always et les animations/transitions/défilements CSS sont neutralisés. `prefers-reduced-motion` garde les sphères statiques et supprime le repère de lecture. Texte et commandes expliquent les états sans dépendre du mouvement. Aucun WebGL ni média à charger ; aucun gain de performance chiffré non mesuré. Sources et arbitrages dans [ADR 003](DECISIONS/003-accueil-discover.md). La recette est en cours, résultats dans [FRONTEND_02.md](FRONTEND_02.md).

## Socle initial, conservé ci-dessous

`Providers` applique `MotionConfig reducedMotion="user"`. `Reveal` utilise `useReducedMotion`, un déclenchement ponctuel dans le viewport et une transition de 350 ms. Le contenu SSR reste visible avec `initial={false}`. Les transitions CSS utilisent 180 ms. Les skeletons cessent après trois cycles ; les éléments décoratifs vocaux sont statiques.

`prefers-reduced-motion: reduce` désactive animations, transitions et défilement doux. Les cartes se déplacent seulement sur écran large sans réduction demandée. Aucun canvas, média automatique, 3D ou parallaxe continue n’est nécessaire. Les transitions de page élaborées et visualisations vocales branchées sur l’audio restent à développer selon des usages validés. Les écrans d’examen futurs doivent éviter la décoration animée.

Référence : [Accessibilité Motion](https://motion.dev/docs/react-accessibility).
