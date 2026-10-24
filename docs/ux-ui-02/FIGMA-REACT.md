# Matrice Figma ↔ React

Responsable : Jonathan Kakesa. Référence de code : PR #1, SHA `82c5a0ecff25bc81cdf0366a274024d578fbf7a5`, **non intégrée dans dev**. Les noms React existants ont été relus ; les identifiants Figma sont hérités et leur relecture actuelle est bloquée par le quota. Aucun Code Connect configuré.

| ID | Nom Figma | ID hérité | React existant | Props | Tokens | États | Statut / écart / correction |
|---|---|---|---|---|---|---|---|
| DS01 | Button | 3:38 / 12:11 | Button | variant: primary/secondary/ghost ; loading ; disabled | action, on-action, focus, button-* | default, hover, focus, active, disabled, loading | React dans PR #1 ; Figma non validé. Vérifier auto-layout, contraintes, labels, scopes, ombres et focus avant réemploi. |
| DS02 | Field | 8:21 | Field | id, label, error, hint, attributs input | bg, text, control-border, danger, input-* | default, hover, focus, error, disabled | React dans PR #1 ; Figma non validé. Vérifier auto-layout, contraintes, labels, scopes, ombres et focus avant réemploi. |
| DS03 | Card | 8:66 | Card | className, attributs article | surface, border, radius, shadow | default, hover contextuel .competency | React dans PR #1 ; Figma non validé. Vérifier auto-layout, contraintes, labels, scopes, ombres et focus avant réemploi. |
| DS04 | Badge | 8:77 | Badge | children | tint, accent | default | React dans PR #1 ; Figma non validé. Vérifier auto-layout, contraintes, labels, scopes, ombres et focus avant réemploi. |
| DS05 | Alert | 8:84 | Alert | title, children, error | surface, border, accent, danger | info, erreur | React dans PR #1 ; Figma non validé. Vérifier auto-layout, contraintes, labels, scopes, ombres et focus avant réemploi. |
| DS06 | Notification | 8:97 | Notification | message, onDismiss | text, muted | visible, vide, fermeture | React dans PR #1 ; Figma non validé. Vérifier auto-layout, contraintes, labels, scopes, ombres et focus avant réemploi. |
| DS07 | Progress | 8:110 | Progress | value, label | action, tint | 0, 35, 100 ; bornes 0–100 | React dans PR #1 ; Figma non validé. Vérifier auto-layout, contraintes, labels, scopes, ombres et focus avant réemploi. |
| DS08 | Skeleton | 8:135 | Skeleton | label | tint, border | chargement, réduction des mouvements | React dans PR #1 ; Figma non validé. Vérifier auto-layout, contraintes, labels, scopes, ombres et focus avant réemploi. |
| DS09 | EmptyState | 8:138 | EmptyState | title, children | text, muted, accent | vide | React dans PR #1 ; Figma non validé. Vérifier auto-layout, contraintes, labels, scopes, ombres et focus avant réemploi. |
| DS10 | DataTable | 8:149 | DataTable | caption, rows: label/status | text, tint, border | rempli, vide | React dans PR #1 ; Figma non validé. Vérifier auto-layout, contraintes, labels, scopes, ombres et focus avant réemploi. |
| DS11 | BarChart | 8:168 | BarChart | title, values: label/value | action, tint | statique et équivalent textuel | React dans PR #1 ; Figma non validé. Vérifier auto-layout, contraintes, labels, scopes, ombres et focus avant réemploi. |
| DS12 | Tabs | 8:201 | Tabs | label, items: id/label/content | accent, focus, border | sélection, focus, flèches clavier | React dans PR #1 ; Figma non validé. Vérifier auto-layout, contraintes, labels, scopes, ombres et focus avant réemploi. |
| DS13 | Dialog | 8:230 | Dialog | title, description, trigger, children | surface, border, focus, radius | fermé, ouvert, Échap, retour du focus | React dans PR #1 ; Figma non validé. Vérifier auto-layout, contraintes, labels, scopes, ombres et focus avant réemploi. |
| DS14 | Header / Logo | 12:54 | Header / Logo | thème système/manuel, menu details ; PNG | surface, text, border | desktop, mobile fermé/ouvert, clair/sombre | React dans PR #1 ; Figma non validé. Vérifier auto-layout, contraintes, labels, scopes, ombres et focus avant réemploi. |

## Composants métier proposés — non implémentés dans React

