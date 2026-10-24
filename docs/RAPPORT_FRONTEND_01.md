# Rapport — Mission Frontend 01, premier lot

Responsable et propriétaire : Jonathan Kakesa · GitHub : JonathanK-N · 24 octobre 2026.

## Résumé exécutif

Le dépôt existant est conservé et enrichi de fondations frontend réutilisables : design system codé v1.0, vitrine, catalogue interactif, actifs officiels, thèmes, motion et contrôles automatisés. Le premier lot est proposé dans la [PR #1 vers dev](https://github.com/JonathanK-N/fluentia/pull/1), en brouillon. La mission globale reste partiellement réalisée : la bibliothèque et les maquettes Figma complètes, la recette sur appareils réels et certaines animations avancées ne sont pas terminées.

## État initial

Référence : `6fe83c281d9b2d94499a0208f8bd4ef3251edc5a`. Les branches permanentes dev, tests et main pointaient sur cette référence et ont été vérifiées inchangées après les travaux. Le socle comprenait Next.js 15, React 19, TypeScript strict, une vitrine monolithique et un endpoint de santé Django. Voir [l’audit](AUDIT_FRONTEND_01.md).

## Modifications et dépendances

- Séparation des composants génériques, de la marque et des fonctionnalités de démonstration.
- Tokens sémantiques, thèmes système/manuel, police Poppins locale et actifs PNG officiels.
- Boutons, champs, cartes, alertes, notifications, modales, onglets, progression, tableaux et graphiques simples.
- Navigation responsive, replis de route, manifest et icônes.
- Apparitions Motion ponctuelles, réduction des mouvements et décoration statique sans 3D.
- Documentation française, diagrammes et captures contrôlées.
- Lockfile npm, npm ci, lint et tests DOM/navigateur dans la CI ; correction du mode de test Django uniquement dans la CI.

Versions, licences et raisons des dépendances : [DEPENDENCIES.md](DEPENDENCIES.md). Les ajouts fonctionnels sont Motion, Radix Dialog/Tabs et Fontsource Poppins. Les autres ajouts sont les outils de lint et de test. Vitest 5 et PostCSS 8.5.31 corrigent les avis identifiés par l’audit initial. Aucun service payant n’a été activé.

## Fonctionnement réel

| Élément | État | Limite |
|---|---|---|
| Vitrine et catalogue | Fonctionnels dans les parcours testés en Chromium | Pas de compte ni d’entraînement métier |
| Composants UI | Réutilisables et testés | Tableaux sans tri/pagination ; graphiques simples |
| Formulaire et notifications | Fonctionnels localement | Aucune inscription ni persistance |
| Clair/sombre | Fonctionnel | Choix manuel limité au document courant |
| Motion | Partiellement réalisé | Apparitions et micro-interactions ; pas de transition complexe entre pages ni de parallaxe |
| PWA | Préparée | Manifest/icônes vérifiés ; pas de service worker ni d’installation réelle validée |
| Figma | Partiellement réalisé | Tokens, styles, spécimen, 18 variantes du bouton ; autres composants, maquettes responsive et Code Connect à compléter |
| Examens, authentification, paiements, coach | Non implémentés | Hors de ce premier lot |

## Tests et preuves

Le [run 40082747957](https://github.com/JonathanK-N/fluentia/actions/runs/40082747957) sur `1703d25ce7c9b4ab4854fd5a6f0c6c91db5d3e7c` valide npm ci, audit à zéro vulnérabilité signalée, lint sans avertissement, TypeScript strict, 7 tests DOM, build Next.js, 4 tests Chromium/axe et 1 test Django. Environnement : Ubuntu, Node 22.23.3, Python 3.12.15, Chromium fourni par Playwright.

Les tests couvrent 375, 768 et 1440 px, les erreurs JavaScript, le dialogue et le focus, le thème sombre, le menu mobile, le mouvement réduit et les icônes du manifest. Les captures des deux pages aux trois formats sont inspectées. Les deux planches Figma sont également inspectées. Voir [TESTING.md](TESTING.md).

L’installation npm locale a été interrompue après des lenteurs anormales ; aucun build local réussi n’est revendiqué. La validation de référence est la CI Linux. Le build Docker, Safari/Firefox, les lecteurs d’écran, le zoom et l’installation PWA sur appareils réels restent non vérifiés.

## Documentation et conception

Guides : [index](README.md), [architecture](ARCHITECTURE.md), [design system](DESIGN_SYSTEM.md), [composants](COMPONENTS.md), [motion](MOTION_DESIGN.md), [accessibilité](ACCESSIBILITY.md), [responsive](RESPONSIVE.md), [marque](BRAND_GUIDELINES.md), [API](API_INTEGRATION.md), [branches](BRANCHING_STRATEGY.md), [plan de l’accueil](LANDING_PLAN.md).

[Fichier Figma](https://www.figma.com/design/SIjNphVU1NHimwwImszGbE) et [état détaillé](FIGMA.md). Le forfait Starter a refusé un second mode de variables ; les valeurs sombres sont documentées, sans prétendre qu’un second mode existe.

## Risques, gouvernance et suite

La PR reste en brouillon. Ne pas promouvoir vers tests/main avant recette humaine et revue des éléments incomplets. Les logos PNG sont conservés tels que fournis ; les SVG du pack ne sont pas des masters certifiés. Les contrôles automatiques ne prouvent pas à eux seuls une conformité d’accessibilité complète. Réévaluer la surcharge PostCSS lors de la prochaine montée de Next et planifier l’évolution de la chaîne de lint.

Aucun changement de code sur main, aucune fusion, aucun force push et aucun déploiement de production. Le backend applicatif est inchangé. Le retour arrière consiste à fermer la PR avant fusion ou proposer un revert revu après intégration.

La suite de la mission 01 concerne les maquettes et composants Figma manquants, la recette multi-navigateurs/appareils et l’arbitrage des animations utiles. Le plan de l’accueil décrit les étapes de raccordement futur ; aucune mission suivante n’est lancée automatiquement.

## Branche et commits

Branche : `frontend/mission-01`, issue de dev.

```text
1703d25ce7c9b4ab4854fd5a6f0c6c91db5d3e7c Affiner les cartes et documenter les dépendances vérifiées
1703d25ce7c9b4ab4854fd5a6f0c6c91db5d3e7c Verrouiller les dépendances et renforcer les validations automatisées
4f7169ff7982eeec92c05b28ed56c7e1b85a771a Corriger les libellés accessibles et les dépendances vulnérables
cdeb0fbd170ded98043e10c3196f216c16b1982d Corriger le lint et isoler la configuration des tests en CI
5292bcfa659821961785e27759bb93eae7dc928e Poser les fondations visuelles et les composants du frontend
```

## Fichiers créés ou modifiés

<details>
<summary>Liste des fichiers de ce lot</summary>

```text
.github/workflows/ci.yml
.gitignore
CHANGELOG.md
CONTRIBUTING.md
README.md
apps/web/.dockerignore
apps/web/Dockerfile
apps/web/app/design-system/page.tsx
apps/web/app/error.tsx
apps/web/app/globals.css
apps/web/app/layout.tsx
apps/web/app/loading.tsx
apps/web/app/manifest.ts
apps/web/app/not-found.tsx
apps/web/app/page.tsx
apps/web/components/animations/reveal.tsx
apps/web/components/branding/logo.tsx
apps/web/components/layout/providers.tsx
apps/web/components/navigation/header.tsx
apps/web/components/ui/dialog.tsx
apps/web/components/ui/notification.tsx
apps/web/components/ui/primitives.tsx
apps/web/components/ui/tabs.tsx
apps/web/eslint.config.mjs
apps/web/features/design-system/showcase.tsx
apps/web/lib/brand.ts
apps/web/package-lock.json
apps/web/package.json
apps/web/playwright.config.ts
apps/web/public/branding/01_Logos_PNG/fluentia-symbole-fond-clair-1024.png
apps/web/public/branding/01_Logos_PNG/fluentia-symbole-fond-clair-256.png
apps/web/public/branding/01_Logos_PNG/fluentia-symbole-fond-clair-512.png
apps/web/public/branding/01_Logos_PNG/fluentia-symbole-fond-sombre-1024.png
apps/web/public/branding/01_Logos_PNG/fluentia-symbole-fond-sombre-256.png
apps/web/public/branding/01_Logos_PNG/fluentia-symbole-fond-sombre-512.png
apps/web/public/branding/01_Logos_PNG/fluentia-symbole-transparent-1024.png
apps/web/public/branding/01_Logos_PNG/fluentia-symbole-transparent-256.png
apps/web/public/branding/01_Logos_PNG/fluentia-symbole-transparent-512.png
apps/web/public/branding/01_Logos_PNG/icon-cyan.png
apps/web/public/branding/01_Logos_PNG/icon-gradient.png
apps/web/public/branding/01_Logos_PNG/icon-navy.png
apps/web/public/branding/01_Logos_PNG/icon-white.png
apps/web/public/branding/01_Logos_PNG/logo-horizontal-dark.png
apps/web/public/branding/01_Logos_PNG/logo-horizontal-light.png
apps/web/public/branding/01_Logos_PNG/logo-slogan-dark.png
apps/web/public/branding/01_Logos_PNG/logo-slogan-light.png
apps/web/public/branding/02_Icons_PWA/apple-touch-icon-152.png
apps/web/public/branding/02_Icons_PWA/apple-touch-icon-167.png
apps/web/public/branding/02_Icons_PWA/apple-touch-icon-180.png
apps/web/public/branding/02_Icons_PWA/icon-1024x1024.png
apps/web/public/branding/02_Icons_PWA/icon-120x120.png
apps/web/public/branding/02_Icons_PWA/icon-128x128.png
apps/web/public/branding/02_Icons_PWA/icon-144x144.png
apps/web/public/branding/02_Icons_PWA/icon-152x152.png
apps/web/public/branding/02_Icons_PWA/icon-180x180.png
apps/web/public/branding/02_Icons_PWA/icon-192x192.png
apps/web/public/branding/02_Icons_PWA/icon-256x256.png
apps/web/public/branding/02_Icons_PWA/icon-384x384.png
apps/web/public/branding/02_Icons_PWA/icon-512x512.png
apps/web/public/branding/02_Icons_PWA/icon-72x72.png
apps/web/public/branding/02_Icons_PWA/icon-96x96.png
apps/web/public/branding/02_Icons_PWA/icon-maskable-192x192.png
apps/web/public/branding/02_Icons_PWA/icon-maskable-512x512.png
apps/web/public/branding/03_Favicons/favicon-128x128.png
apps/web/public/branding/03_Favicons/favicon-16x16.png
apps/web/public/branding/03_Favicons/favicon-24x24.png
apps/web/public/branding/03_Favicons/favicon-256x256.png
apps/web/public/branding/03_Favicons/favicon-32x32.png
apps/web/public/branding/03_Favicons/favicon-48x48.png
apps/web/public/branding/03_Favicons/favicon-64x64.png
apps/web/public/branding/03_Favicons/favicon-96x96.png
apps/web/public/branding/03_Favicons/favicon-source-256.png
apps/web/public/branding/03_Favicons/favicon.ico
apps/web/public/branding/04_SVG/icon-cyan.svg
apps/web/public/branding/04_SVG/icon-gradient.svg
apps/web/public/branding/04_SVG/icon-navy.svg
apps/web/public/branding/04_SVG/icon-white.svg
apps/web/public/branding/04_SVG/logo-horizontal-dark.svg
apps/web/public/branding/04_SVG/logo-horizontal-light.svg
apps/web/public/branding/04_SVG/logo-slogan-dark.svg
apps/web/public/branding/04_SVG/logo-slogan-light.svg
apps/web/public/branding/05_Documentation/README.md
apps/web/public/branding/05_Documentation/integration-nextjs.ts
apps/web/public/branding/05_Documentation/manifest.webmanifest
apps/web/tests/components.test.tsx
apps/web/tests/e2e/frontend.spec.ts
apps/web/tests/setup.ts
apps/web/tsconfig.json
apps/web/vitest.config.ts
docs/ACCESSIBILITY.md
docs/API_INTEGRATION.md
docs/ARCHITECTURE.md
docs/AUDIT_FRONTEND_01.md
docs/BRANCHING_STRATEGY.md
docs/BRAND.md
docs/BRAND_GUIDELINES.md
docs/COMPONENTS.md
docs/DECISIONS/001-frontend-foundations.md
docs/DEPENDENCIES.md
docs/DEPLOYMENT.md
docs/DESIGN_SYSTEM.md
docs/FIGMA.md
docs/FRONTEND.md
docs/LANDING_PLAN.md
docs/MOTION_DESIGN.md
docs/RAPPORT_FRONTEND_01.md
docs/README.md
docs/RESPONSIVE.md
docs/TESTING.md
docs/figma-state.json
docs/images/accueil-1440.png
docs/images/accueil-375.png
docs/images/accueil-768.png
docs/images/catalogue-1440.png
docs/images/catalogue-375.png
docs/images/catalogue-768.png
docs/images/figma-buttons.png
docs/images/figma-foundations.png
```

</details>
