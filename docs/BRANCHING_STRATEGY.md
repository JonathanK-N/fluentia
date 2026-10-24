# Stratégie GitHub

Responsable : Jonathan Kakesa.

Branches permanentes : `main` (production), `dev` (intégration), `tests` (validation). Les branches temporaires partent de `dev`, puis font l’objet d’une PR vers `dev`. Les promotions utilisent des PR de `dev` vers `tests`, puis de `tests` vers `main`, après validation.

La mission utilise `frontend/mission-01`. Les noms de branches ne contiennent aucun nom d’assistant ou de générateur. Pas de développement direct sur `main`, de force push, de suppression d’une branche permanente, de fusion ou déploiement automatique non contrôlé.

Les commits utilisent l’identité Git réelle et des messages français précis. Le compte GitHub connecté a été vérifié comme JonathanK-N, Jonathan Kakesa. Aucune réécriture de l’historique initial. Retour arrière : fermer la PR avant fusion ; après fusion, créer un revert revu dans le même circuit de branches.
