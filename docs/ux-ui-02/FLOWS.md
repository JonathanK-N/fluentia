# Huit parcours critiques

Responsable : Jonathan Kakesa. Prototypes **locaux** ; aucune liaison de prototype Figma créée.

| ID | Parcours | Étapes | Erreur | Interruption |
|---|---|---|---|---|
| F01 | Découverte → inscription → dashboard | P01 → A01 → A05 → A06 → S01 | Courriel invalide, consentement absent, lien expiré | Revenir sans création de compte ni conservation des mots de passe |
| F02 | Compréhension orale → correction | S01 → S05 → S22 | Aucune réponse, média indisponible | Quitter via confirmation ; transcription disponible hors examen réel |
| F03 | Expression écrite → feedback | S01 → S07 → S23 | Texte trop court pour la démonstration, analyse indisponible | Confirmation avant perte du brouillon temporaire |
| F04 | Studio oral → simulation → rapport | S01 → S13 → S24 | Permission refusée simulée, déconnexion, délai dépassé | Pause, reprise et fin confirmée ; aucune capture audio |
| F05 | Examen blanc → résultats | S01 → S09 → S10 → S11 | Réponse manquante, délai fictif expiré | Confirmation de sortie et fin de session |
| F06 | Gestion d’abonnement | S01 → S19 | Paiement refusé simulé, formule indisponible | Annulation de dialogue sans changement ; aucun paiement |
| F07 | Enseignant → classe → devoir | T01 → T02 → T04 | Classe sans étudiants, date absente | Abandonner le brouillon ou revenir à la classe |
| F08 | Administrateur → contenu → validation | M01 → M03 → M06 | Champs incomplets, contenu refusé | Retour au brouillon et confirmation avant publication simulée |

## Contrat des interactions

F01 : prénom, courriel fictif, mot de passe de démonstration et consentement sont vérifiés localement. La vérification et le renvoi ne déclenchent aucun courriel. L’onboarding mène au dashboard fictif. Le diagnostic est facultatif.

F02 : la réponse vide affiche une erreur liée au champ et le focus revient à la première option. Une réponse choisie ouvre une correction prédéfinie. La lecture audio est un message de simulation ; une transcription reste consultable.

F03 : la saisie reste en mémoire seulement. Le compteur est réel dans le prototype ; le seuil de cinq mots teste l’interface, sans valeur de consigne officielle. Le feedback est prédéfini et le retour au brouillon retrouve la saisie de cette visite. La sortie demande confirmation.

F04 : les commandes traversent les états du studio ; erreur, pause, reprise et fin peuvent être examinées. Aucun microphone, MediaRecorder, service de transcription ou IA. Le rapport ne découle d’aucune analyse réelle.

F05 : le chronomètre est un spécimen statique de deux minutes, sans valeur de durée officielle. La fin demande confirmation ; Échap annule et restaure le focus. Les résultats sont des valeurs fictives, sans conversion vers un niveau TCF.

F06 : changement et annulation de formule demandent confirmation. Le badge et le retour local changent, sans paiement ni engagement. La future transaction, les refus de prestataire et les remboursements ne sont pas implémentés.

F07 : classe fictive, titre et date indicative ; confirmation avant attribution. L’interface ne crée aucun devoir ni notification réelle. La modification avancée et la création de classe restent des scénarios à détailler.

F08 : commentaire obligatoire avant validation ou retour au brouillon. Confirmation de validation puis badge local. Aucun contenu n’est publié et aucun rôle réel n’est accordé.

Les actions génériques « Préparer un élément » des listes ne sont pas des éditeurs complets : elles examinent seulement une confirmation. Un lien d’index permet d’atteindre les écrans encore partiels sans prétendre finaliser tous les parcours secondaires.