| ID | Nom Figma prévu | React proposé | Props proposées | Tokens | États | Statut |
|---|---|---|---|---|---|---|
| UX01 | Navigation privée | PrivateNavigation | role, activeRoute, collapsed | surface, tint, text, focus | desktop, tablette/menu, mobile/menu ; refus rôle | Référence locale ou spécification ; aucun ID Figma nouveau, aucun export métier React. |
| UX02 | Lecteur audio | AudioPlayer | source, transcript, availability | surface, action, focus | prêt, lecture, pause, terminé, erreur, indisponible | Référence locale ou spécification ; aucun ID Figma nouveau, aucun export métier React. |
| UX03 | Microphone | MicrophoneControl | permission, recordingState, onStop | action, danger, focus | non demandé, demandé, refusé, écoute, arrêté | Référence locale ou spécification ; aucun ID Figma nouveau, aucun export métier React. |
| UX04 | Question QCM | ChoiceQuestion | prompt, options, selection, error | surface, control-border, action, danger | sans réponse, sélection, verrouillé, correction, erreur | Référence locale ou spécification ; aucun ID Figma nouveau, aucun export métier React. |
| UX05 | Éditeur de rédaction | WritingEditor | value, wordCount, saveState, onChange | surface, control-border, focus | vide, saisie, sauvegarde, brouillon, erreur, perte connexion | Référence locale ou spécification ; aucun ID Figma nouveau, aucun export métier React. |
| UX06 | Chronomètre | ExamTimer | remaining, deadline, warning | text, accent, danger | normal, avertissement, expiré ; serveur futur | Référence locale ou spécification ; aucun ID Figma nouveau, aucun export métier React. |
| UX07 | Sphère vocale | VoiceOrb | state, amplitude, reducedMotion | gradient-voice, accent, danger | attente, écoute, analyse, réponse, erreur, pause, fin | Référence locale ou spécification ; aucun ID Figma nouveau, aucun export métier React. |
| UX08 | Dialogue de sortie | SessionExitDialog | dirty, onConfirm, onCancel | surface, focus, danger | ouvert, annuler, confirmer, fin réseau | Référence locale ou spécification ; aucun ID Figma nouveau, aucun export métier React. |
| UX09 | Carte pédagogique | LearningCard | competency, duration, progress, availability | surface, border, action | disponible, en cours, terminé, verrouillé, indisponible | Référence locale ou spécification ; aucun ID Figma nouveau, aucun export métier React. |
| UX10 | Résumé de résultats | ResultSummary | observations, provenance, certified | surface, action, muted | fictif, en attente, erreur, absence de données | Référence locale ou spécification ; aucun ID Figma nouveau, aucun export métier React. |
| UX11 | Formule et facture | PlanCard / InvoiceTable | plan, priceStatus, invoiceState | surface, action, border | prix non approuvé, changement, annulation, refus | Référence locale ou spécification ; aucun ID Figma nouveau, aucun export métier React. |
| UX12 | Agenda | StudyAgenda | items, timeZone, onReschedule | surface, text, focus | liste, vide, conflit, replanification | Référence locale ou spécification ; aucun ID Figma nouveau, aucun export métier React. |
| UX13 | Relecture | ContentApproval | version, decision, comment | surface, danger, focus | brouillon, relecture, refus, approuvé, conflit version | Référence locale ou spécification ; aucun ID Figma nouveau, aucun export métier React. |
| UX14 | Invitation | MemberInvite | role, email, organization | surface, control-border, danger | vide, invalide, invitation, expiré, révoqué | Référence locale ou spécification ; aucun ID Figma nouveau, aucun export métier React. |
| UX15 | Filtres | ListFilters | query, selected, resultCount | surface, control-border, focus | tous, filtré, sans résultat, réinitialisé | Référence locale ou spécification ; aucun ID Figma nouveau, aucun export métier React. |

## Correspondance des tokens

Les tokens sémantiques gardent les noms `--bg`, `--surface`, `--text`, `--muted`, `--border`, `--control-border`, `--action`, `--on-action`, `--accent`, `--focus`, `--danger`, `--tint`. Les valeurs clair/sombre reprennent la PR #1. Le prototype v2 propose un rayon de carte de 16 px au lieu de 14,4 px, un rayon de contrôle de 10 px au lieu de 9,6 px et des espacements supplémentaires ; ces écarts sont **proposés**, pas harmonisés dans React.

Les syntaxes de primitives `var(--primitive-...)` héritées doivent être remplacées par les vrais noms CSS ou rendues explicitement disponibles avant publication. Vérifier les scopes de couleur utilisés à la fois en texte et en stroke. Le hover d’une carte pédagogique ne doit pas donner un rôle de bouton à un article non interactif.

Sources : `apps/web/components/ui/primitives.tsx`, `dialog.tsx`, `tabs.tsx`, `notification.tsx`, `components/navigation/header.tsx`, `components/branding/logo.tsx`, `app/globals.css`, tous lus sur la branche de la PR #1. Aucun de ces fichiers n’a été copié comme nouvelle implémentation métier dans la mission 02.
