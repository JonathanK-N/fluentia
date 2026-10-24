"""Produire les tables de handoff à partir du catalogue. Responsable : Jonathan Kakesa."""
from pathlib import Path
import json
import subprocess

root=Path(__file__).resolve().parent
docs=root.parents[1]/'docs/ux-ui-02'
docs.mkdir(parents=True,exist_ok=True)
catalogue=json.loads((root/'catalogue.json').read_text(encoding='utf-8'))
def save(name,content):
    (docs/name).write_text(content.rstrip()+'\n',encoding='utf-8')
def table(headers,rows):
    return '| '+' | '.join(headers)+' |\n|'+ '|'.join(['---']*len(headers))+'|\n'+ '\n'.join('| '+' | '.join(str(v).replace('|',' / ') for v in row)+' |' for row in rows)+'\n'
pages=['00 — Cover & Index','01 — Foundations','02 — Branding','03 — Components','04 — Motion & Interaction','05 — Public Website','06 — Authentication','07 — Student App','08 — Voice Studio','09 — Teachers & Schools','10 — Administration','11 — Responsive & Accessibility','12 — Prototype Flows','13 — Handoff']
save('FIGMA-PLAN.md','# Plan de reprise Figma\n\nResponsable : Jonathan Kakesa. **Plan local, aucune page créée durant la mission 02.**\n\n'+table(['Page prévue','Contenu à transférer'],[[p,{'00':'Index, statuts et liens des 62 écrans','01':'Tokens sémantiques, styles et grilles','02':'PNG officiels et règles de marque','03':'Composants, propriétés, variantes et spécimens','04':'Storyboards et réduction des mouvements','05':'Onze pages publiques et structures légales','06':'Six écrans d’authentification','07':'Application étudiante, hors studio','08':'Sphère, commandes et sept états simulés','09':'Enseignants et établissements','10':'Administration et validations','11':'375/768/1440, zoom, contrastes et focus','12':'Huit parcours, erreurs et interruptions','13':'Mapping, backlog, sources et rapport'}[p[:2]]] for p in pages])+'''
## Ordre de reprise

1. Vérifier à nouveau le quota et les droits ; reconstruire l’inventaire réel avant mutation. La lecture actuelle est refusée, donc les identifiants hérités ne prouvent pas l’état actuel du canevas.
2. Corriger les six maquettes existantes, notamment les axes des conteneurs horizontaux, le repli des actions, les largeurs des descendants, le header et les hauteurs adaptatives.
3. Aligner les libellés sur React, les syntaxes WEB des primitives sur des variables réelles, les scopes de danger/focus, les ombres et les styles.
4. Construire les fondations et composants spécialisés avant les écrans. Réutiliser les 15 ensembles hérités lorsqu’ils sont valides ; ne pas les recréer automatiquement.
5. Créer les pages 00–13 seulement si le forfait le permet. Sinon conserver les mêmes groupes dans les pages autorisées, sans achat ni contournement.
6. Assembler les écrans en instances, textes éditables et Auto Layout ; copier seulement les PNG de contenu officiels. Aucun écran aplati en image comme livrable natif.
7. Régler un axe horizontal avec largeur fixe et hauteur automatique ; un axe vertical avec largeur contrainte et hauteur automatique. Ajuster les descendants des instances, pas seulement le cadre racine.
8. Vérifier visuellement chaque lot avant le suivant ; inspecter trois formats, états d’erreur et prototypes. Retirer la capture temporaire héritée 9:11 après transfert et validation.

Les identifiants existants proviennent de la PR #1 au SHA 82c5a0ecff25bc81cdf0366a274024d578fbf7a5. Aucun nouvel identifiant Figma n’a été obtenu. Le siège View / forfait Starter et le quota refusent actuellement les lectures ; Code Connect ne doit pas être annoncé comme configuré.
''')
nexts={'P01':'A01','P02':'S05','P03':'A06','P04':'S09','P05':'S19','P06':'S13','P07':'P08','P08':'confirmation locale','P09':'P08','P10':'P08','P11':'P08','A01':'A05','A02':'S01','A03':'confirmation neutre locale','A04':'A02','A05':'A06','A06':'S01','S01':'S05','S02':'choix de compétence','S03':'S05','S04':'séance sélectionnée','S05':'S22','S06':'S22','S07':'S23','S08':'S13','S09':'S10','S10':'S11','S11':'S03','S12':'séance ciblée','S13':'S24','S14':'S07','S15':'tableau équivalent','S16':'S22 / S23','S17':'séance sélectionnée','S18':'marquer comme lu','S19':'confirmation sans transaction','S20':'confirmation locale','S21':'confirmation locale','S22':'S05','S23':'S07','S24':'S03','T01':'T02','T02':'T04','T03':'T05','T04':'confirmation d’attribution','T05':'confirmation de retour','T06':'tableau équivalent','E01':'E02','E02':'confirmation illustrative','E03':'confirmation illustrative','E04':'confirmation illustrative','E05':'factures fictives','M01':'M03','M02':'confirmation illustrative','M03':'M06','M04':'liste de questions','M05':'structure fictive','M06':'validation / retour au brouillon','M07':'critères non calibrés','M08':'opérations fictives','M09':'tickets fictifs','M10':'confirmation locale'}
screen_intro='''# Inventaire et spécification des 62 écrans

Responsable : Jonathan Kakesa. Références locales, données fictives. **Tous les identifiants Figma v2 sont non obtenus.** Les pages et routes ci-dessous sont des cibles de conception, pas des routes métier déployées. Le prototype utilise des fragments locaux, par exemple `http://127.0.0.1:4173/#S01`.

## Contrat commun

1440 px : conteneur 1280 maximum, rail privé de 224 px ; 768 px : rail replié et menu accessible ; 375 px : une colonne, marges 20 px, actions repliables, tableaux dans leur propre région de défilement. Aux tailles intermédiaires, la grille ne doit jamais imposer un minimum plus large que le conteneur. Les boutons gardent une hauteur minimale de 46 px.

Nominal, chargement, vide, erreur, accès refusé et connexion interrompue sont examinables depuis « Examiner les états de conception ». Ce sélecteur est un outil de revue, pas une fonctionnalité produit cible. Le retour réessaie le même écran ; aucun événement réseau métier n’est simulé comme une vraie réussite.

Chaque écran conserve un h1, une navigation identifiée, des labels, un focus visible et des messages textuels. Le changement d’écran place le focus sur son titre. Les écrans légaux restent des structures à rédiger et faire valider ; les écrans administratifs génériques ne simulent pas un CRUD complet.

## Catalogue

'''
screen_intro+=table(['ID','Écran','Route cible','Rôle','Univers','Page Figma cible','Action / destination'],[[s['id'],s['title'],'`'+s['route']+'`',s['role'],s['universe'],s['figmaPage'],nexts[s['id']]] for s in catalogue['screens']])
screen_intro+='\n## Fiches de conception\n\n'
for s in catalogue['screens']:
    screen_intro+=f"### {s['id']} — {s['title']}\n\n- Intention : {s['task']}\n- Hiérarchie : navigation de l’univers, titre « {s['headline']} », contenu `{s['type']}`, action principale `{nexts[s['id']]}`, retours et états.\n- Formats : 375, 768 et 1440 px ; adaptation selon le contrat commun ci-dessus.\n- États : nominal, chargement, vide, erreur, accès refusé et interruption réseau simulés ; validations spécialisées selon le type de contenu.\n- Interaction : lien de navigation ou action locale ; confirmations avant sortie, publication ou modification sensible.\n- Données : fictives ; ni score officiel, ni authentification, ni paiement, ni microphone réel.\n- Statut : référence HTML locale créée ; conception native Figma et validation humaine finale bloquées.\n\n"
