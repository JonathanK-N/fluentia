# Scripts de vérification et de conception

Responsable : Jonathan Kakesa.

`verify-brand-assets.py` compare les 44 PNG/ICO du dépôt à l’archive officielle dans Downloads et calcule 13 rapports de contraste. Son résultat exécuté est versionné dans `docs/evidence/brand-assets-and-contrast.json`.

Les scripts `figma-*.js` sont des scripts de contexte Figma Plugin API, pas des scripts Node ni des modules de production. Ils conservent les opérations de conception pour audit. `figma-variant-helper.js` est adapté du helper `createComponentWithVariants.js` fourni par le plugin Figma ; le script appelant sélectionne la page une seule fois.

Les identifiants effectivement retournés sont consignés dans `docs/figma-*-state.json`. Les scripts de composition ne doivent pas être relancés en bloc sur le document courant : reconstruire d’abord son état et cibler les corrections.

`figma-repair-layouts.js` est un **correctif préparé mais non exécuté**, bloqué par le quota Starter. Il traite les axes d’auto-layout et les largeurs directes ; une reprise doit aussi vérifier les descendants imbriqués, les en-têtes, les libellés, le focus, les espacements et les six maquettes. Il ne prouve aucune correction sur le canevas. La capture de référence temporaire `9:11` reste à supprimer après transfert et validation, conformément au workflow de conception.
