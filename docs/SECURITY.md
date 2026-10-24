# 🛡️ Sécurité et gouvernance

**Responsable : Jonathan Kakesa**

- Aucune clé d'API ni mot de passe réel versionné dans Git.
- Gestion des sessions et autorisations côté serveur.
- MFA pour rôles sensibles, contrôle des accès entre établissements.
- Protection CSRF, CORS restrictif, TLS, rate limiting.
- Validation stricte des médias importés.
- Conservation limitée et suppression contrôlée des productions vocales.
- Validation des signatures Stripe et traitement idempotent des événements.
- Contrôles des injections de prompt et de l'accès aux données entre utilisateurs.
- Exigences canadiennes, québécoises et de protection des données à faire vérifier juridiquement.

> [!CAUTION]
> Ne pas activer la production tant que les tests de sécurité, restauration et parcours critiques ne sont pas validés.
