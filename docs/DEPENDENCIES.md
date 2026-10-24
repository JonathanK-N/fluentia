# Dépendances frontend

Responsable : Jonathan Kakesa. Versions résolues dans le lockfile npm ; aucune activation de service payant.

| Dépendance | Version | Licence déclarée | Rôle |
|---|---|---|---|
| next | 15.5.28 | MIT | Framework App Router conservé |
| react | 19.3.1 | MIT | Rendu UI conservé |
| react-dom | 19.3.1 | MIT | Rendu DOM conservé |
| motion | 12.43.0 | MIT | Apparitions et réduction du mouvement |
| @fontsource/poppins | 5.3.0 | OFL-1.1 | Police locale |
| @radix-ui/react-dialog | 1.3.1 | MIT | Focus et clavier des modales |
| @radix-ui/react-tabs | 1.2.1 | MIT | Onglets accessibles |
| vitest | 5.0.5 | MIT | Tests DOM |
| @playwright/test | 1.64.1 | Apache-2.0 | Tests navigateur |
| @axe-core/playwright | 4.14.0 | MPL-2.0 | Audit accessibilité |
| eslint | 9.39.5 | MIT | Lint Next.js / TypeScript |
| postcss | 8.5.31 | MIT | Analyse CSS, surcharge corrective 8.5.31 |

Les types TypeScript, jsdom et Testing Library servent exclusivement aux contrôles et au développement. Les conditions précises restent celles des fichiers LICENSE distribués par chaque paquet. Axe utilise MPL-2.0 ; ce paquet de développement est utilisé sans modification de ses sources. Poppins est distribuée sous OFL-1.1.

Tailwind, shadcn/ui, Magic UI, React Bits et Three.js ne sont pas ajoutés : le socle existant ne nécessite pas ces couches supplémentaires. Voir [ADR 001](DECISIONS/001-frontend-foundations.md).

Référence de sécurité : audit npm de la CI `40082375976`, zéro vulnérabilité signalée après les mises à jour. Ce résultat représente l’état des avis disponibles au moment du contrôle, pas une garantie générale de sécurité.
