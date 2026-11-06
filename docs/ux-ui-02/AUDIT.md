# Audit initial — Mission UX/UI 02

Responsable : Jonathan Kakesa. Vérifications du 24 octobre 2026, avant création de ressources locales.

## GitHub et périmètre

| Élément | État réellement relu |
|---|---|
| dev | `6fe83c281d9b2d94499a0208f8bd4ef3251edc5a` |
| tests | `6fe83c281d9b2d94499a0208f8bd4ef3251edc5a` |
| main | `6fe83c281d9b2d94499a0208f8bd4ef3251edc5a` |
| PR #1 | Ouverte, brouillon, non fusionnée ; cible dev, HEAD `82c5a0ecff25bc81cdf0366a274024d578fbf7a5` |
| Deux derniers runs PR #1 | [40087127072](https://github.com/JonathanK-N/fluentia/actions/runs/40087127072) et [40087124926](https://github.com/JonathanK-N/fluentia/actions/runs/40087124926), réussis sur ce HEAD |
| Branche mission 02 | `design/ux-ui-02`, créée depuis origin/dev ; aucune intégration de la PR #1 |
| Identité Git existante | Jonathan Kakesa, jkakesa9@gmail.com ; configuration non modifiée |

Les composants et tokens avancés de Frontend 01 sont présents dans la PR #1, **pas dans dev**. Les ignorer ou fusionner implicitement la PR #1 aurait faussé l’audit. Le rapport, l’ADR 001, les primitives React, Header, Logo, les tokens, le manifest et les preuves de la branche Frontend 01 ont été consultés avant le changement de branche.

Sur dev, la charte historique mentionne encore Inter/Plus Jakarta Sans et un ancien slogan. Les documents approuvés par Jonathan Kakesa pour cette mission imposent Poppins et « Maîtrisez le français, allez plus loin. » : cette directive prime pour la conception v2. Les pages métier existantes ne sont pas modifiées.

## Inventaire hérité et écarts

La PR #1 conserve 15 ensembles Figma, 92 variantes, six maquettes du catalogue et leurs identifiants. Ces chiffres sont des preuves historiques, non un inventaire du canevas relu aujourd’hui. Les familles sont listées dans [FIGMA-REACT.md](FIGMA-REACT.md).

Défauts documentés : largeur exportée de 1390 px pour une maquette tablette de 768 px, actions et navigation débordantes, champs/barres plus larges que leurs cartes, hauteurs entraînant des chevauchements, libellés non alignés, syntaxes WEB primitives sans équivalent CSS. La nouvelle mission ne prétend pas que ces défauts sont corrigés.

L’architecture cible impose des droits et une isolation serveur pour comptes, examens et établissements. Le prototype local ne peut pas implémenter ces garanties ; il les identifie comme exigences de handoff.

## Figma : permissions et quota réellement interrogés

Fichier cible : [SIjNphVU1NHimwwImszGbE](https://www.figma.com/design/SIjNphVU1NHimwwImszGbE). Nouvelle session de mission : `7fdcabd1-4bb5-4eee-b14a-84b25fb5a92a`.

Le contrôle de compte retourne le forfait Starter, le siège View et le rôle administrateur d’équipe. Cela ne suffit pas à confirmer un droit d’édition effectif dans ce fichier. Une tentative **en lecture seule** d’énumérer pages, variables et ensembles est refusée : « You've reached the Figma MCP tool call limit on the Starter plan ».

Conséquences : inventaire actuel du canevas impossible ; correction, création des pages 00–13, composants natifs, captures et prototypes Figma bloqués. Aucun nouvel identifiant de nœud obtenu. Aucun contournement, changement de siège ou abonnement payant. Code Connect était déjà refusé dans la mission 01 et n’est pas revendiqué ici.

## Repli autorisé et limites

Les deux documents de mission autorisent expressément les références code-first et les tâches indépendantes lorsque Figma bloque. Le répertoire `design/ux-ui-02` contient donc un **prototype local de conception** ; il n’est ni l’application étudiante implémentée, ni un fichier Figma enregistré. Il ne sollicite ni microphone, ni paiement, ni IA, ni authentification.

Les données sont fictives. Les pages légales sont des structures à rédiger et valider. Les listes professionnelles utilisent des références de travail et certaines confirmations génériques ; elles ne constituent pas une conception CRUD complète ni une administration opérationnelle.

Les trois assets utilisés ont été extraits du pack officiel sans modification et comparés par hash. Poppins est réutilisée depuis la version locale 5.3.0 sous OFL-1.1 ; sa licence est livrée. Le catalogue couvre 62 écrans et huit parcours.
