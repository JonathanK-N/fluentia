# Vérification frontend — Mission 01

Responsable : Jonathan Kakesa.

## Commandes reproductibles

```bash
cd apps/web
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm audit
```

Les tests DOM vérifient les actions pendant le chargement, les bornes de progression, la validation locale du formulaire, les dialogues et le clavier des onglets. Les tests Chromium couvrent 375/768/1440 px, les erreurs JavaScript, les contrastes et règles axe, le dialogue, le thème, le menu mobile, la réduction des animations et les icônes du manifest.

## Résultats de cette exécution

Validation en cours. L’installation initiale des paquets a rencontré de fortes lenteurs réseau. Un premier lancement TypeScript avant la fin de l’extraction a échoué sur un fichier de dépendance encore incomplet ; il doit être relancé après installation. Aucun succès de compilation ou de test n’est revendiqué à ce stade.

Les deux planches Figma ont été inspectées visuellement. Les résultats navigateur, audit et CI seront consignés après exécution. La recette Safari/Firefox, lecteur d’écran et installation PWA sur appareil réel n’est pas réalisée.

## Première validation CI

Le run `40082052705` valide le lint, TypeScript, 7 tests DOM, le build Next.js et les tests Django. Il a identifié deux libellés de progression incompatibles avec le texte visible (corrigés). Le run `40082375976` confirme un audit à zéro vulnérabilité après mise à jour Vitest / PostCSS ; il révèle un ajustement de configuration JSX requis pour Vite 8. La configuration est adaptée à Oxc selon [le guide de migration Vite](https://vite.dev/guide/migration.html). Les contrôles sont relancés sur le lockfile récupéré de la CI et vérifié par SHA-256.
