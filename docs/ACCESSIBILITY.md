# Accessibilité

Responsable : Jonathan Kakesa.

Lien d’évitement vers `#contenu`, document français, hiérarchie de titres, landmarks, focus visible et boutons de hauteur minimale 46 px. Les composants de formulaire associent labels, aides et erreurs avec des identifiants. Les boutons occupés sont désactivés et portent `aria-busy`. Les valeurs de progression sont bornées et rendues en texte ; aucune information ne dépend seulement de la couleur.

Radix gère le clavier et le focus des dialogues et onglets. Les notifications locales utilisent une région live polie ; les erreurs utilisent `alert`. Le choix des couleurs distingue palette de marque et couleurs de texte accessibles. Les préférences de mouvement sont respectées en CSS et avec Motion.

Axe et les parcours clavier ont été exécutés dans les deux thèmes et sur les trois moteurs. Treize paires de contraste ont été calculées, dont les bordures des champs à plus de 3:1. Le zoom réel à 200 % a été exécuté sur Chromium. Axe ne prouve pas la conformité complète : lecture d’écran, compréhension des messages et appareils réels restent non testés. Voir [TESTING.md](TESTING.md).
