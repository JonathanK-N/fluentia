# Accessibilité

Responsable : Jonathan Kakesa.

Lien d’évitement vers `#contenu`, document français, hiérarchie de titres, landmarks, focus visible et cibles d’action de 46 px. Les composants de formulaire associent labels, aides et erreurs avec des identifiants. Les boutons occupés sont désactivés et portent `aria-busy`. Les valeurs de progression sont bornées et rendues en texte ; aucune information ne dépend seulement de la couleur.

Radix gère le clavier et le focus des dialogues et onglets. Les notifications locales utilisent une région live polie ; les erreurs utilisent `alert`. Le choix des couleurs distingue palette de marque et couleurs de texte accessibles. Les préférences de mouvement sont respectées en CSS et avec Motion.

Axe automatisé ne prouve pas la conformité complète : lecture d’écran, zoom, compréhension des messages et navigation sur appareils réels restent une recette humaine. Voir TESTING.md pour les résultats effectivement obtenus.