save('SCREENS.md',screen_intro)
save('FLOWS.md','# Huit parcours critiques\n\nResponsable : Jonathan Kakesa. Prototypes **locaux** ; aucune liaison de prototype Figma créée.\n\n'+table(['ID','Parcours','Étapes','Erreur','Interruption'],[[f['id'],f['title'],' → '.join(f['screens']),f['error'],f['interruption']] for f in catalogue['flows']])+'''
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
''')
existing=[('DS01','Button','3:38 / 12:11','Button','variant: primary/secondary/ghost ; loading ; disabled','action, on-action, focus, button-*','default, hover, focus, active, disabled, loading'),('DS02','Field','8:21','Field','id, label, error, hint, attributs input','bg, text, control-border, danger, input-*','default, hover, focus, error, disabled'),('DS03','Card','8:66','Card','className, attributs article','surface, border, radius, shadow','default, hover contextuel .competency'),('DS04','Badge','8:77','Badge','children','tint, accent','default'),('DS05','Alert','8:84','Alert','title, children, error','surface, border, accent, danger','info, erreur'),('DS06','Notification','8:97','Notification','message, onDismiss','text, muted','visible, vide, fermeture'),('DS07','Progress','8:110','Progress','value, label','action, tint','0, 35, 100 ; bornes 0–100'),('DS08','Skeleton','8:135','Skeleton','label','tint, border','chargement, réduction des mouvements'),('DS09','EmptyState','8:138','EmptyState','title, children','text, muted, accent','vide'),('DS10','DataTable','8:149','DataTable','caption, rows: label/status','text, tint, border','rempli, vide'),('DS11','BarChart','8:168','BarChart','title, values: label/value','action, tint','statique et équivalent textuel'),('DS12','Tabs','8:201','Tabs','label, items: id/label/content','accent, focus, border','sélection, focus, flèches clavier'),('DS13','Dialog','8:230','Dialog','title, description, trigger, children','surface, border, focus, radius','fermé, ouvert, Échap, retour du focus'),('DS14','Header / Logo','12:54','Header / Logo','thème système/manuel, menu details ; PNG','surface, text, border','desktop, mobile fermé/ouvert, clair/sombre')]
new=[('Navigation privée','PrivateNavigation','role, activeRoute, collapsed','surface, tint, text, focus','desktop, tablette/menu, mobile/menu ; refus rôle'),('Lecteur audio','AudioPlayer','source, transcript, availability','surface, action, focus','prêt, lecture, pause, terminé, erreur, indisponible'),('Microphone','MicrophoneControl','permission, recordingState, onStop','action, danger, focus','non demandé, demandé, refusé, écoute, arrêté'),('Question QCM','ChoiceQuestion','prompt, options, selection, error','surface, control-border, action, danger','sans réponse, sélection, verrouillé, correction, erreur'),('Éditeur de rédaction','WritingEditor','value, wordCount, saveState, onChange','surface, control-border, focus','vide, saisie, sauvegarde, brouillon, erreur, perte connexion'),('Chronomètre','ExamTimer','remaining, deadline, warning','text, accent, danger','normal, avertissement, expiré ; serveur futur'),('Sphère vocale','VoiceOrb','state, amplitude, reducedMotion','gradient-voice, accent, danger','attente, écoute, analyse, réponse, erreur, pause, fin'),('Dialogue de sortie','SessionExitDialog','dirty, onConfirm, onCancel','surface, focus, danger','ouvert, annuler, confirmer, fin réseau'),('Carte pédagogique','LearningCard','competency, duration, progress, availability','surface, border, action','disponible, en cours, terminé, verrouillé, indisponible'),('Résumé de résultats','ResultSummary','observations, provenance, certified','surface, action, muted','fictif, en attente, erreur, absence de données'),('Formule et facture','PlanCard / InvoiceTable','plan, priceStatus, invoiceState','surface, action, border','prix non approuvé, changement, annulation, refus'),('Agenda','StudyAgenda','items, timeZone, onReschedule','surface, text, focus','liste, vide, conflit, replanification'),('Relecture','ContentApproval','version, decision, comment','surface, danger, focus','brouillon, relecture, refus, approuvé, conflit version'),('Invitation','MemberInvite','role, email, organization','surface, control-border, danger','vide, invalide, invitation, expiré, révoqué'),('Filtres','ListFilters','query, selected, resultCount','surface, control-border, focus','tous, filtré, sans résultat, réinitialisé')]
save('FIGMA-REACT.md','# Matrice Figma ↔ React\n\nResponsable : Jonathan Kakesa. Référence de code : PR #1, SHA `82c5a0ecff25bc81cdf0366a274024d578fbf7a5`, **non intégrée dans dev**. Les noms React existants ont été relus ; les identifiants Figma sont hérités et leur relecture actuelle est bloquée par le quota. Aucun Code Connect configuré.\n\n'+table(['ID','Nom Figma','ID hérité','React existant','Props','Tokens','États','Statut / écart / correction'],[[*row,'React dans PR #1 ; Figma non validé. Vérifier auto-layout, contraintes, labels, scopes, ombres et focus avant réemploi.'] for row in existing])+'\n## Composants métier proposés — non implémentés dans React\n\n'+table(['ID','Nom Figma prévu','React proposé','Props proposées','Tokens','États','Statut'],[[f'UX{index:02}',*row,'Référence locale ou spécification ; aucun ID Figma nouveau, aucun export métier React.'] for index,row in enumerate(new,1)])+'''
## Correspondance des tokens

Les tokens sémantiques gardent les noms `--bg`, `--surface`, `--text`, `--muted`, `--border`, `--control-border`, `--action`, `--on-action`, `--accent`, `--focus`, `--danger`, `--tint`. Les valeurs clair/sombre reprennent la PR #1. Le prototype v2 propose un rayon de carte de 16 px au lieu de 14,4 px, un rayon de contrôle de 10 px au lieu de 9,6 px et des espacements supplémentaires ; ces écarts sont **proposés**, pas harmonisés dans React.

Les syntaxes de primitives `var(--primitive-...)` héritées doivent être remplacées par les vrais noms CSS ou rendues explicitement disponibles avant publication. Vérifier les scopes de couleur utilisés à la fois en texte et en stroke. Le hover d’une carte pédagogique ne doit pas donner un rôle de bouton à un article non interactif.

Sources : `apps/web/components/ui/primitives.tsx`, `dialog.tsx`, `tabs.tsx`, `notification.tsx`, `components/navigation/header.tsx`, `components/branding/logo.tsx`, `app/globals.css`, tous lus sur la branche de la PR #1. Aucun de ces fichiers n’a été copié comme nouvelle implémentation métier dans la mission 02.
''')
save('TOKENS.md','''# Design System Fluentia v2 — proposition de conception

Responsable : Jonathan Kakesa. Source locale : `design/ux-ui-02/tokens.css`. Bibliothèque native Figma v2 **bloquée** ; cette spécification n’est pas une bibliothèque publiée.

## Univers et sémantique

Discover : site sombre et immersif, bleu nuit et cyan. Learn : fonds clairs, surfaces blanches et bleu d’action. Voice : studio sombre, état vocal visible sans dépendre de la seule couleur. Les couleurs de marque restent #081B35, #1769E0, #21D4F4 et #F7FAFF.

| Token | Learn | Discover / Voice |
|---|---|---|
| bg / surface | #F7FAFF / #FFFFFF | #081B35 / #102944 |
| text / muted | #081B35 / #52647A | #F7FAFF / #B7C9DF |
| action / on-action | #1769E0 / #FFFFFF | #21D4F4 / #081B35 |
| accent / focus | #086B82 / #1769E0 | #21D4F4 / #21D4F4 |
| border décoratif | #C9D4E3 | #526982 |
| control-border | #71829A | #7E94AE |
| danger | #A12535 | #FFB1B9 |
| tint | #EAF1FC | #163658 |

La bordure décorative n’est pas le contour d’un champ. Les limites interactives utilisent control-border et le focus 3 px avec offset 4 px. Le cyan n’est pas utilisé comme petit texte sur blanc.

## Typographie et dimensions

Poppins locale 400/500/600/700, licence OFL-1.1 conservée. Corps 15 px / 1,7 ; contenu de lecture 16 px / 1,9 ; h1 privé 30–48 px et titre public 40–76 px ; h2 24 px ; h3 18 px ; contrôles 13 px ; métadonnées 11–12 px. Les titres n’utilisent pas de largeur fixe ; le retour à la ligne prime sur une troncature.

Échelle : 4, 8, 16, 24, 32, 48 et 64 px. Carte 24 px de padding, 20 px sur mobile ; rayon carte 16 px, contrôle 10 px, pilule 999 px. Ces rayons sont une proposition v2 à arbitrer face à la PR #1. Ombre carte : 0 12px 40px #081B3509 ; une ombre ne remplace jamais un contour de focus.

Grille publique 1280 px maximum. Rail privé 224 px, puis 192 px, repli sous 800 px ; deux colonnes de travail, une sous 600 px. Les listes d’administration utilisent des tableaux défilants dans leur conteneur ; leurs actions gardent des libellés visibles.

Gradient de marque : bleu électrique → cyan ; réservé à la décoration. Sphère : radial cyan → bleu → nuit. Aucun nouveau logo ni SVG reconstruit.

## États et propriétés

Utiliser les composants et propriétés de [la matrice](FIGMA-REACT.md). Les variantes de style ne doivent pas multiplier les contenus ; employer propriétés texte et swaps lorsque pertinents. Limiter chaque matrice à une taille révisable ; scinder clair/sombre ou familles si nécessaire. Les modes et pages Figma restent soumis au forfait réel. Aucun achat automatique.

La cohérence v2 n’est pas déclarée validée tant que les variantes natives, les rayons proposés et le rendu responsive n’ont pas reçu la recette requise.
''')
print('Spécifications des écrans, parcours, tokens, mapping et plan Figma générées.')
