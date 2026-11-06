# Suite après revue du lot 01

Responsable : Jonathan Kakesa. Aucun lancement de service externe ou lot déclaré terminé.

La [feuille de route fournie](sources/ROADMAP_BACKEND.md) reste la référence d’ordre de réalisation. Le prochain lot devra partir du dev autorisé après revue et fusion explicite, en coordonnant la PR #3 sans l’écraser.

1. Authentification : décider du contrat session même origine ou passerelle frontend, bootstrap CSRF, inscription et vérification du courriel, connexion/déconnexion, récupération, expiration de session, rate limits et isolation des rôles. Aucun secret dans le navigateur ni contournement CSRF.
2. Comptes : stratégie de modèle utilisateur avant toute migration de données réelle, profils/onboarding, consentements et politique de rétention/effacement compatible avec l’attribution des contenus pédagogiques. Pas de migration destructive automatique du modèle auth existant.
3. Expérience de lecture : UI sobre issue de la direction v3, catalogue réel, démarrage authentifié, horloge synchronisée au serveur, autosave, reprise, confirmation de sortie et soumission idempotente, erreurs de connexion et affichage non officiel du résultat. Aucun simple écran simulé ne sera déclaré parcours réel.
4. Contrôle vertical : Playwright depuis l’interface jusqu’à PostgreSQL, deux utilisateurs isolés, CSRF, reprise, délai passé pendant une requête, soumission simultanée et tests clavier/mobile. Les textes doivent être relus par des personnes qualifiées ; les données de test ne deviennent pas des contenus validés par défaut.
5. Courriel : adaptateur de développement sans envoi réel puis fournisseur explicitement choisi ; aucun service payant activé ou message envoyé à des tiers sans autorisation.

Les lots audio, expression, IA, coach, Stripe sandbox, multi-tenant et PWA restent séparés. Pour l’IA : contrats, budgets de consommation, sécurité des données, jeux d’évaluation et calibration humaine avant toute promesse pédagogique. Aucune promotion automatique vers tests/main ou Railway Production.
