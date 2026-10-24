# Références locales de conception Fluentia UX/UI 02

Propriétaire et responsable : Jonathan Kakesa.

**Prototype de conception local, pas une application métier ni un fichier Figma enregistré.** 62 écrans, huit parcours simulés et trois univers. Données fictives ; aucun microphone, compte, paiement ou modèle IA connecté. Les pages légales sont des structures non approuvées et les éditeurs professionnels restent partiels.

```bash
node design/ux-ui-02/serve.mjs
```

Ouvrir [l’index local](http://127.0.0.1:4173), [Discover](http://127.0.0.1:4173/#P01), [Learn](http://127.0.0.1:4173/#S01), [Voice](http://127.0.0.1:4173/#S13). Le serveur écoute seulement 127.0.0.1 et n’est pas un mode de déploiement.

Les sources sont éditables : catalogue.json, prototype.js, prototype.css, tokens.css. `create-inventory.py` produit le catalogue ; `build-specifications.py` génère les fiches et matrices dans docs/ux-ui-02. `verify.py` contrôle structure, assets et seize paires de contraste.

```bash
cd design/ux-ui-02
npm ci --ignore-scripts
python verify.py
npx playwright install --with-deps chromium firefox webkit
npm test
```

Playwright 1.64.1 (Apache-2.0) et axe 4.14.0 (MPL-2.0) sont exclusivement des outils de recette. Le lockfile est extrait de l’arbre verrouillé de la PR #1 en conservant résolutions et intégrités des six packages nécessaires. Poppins 5.3.0 est réutilisée sous OFL-1.1, licence conservée. Aucun runtime externe n’est requis par les écrans eux-mêmes.

Les captures et traces sont générées dans test-results, ignoré par Git et publié en artefact CI pour une durée limitée. Les captures inspectées et preuves conservées sont référencées par le rapport. Les résultats hérités de Frontend 01 ne sont pas présentés comme des tests de ce prototype.
