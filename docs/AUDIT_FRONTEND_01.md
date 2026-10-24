# Audit frontend — Mission 01

Responsable : Jonathan Kakesa · Référence initiale : `6fe83c281d9b2d94499a0208f8bd4ef3251edc5a`.

## État initial vérifié

Les branches `main`, `dev` et `tests` pointaient sur le même commit. `apps/web` contient Next.js 15, React 19 et TypeScript strict. `apps/api` contient Django et un endpoint de santé. La page d’accueil est monolithique, en français, avec CSS responsive et réduction des transitions CSS. La marque affichée est provisoire ; la police est Inter système et aucun actif officiel n’est intégré.

Manquent : lockfile, lint, tests frontend, composants génériques, tokens sémantiques clair/sombre, catalogue, manifeste et icônes. La CI initiale exécute seulement typecheck et build pour le web. Le backend et les configurations de production ne nécessitent pas de modification dans cette mission.

## Choix de réalisation

Conserver App Router et CSS natif : aucune migration de framework ni de backend. Extraire les composants, utiliser Radix pour la gestion complexe du focus et Motion pour les apparitions. Poppins est distribuée localement avec Fontsource. Ne pas cumuler Tailwind, shadcn, Magic UI, React Bits et Three.js sur ce socle : aucun besoin ne justifie leurs dépendances supplémentaires. Les connecteurs disponibles incluent GitHub et Figma, pas de MCP shadcn ou Magic UI dédié.

## Risques et limites

Les parcours pédagogiques, examens, connexion, coach et paiements restent non implémentés. Le manifest ne constitue pas un mode hors ligne. Les PNG du pack sont la référence d’affichage ; ses SVG sont des reconstructions selon la documentation fournie. Les couleurs du pack et du brief diffèrent : les tokens suivent le brief, les logos sont conservés tels quels.

Le forfait Figma Starter n’autorise qu’un mode de variables dans ce fichier : les valeurs sombres figurent dans le spécimen mais ne sont pas présentées comme un second mode créé. La validation humaine de la direction artistique et du contenu pédagogique reste requise.
