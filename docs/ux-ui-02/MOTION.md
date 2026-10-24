# Motion design — storyboards et choix techniques

Responsable : Jonathan Kakesa. Spécifications futures ; le prototype de référence utilise du CSS simple. Aucune nouvelle bibliothèque d’animation installée.

## Scénarios et réduction

| Scénario | Déclencheur et séquence | Durée cible | Réduction des mouvements | Recette attendue |
|---|---|---|---|---|
| Apparition Discover | Section visible, opacité 0→1 et translation 12→0, une fois | 360 ms, easing .2/.7/.3/1 | Rendu immédiat, aucune translation | Contenu disponible sans JS et aucune réapparition forcée |
| Navigation | Action explicite, ancien contenu retiré puis titre et focus du nouvel écran | Pas d’animation bloquante | Immédiat | Historique, focus et retour cohérents |
| Carte pédagogique | Survol desktop ou focus, contour accentué | 180 ms | Contour immédiat, pas de mouvement | Le focus ne dépend jamais du hover |
| Modale | Ouverture après action, opacité du voile et contenu stable | 180 ms | Immédiat | Focus piégé, Échap, retour au déclencheur |
| Onglet | Sélection par flèche ou clic, contenu et soulignement | 120 ms | Immédiat | Pas de focus perdu ni de hauteur tronquée |
| Progression | Changement confirmé de valeur, largeur interpolée | 240 ms | Valeur finale immédiate | Valeur textuelle cohérente, jamais un résultat inventé |
| Validation | Message après soumission, région live et état du champ | Immédiat | Identique | Erreur liée au champ et focus utile |
| Voix | Message immédiat, halo puis pulsation contrôlée | 180 ms puis boucle lente | Sphère fixe | État toujours compréhensible sans mouvement ni son |

Ces scénarios ne sont pas tous animés dans le prototype local. Les apparitions immersives, transitions de page, animations de progression et prototypes Figma natifs restent à réaliser après validation de conception.

## Étude des bibliothèques

| Option | Constat vérifié | Décision de conception |
|---|---|---|
| Motion for React | Documentation officielle sur reducedMotion et useReducedMotion ; déjà présent dans la PR #1 | Réutiliser après intégration autorisée de la mission 01 ; ne pas installer un second moteur |
| Magic UI | Catalogue de composants et licence MIT du dépôt consultés | Référence d’étude seulement ; une dépendance ou copie n’est pas nécessaire pour ce prototype |
| React Bits | Documentation et licence du dépôt consultées ; licence MIT avec Commons Clause, et non simple MIT | Ne rien importer ; vérifier licence exacte et usage de chaque ressource avant tout réemploi |
| React Three Fiber | Renderer React pour three.js ; documentation de compatibilité React et licence MIT consultées | Différer : la sphère CSS suffit à la spécification actuelle, aucune scène 3D installée |

Sources : [accessibilité Motion](https://motion.dev/docs/react-accessibility), [catalogue Magic UI](https://magicui.design/docs/components), [licence Magic UI](https://raw.githubusercontent.com/magicuidesign/magicui/main/LICENSE.md), [React Bits](https://reactbits.dev/get-started/introduction), [licence React Bits](https://raw.githubusercontent.com/DavidHDev/react-bits/main/LICENSE.md), [React Three Fiber](https://r3f.docs.pmnd.rs/getting-started/introduction), [licence R3F](https://github.com/pmndrs/react-three-fiber/blob/master/LICENSE). Vérifications du 24 octobre 2026 ; recontrôler la version précise avant adoption.

## Budget proposé, non mesuré comme résultat produit

Préférer opacité et transform ; éviter les animations de layout en boucle, les grands flous animés et les effets liés au pointeur sur mobile. Suspendre les boucles hors écran et quand le document est masqué. La sphère cible un seul élément décoratif avec anneau ; un fallback statique doit rester disponible.

Les budgets GPU, mémoire, fluidité et consommation sur appareils physiques ne sont pas mesurés. Aucun score de performance ni gain chiffré n’est revendiqué.
