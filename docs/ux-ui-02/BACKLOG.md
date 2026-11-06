# Backlog priorisé — conception puis implémentation

Responsable : Jonathan Kakesa. Aucune tâche de ce document n’autorise automatiquement une fusion ou une mise en production.

| Priorité | Travail | Dépendance | Critère de sortie |
|---|---|---|---|
| P0 | Rétablir lecture/édition Figma sans achat non autorisé | Quota et droits | Inventaire actuel retourné par le service |
| P0 | Corriger les six maquettes et variantes héritées | Accès Figma | Captures sans débordement ni chevauchement, trois tailles, deux thèmes |
| P0 | Normaliser variables, scopes, code syntax, styles et contraintes | Inventaire réel | Bindings cohérents, noms CSS réels, pas de valeurs primitives inventées |
| P0 | Arbitrer les rayons et dimensions proposés en v2 | Jonathan Kakesa | Une source de vérité Figma/React par token |
| P1 | Construire composants métier natifs et variantes | Fondations validées | Audio, QCM, rédaction, timer, Voice, facturation, relecture documentés et inspectés |
| P1 | Assembler les 62 écrans et variantes nécessaires | Composants natifs | Instances, textes éditables, assets officiels et trois formats révisés |
| P1 | Prototyper les huit parcours dans Figma | Écrans natifs | Cas nominaux, erreurs et interruptions reliés et testés |
| P1 | Détailler les éditeurs/listes professionnels encore génériques | Recette métier | Création, édition, conflit version, périmètre établissement et confirmations |
| P1 | Finaliser contenus pédagogiques, tarifs et textes légaux | Responsables compétents | Aucun exemple fictif présenté comme officiel ou commercial approuvé |
| P1 | Recette clavier, lecteurs d’écran, zoom et appareils réels | Interfaces stabilisées | Résultats enregistrés sans confondre automatique et humain |
| P2 | Décision sur l’intégration de la PR #1 vers dev | Revue et décision explicites | Aucun merge automatique ; dépendances documentées |
| P2 | Planifier Frontend 02, uniquement après accord explicite | Design System et périmètre approuvés | Ticket et contrat de page d’accueil définis |
| P2 | Implémenter fonctionnalités métier ultérieures | API, droits, contenus, sécurité | Tests réels des services, distincts des simulations |
| P3 | Étudier 3D ou effets avancés si besoin démontré | Mesures sur appareils | Valeur et budget établis ; fallback accessible |

Les nouveaux noms de composants React dans la matrice sont des propositions. Le backend ne doit pas accorder de droits en fonction d’un rôle affiché par le client. Les réponses et délais d’examen doivent rester autoritaires côté serveur. Les contrats de conservation audio et brouillon sont à décider avant toute collecte réelle.
