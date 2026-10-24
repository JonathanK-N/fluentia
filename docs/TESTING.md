# Vérification frontend — Mission 01

Responsable : Jonathan Kakesa. Validation de référence : GitHub Actions sous Ubuntu / Node 22.23.3 / Python 3.12.15.

## Résultats vérifiés

[Run 40082747957](https://github.com/JonathanK-N/fluentia/actions/runs/40082747957), commit `1703d25ce7c9b4ab4854fd5a6f0c6c91db5d3e7c`.

| Contrôle | Résultat |
|---|---|
| npm ci | Réussi depuis le lockfile |
| npm audit --audit-level=moderate | Zéro vulnérabilité signalée |
| npm run lint | Réussi, aucun avertissement accepté |
| npm run typecheck | Réussi, TypeScript strict |
| npm test | 7 tests DOM réussis |
| npm run build | Réussi, Next.js 15.5.28 |
| npm run test:e2e | 4 tests Chromium/axe réussis |
| python manage.py check | Réussi dans l’environnement de test CI |
| python manage.py test | 1 test réussi |
| Liens Markdown locaux | Contrôle réussi |
| Revue visuelle | Deux planches Figma et pages aux trois formats inspectées |

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
npm audit --audit-level=moderate
```

Les tests DOM vérifient les actions pendant le chargement, les bornes de progression, la validation locale du formulaire, les dialogues et les onglets au clavier. Chromium couvre 375/768/1440 px, les erreurs JavaScript, les règles axe dont les contrastes, le dialogue et le focus, le thème, le menu mobile, la réduction des animations et les icônes du manifest. Les captures se trouvent dans images/ et dans les artefacts frontend-browser de la CI.

## Échecs rencontrés et corrections

1. L’installation locale npm a été interrompue après des lenteurs anormales ; le premier typecheck lancé pendant l’extraction a rencontré un fichier de dépendance incomplet. Aucun succès local n’est revendiqué ; les contrôles de référence sont exécutés en CI Linux.
2. Le lint signalait un export anonyme de configuration : configuration nommée.
3. Django exigeait une configuration de production dans la CI initiale : DJANGO_DEBUG=1 est limité au job de test, sans modifier les paramètres applicatifs.
4. L’audit a signalé Vitest/tinypool et PostCSS : Vitest 5.0.5 et surcharge PostCSS 8.5.31, puis audit sans vulnérabilité signalée.
5. Vite 8 nécessite la configuration JSX Oxc : configuration adaptée selon [le guide officiel](https://vite.dev/guide/migration.html).
6. Axe détectait deux libellés de progression ne reprenant pas le texte visible : libellés corrigés, tests conservés.
7. La revue des captures a révélé un lien d’évitement masqué encore peint dans une capture longue et des bas de cartes décalés : opacité/focus et disposition flex corrigés.

Le lockfile initial a été récupéré d’un artefact CI et son archive vérifiée par SHA-256. Docker et CI utilisent désormais npm ci. Les correctifs ne sont pas validés par un contournement des règles de lint ou d’axe.

## Limites

Le build Docker, Safari/Firefox, les lecteurs d’écran, le zoom à 200 %, les performances sur mobile réel et l’installation PWA Android/iOS ne sont pas vérifiés. Axe ne démontre pas à lui seul une conformité d’accessibilité complète. Aucun déploiement n’est validé dans ce lot.
