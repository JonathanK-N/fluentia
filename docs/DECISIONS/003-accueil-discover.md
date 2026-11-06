# ADR 003 — Accueil Discover léger et démonstrations explicites

Responsable : Jonathan Kakesa. 24 octobre 2026.

## Contexte

Les PR #1 et #2 sont fusionnées après autorisations successives. dev `2e1ed545540e8ea5fb0c540475ce7e146fcf315f` est validé avant création de la branche d’accueil. Le Code-First est approuvé ; synchronisation native Figma différée.

## Choix

Réutiliser Motion 12.43.0, React/Next, Radix et les primitives existantes, sans ajouter de dépendance applicative. La sphère CSS suffit à évoquer voix et profondeur, sans imposer WebGL ou chargement 3D. Magic UI et React Bits ont été évalués dans l’étude UX/UI ; leurs composants ne sont pas nécessaires pour ces interactions. Aucune copie de leurs composants ni nouvelle licence introduite. React Three Fiber reste différé faute de besoin et de mesure justifiant son coût.

Découper contenu, navigation, hero, sphère, compétences, coach, Voice, parcours, aperçu, tarifs et FAQ. Les tokens de thèmes partagent leurs déclarations existantes ; pas de bibliothèque parallèle ni d’import automatique des propositions UX/UI v2.

Les services indisponibles restent identifiés : pas d’authentification, capture audio, IA, paiement ou résultats réels simulés comme opérationnels. Prix centralisés null. Liens légaux non approuvés rendus en texte. La démo est manuelle, sans minuterie de réponse, avec sept états et restitution de focus.

Les contenus restent visibles sans JavaScript. Mouvement réduit et pause arrêtent les effets ; les sphères cessent aussi hors écran/page masquée. Les performances GPU et appareils physiques ne sont pas revendiquées comme mesurées.

## Outils et sources

Le formatage ponctuel utilise Prettier 3.9.10 dans le répertoire temporaire, licence MIT, compatibilité Node >=14 et SHA-512 de l’archive npm vérifiés ; aucune installation de ce paquet dans le projet ou modification du lockfile. La recette propre reste `npm ci` en CI Node 22.

Documentation consultée : [accessibilité Motion](https://motion.dev/docs/react-accessibility), [useInView](https://motion.dev/docs/react-use-in-view), [useScroll](https://motion.dev/docs/react-use-scroll). Le MotionConfig global respecte le système ; les boucles et opacités sont également contrôlées explicitement par les composants.
