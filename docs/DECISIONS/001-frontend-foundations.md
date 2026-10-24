# ADR 001 — Fondations frontend

Statut : retenu pour la mission 01. Responsable : Jonathan Kakesa.

Conserver Next.js 15 / React 19 / TypeScript strict et CSS natif pour limiter la migration. Séparer présentation, interactions et configuration. Choisir Radix pour les dialogues et onglets ; choisir Motion pour les apparitions. Héberger Poppins localement. Déférer Tailwind, shadcn, Magic UI, React Bits et Three.js faute de besoin concret.

Dépendances : Next, React, Motion, Radix et outils de tests sous licences permissives à vérifier dans les métadonnées installées ; Poppins sous OFL via Fontsource. Aucun service payant n’est activé. Les versions réellement résolues et l’audit figurent dans le lockfile et le rapport de tests.

Références : [Motion](https://motion.dev/docs/react-accessibility), [correctif Next.js](https://nextjs.org/blog/nextjs-security-update-october-14-2026), métadonnées npm installées.
