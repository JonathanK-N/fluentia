# Développement frontend

Responsable : Jonathan Kakesa. Prérequis de référence : Node.js 22.12 minimum (22 LTS de référence) et npm.

```bash
cd apps/web
npm ci
npm run dev
```

Routes : `/` pour la vitrine, `/design-system` pour le catalogue. `app/loading.tsx`, `error.tsx` et `not-found.tsx` gèrent les replis. Les pages restent des composants serveur ; seules les interactions et animations requises sont clientes. Le contenu français et le slogan se centralisent dans `lib/brand.ts`. Le document utilise `fr-CA`. L’architecture permet une future couche de traductions, sans introduire de dépendance i18n prématurée.

Les polices sont locales via Fontsource, sans requête Google Fonts à l’exécution ou à la compilation. Les icônes et logos proviennent de `public/branding`. Aucun service worker ni cache offline n’est installé.

Le lockfile npm verrouille les versions résolues ; Docker et CI utilisent `npm ci`. Les secrets ne doivent jamais être placés dans des variables `NEXT_PUBLIC_*`.
