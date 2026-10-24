# Manifest et comportement PWA

Responsable : Jonathan Kakesa. État vérifié en CI sur Chromium, Firefox et WebKit.

Le manifest est généré par `apps/web/app/manifest.ts` : Fluentia, fr-CA, départ /, display standalone, couleurs officielles, icônes PNG 192/512 et maskable 512. Les métadonnées déclarent aussi favicon.ico et apple-touch-icon 180. Les 44 PNG/ICO du pack ont été comparés à l’archive officielle.

Les tests navigateur demandent le manifest et chaque icône déclarée, vérifient leur réponse et leurs dimensions PNG. Ils constatent **zéro service worker** puis une navigation indisponible sur une URL non mise en cache lorsque le réseau est coupé. Le mode hors ligne n’est pas implémenté.

`display: standalone` exprime une préférence du manifest ; cela ne prouve pas une installation. Aucune installation sur Android/iOS ni ouverture dans une fenêtre installée n’a été exécutée. L’installabilité, la zone sûre du masque après installation, le lancement autonome et le comportement après mises à jour restent à vérifier sur un environnement adapté. Les tests actuels ne permettent pas de présenter Fluentia comme une PWA complète et validée.
