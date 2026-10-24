# Accessibilité

Responsable : Jonathan Kakesa.

## Accueil Frontend 02

**Actualisation v3 :** les deux pilotes utilisent un thème clair explicite, y compris sous préférence système sombre. Le catalogue garde ses deux thèmes. Les résultats propres au redesign, la correction de contraste du lien actif et les limites de lecture d’écran sont consignés dans [UX_REVIEW.md](UX_REVIEW.md). La description Discover sombre ci-dessous est historique.

Discover sombre, aperçu Learn clair et catalogue à thème sont distincts. Le lien d’évitement cible le main focalisable de l’accueil. Les ancres mènent à de vraies sections ; aucun faux lien légal ou d’achat. La FAQ native reste utilisable sans JavaScript. Voice annonce son état dans une région live polie ; les transitions gardent le bouton principal et la fin restitue son focus. La navigation mobile se ferme avec Échap et rend le focus au résumé.

La pause globale et les préférences système arrêtent le mouvement ; sphères et icônes décoratives sont cachées aux aides techniques. Données fictives, prix non confirmés et absence de microphone sont explicités. Les tests ajoutés ne sont pas encore une certification : voir les résultats et limites actuels dans [FRONTEND_02.md](FRONTEND_02.md).

Lien d’évitement vers `#contenu`, document français, hiérarchie de titres, landmarks, focus visible et boutons de hauteur minimale 46 px. Les composants de formulaire associent labels, aides et erreurs avec des identifiants. Les boutons occupés sont désactivés et portent `aria-busy`. Les valeurs de progression sont bornées et rendues en texte ; aucune information ne dépend seulement de la couleur.

Radix gère le clavier et le focus des dialogues et onglets. Les notifications locales utilisent une région live polie ; les erreurs utilisent `alert`. Le choix des couleurs distingue palette de marque et couleurs de texte accessibles. Les préférences de mouvement sont respectées en CSS et avec Motion.

Axe et les parcours clavier ont été exécutés dans les deux thèmes et sur les trois moteurs. Treize paires de contraste ont été calculées, dont les bordures des champs à plus de 3:1. Le zoom réel à 200 % a été exécuté sur Chromium. Axe ne prouve pas la conformité complète : lecture d’écran, compréhension des messages et appareils réels restent non testés. Voir [TESTING.md](TESTING.md).
