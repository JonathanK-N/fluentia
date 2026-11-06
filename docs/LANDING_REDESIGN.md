# Pilote de l’accueil public

Responsable : Jonathan Kakesa. Nouvelle direction limitée à la page publique.

Conserver les contenus et interactions utiles de Frontend 02 : quatre compétences, méthode, conseil d’exemple, Voice, aperçu, offres non définitives, FAQ et disponibilité réelle. Remplacer la mise en scène sombre et la sphère du hero par une entrée claire, compacte et orientée vers un parcours concret.

Pas de photo ou témoignage inventé, pas de statistiques commerciales, pas de faux lien d’inscription. Les prix restent non approuvés. La sphère n’apparaît que dans Voice, à petite taille ; aucun microphone n’est activé et les sept états restent des simulations explicitement identifiées.

Implémentation sur `/` : hero statique rendu sur le serveur, CTA vers `/apercu/etudiant`, aperçu de parcours sans statistiques, fonds clairs et cartes sans halos. Les sections conservent leurs ancres réelles ; FAQ native et texte restent lisibles sans JavaScript. Les apparitions Motion durent 180 ms, sans déplacement de contenu ; la sphère Voice ne réagit que brièvement à ses états actifs, sans répétition. Pause manuelle, mouvement réduit et suspension hors écran restent pris en compte.

Le catalogue et les références UX/UI historiques restent disponibles. Les tokens de leur thème ne sont pas migrés. Reveal conserve son comportement par défaut pour les autres usages ; la sphère partagée adopte aussi la politique sans boucle. Les captures réelles et la décision de revue sont dans [UX_REVIEW.md](UX_REVIEW.md).
