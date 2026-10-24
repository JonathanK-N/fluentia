# Contribuer à Fluentia

Responsable : Jonathan Kakesa.

Partir de `dev`, créer une branche temporaire descriptive, documenter le changement en français, puis ouvrir une PR vers `dev`. Ne pas inclure de nom de générateur dans les branches. Ne pas modifier directement `main`.

Dans `apps/web` : `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npx playwright install chromium`, `npm run test:e2e`. Vérifier le diff et les actifs, les états d’erreur, le clavier et le responsive. Voir [les guides](docs/README.md).

Utiliser l’identité réelle du contributeur ; aucune signature automatique ou attribution promotionnelle. Les résultats non exécutés ou échoués doivent être déclarés explicitement dans la PR.
