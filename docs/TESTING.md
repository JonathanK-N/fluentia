# Vérification frontend — Mission 01

Responsable : Jonathan Kakesa. Référence : CI Ubuntu, Node 22 et Python 3.12. Aucun build Windows local réussi n’est revendiqué.

## Références exécutées

| SHA | Runs examinés | Résultat |
|---|---|---|
| `9b4cfa902b9acc20774ec651921ac777969d0654` | [40082962080](https://github.com/JonathanK-N/fluentia/actions/runs/40082962080), [40082958171](https://github.com/JonathanK-N/fluentia/actions/runs/40082958171) | web et api réussis ; anciens contrôles limités à Chromium |
| `3480bd210d11f8f1cc9c8718bf2b5393f3121fff` | [40086017056](https://github.com/JonathanK-N/fluentia/actions/runs/40086017056), [40086013807](https://github.com/JonathanK-N/fluentia/actions/runs/40086013807) | web, api et docker réussis ; 22 E2E réussis, 2 exclus |
| `5967491f5f44d212a64f31b1bc309ce44cc558de` | [40086695392](https://github.com/JonathanK-N/fluentia/actions/runs/40086695392), [40086691688](https://github.com/JonathanK-N/fluentia/actions/runs/40086691688) | web, api et docker réussis ; 7 DOM, 22 E2E, 2 exclus, 1 API |

Les logs et toutes les étapes des six jobs du dernier commit de code ont été examinés. [Preuve structurée](evidence/frontend-01-validation.json). Le SHA de documentation final est distinct du SHA des captures.

## Contrôles

- `npm ci`, audit sans vulnérabilité signalée, lint sans avertissement accepté, TypeScript strict, 7 tests DOM et build Next.js.
- 375/768/1440 px sur Chromium, Firefox et WebKit : accueil et catalogue, absence de débordement horizontal, axe et dialogue.
- Clair et sombre sur les deux pages, lien d’évitement activé au clavier, focus visible des champs, formulaire vide puis valide, notification fermable, onglets par flèche, dialogue avec Tab/Échap et retour du focus.
- Mouvement réduit : CSS sans animation/transition, défilement automatique ; Motion respecte la préférence.
- Zoom réel Chromium : API `chrome.tabs.setZoom` / `getZoom`, facteur 2, largeur CSS 1440 → 720, absence de débordement et axe sur les deux routes. Le scénario est explicitement exclu sur Firefox et WebKit ; **pas de succès annoncé sur ces deux moteurs pour le zoom**.
- Manifest : langue, display, start_url ; chargement et dimensions PNG des trois icônes déclarées. Zéro enregistrement de service worker. Navigation vers une URL non mise en cache avec réseau coupé : indisponible, conformément à l’absence de mode hors ligne.
- Docker : construction, démarrage puis réponses HTTP accueil/catalogue/manifest/icône en CI. `docker version` a été essayé localement : commande absente.
- Script Python exécuté : 44 PNG/ICO identiques à l’archive officielle et 13 rapports de contraste conformes aux seuils testés. [Résultats](evidence/brand-assets-and-contrast.json).

Les 24 scénarios configurés donnent **22 réussites et 2 exclusions**. Une exécution exclue ne vaut pas validation.

## Commandes reproductibles

```bash
cd apps/web
npm ci
npm audit --audit-level=moderate
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install --with-deps chromium firefox webkit
npm run test:e2e
docker build --tag fluentia-web:validation .
docker run --rm -p 3200:3000 fluentia-web:validation
```

Le job Docker automatise aussi les contrôles HTTP et le nettoyage. Les tests navigateur démarrent le build de production sur 127.0.0.1:3100 et refusent de réutiliser un serveur existant.

## Preuves et limites

Les artefacts frontend-browser contiennent results.json, les captures par moteur, zoom.json et pwa.json. L’archive du run 40086017056 a été téléchargée et son SHA-256 vérifié : `63ac0cab0447c9861d72cc6414e864ed655a2ac81236dda2e1dc3b54d7c3d2ab`. Les captures dans images/ sont des preuves du frontend ; la capture Figma « à corriger » est explicitement une preuve d’échec.

L’archive finale du run 40086695392 a également été téléchargée et vérifiée : `45af8308aa21461e6d7636d400360d19e76e14c77f15c76ae31f13ea8e33e05f`. Les captures React dans images/ et les fichiers zoom/PWA conservés dans evidence/ proviennent de ce run sur `5967491f5f44d212a64f31b1bc309ce44cc558de`.

Figma : capture de référence réelle inspectée ; nouvelle maquette tablette inspectée et **échouée**. Les autres nouvelles maquettes et la planche n’ont pas été inspectées, quota Starter atteint. Voir [FIGMA.md](FIGMA.md).

Non exécutés : lecteurs d’écran, appareils physiques, Safari macOS/iOS, installation PWA réelle et mode standalone installé, zoom Firefox/WebKit. WebKit Linux ne remplace pas Safari sur appareil. Axe n’est pas une certification d’accessibilité complète. Aucun déploiement n’a été testé ou effectué.
