"""Construire le catalogue de conception local. Propriétaire : Jonathan Kakesa."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
groups = {
    'public': ('Discover', 'visiteur', '05 — Public Website', [
        ('P01','Accueil','/','landing','Maîtrisez le français, allez plus loin.','Choisir un premier parcours sans pression.'),
        ('P02','Fonctionnalités','/fonctionnalites','features','Quatre compétences, un parcours cohérent.','Explorer les outils sans promettre de résultats officiels.'),
        ('P03','Notre méthode','/methode','method','Un rythme qui vous ressemble.','Comprendre diagnostic, entraînement et révision.'),
        ('P04','Examens','/examens','exams','Se préparer avec des repères clairs.','Distinguer entraînement, examen blanc et épreuve officielle.'),
        ('P05','Tarifs','/tarifs','pricing','Choisir votre accompagnement.','Comparer des formules de démonstration ; prix à valider.'),
        ('P06','Démonstration','/demo','demo','Essayez une séance guidée.','Découvrir une simulation sans compte ni microphone.'),
        ('P07','Questions fréquentes','/faq','faq','Les réponses, simplement.','Trouver une réponse et contacter le support.'),
        ('P08','Contact','/contact','contact','Parlons de votre projet.','Simuler une demande sans transmission de données.'),
        ('P09','Confidentialité','/confidentialite','legal','Vos données, vos choix.','Structure de notice à faire valider ; aucun texte juridique approuvé.'),
        ('P10','Conditions d’utilisation','/conditions','legal','Un cadre d’utilisation clair.','Structure contractuelle à faire valider avant publication.'),
        ('P11','Accessibilité','/accessibilite','legal','Une préparation ouverte à chacun.','Présenter objectif, limites connues et canal de signalement.'),
    ]),
    'auth': ('Learn','visiteur','06 — Authentication',[
        ('A01','Inscription','/inscription','signup','Votre prochain chapitre commence ici.','Créer un compte simulé avec consentement explicite.'),
        ('A02','Connexion','/connexion','login','Heureux de vous retrouver.','Accéder à un espace fictif sans authentification réelle.'),
        ('A03','Mot de passe oublié','/mot-de-passe-oublie','recover','Retrouver votre espace.','Présenter une confirmation neutre, sans révéler un compte existant.'),
        ('A04','Réinitialisation','/reinitialisation','reset','Un nouveau départ sécurisé.','Gérer lien expiré et confirmation de mot de passe.'),
        ('A05','Vérification du courriel','/verification-courriel','verify','Vérifiez votre courriel.','Simuler renvoi, lien expiré et vérification.'),
        ('A06','Bienvenue','/bienvenue','onboarding','Construisons votre rythme.','Choisir objectif, disponibilité et diagnostic facultatif.'),
    ]),
    'student': ('Learn','étudiant','07 — Student App',[
        ('S01','Tableau de bord','/app','dashboard','Une petite étape, chaque jour.','Choisir une action utile et reprendre une séance.'),
        ('S02','Diagnostic','/app/diagnostic','diagnostic','Trouvons votre point de départ.','Diagnostic illustratif sans prédiction de score officiel.'),
        ('S03','Plan d’étude','/app/plan','plan','Votre semaine, à votre rythme.','Ajuster la charge et déplacer une séance.'),
        ('S04','Catalogue','/app/catalogue','catalog','La bonne séance, au bon moment.','Filtrer par compétence et durée illustrative.'),
        ('S05','Compréhension orale','/app/oral','audio-question','Écouter, comprendre, choisir.','QCM fictif avec transcription de démonstration.'),
        ('S06','Compréhension écrite','/app/lecture','reading','Lire avec intention.','Texte fictif, question et correction expliquée.'),
        ('S07','Expression écrite','/app/ecriture','writing','Faire entendre vos idées.','Rédiger un texte fictif et demander un retour simulé.'),
        ('S08','Expression orale','/app/expression-orale','speaking','Prendre la parole avec confiance.','Choisir une tâche et entrer dans le studio simulé.'),
        ('S09','Examens blancs','/app/examens','mock-list','Vous préparer au jour J.','Choisir une simulation sans prétendre reproduire un examen certifié.'),
        ('S10','Session d’examen','/app/examens/session','exam','Une question à la fois.','Durée illustrative ; quitter exige confirmation.'),
        ('S11','Résultats','/app/resultats','results','Comprendre pour avancer.','Afficher des repères fictifs, jamais un niveau TCF certifié.'),
        ('S12','Coach','/app/coach','coach','Une piste claire pour la suite.','Conseils prédéfinis, aucune IA connectée.'),
        ('S13','Studio vocal','/app/studio','voice','Votre voix a de l’avenir.','Simulation graphique ; aucun accès au microphone.'),
        ('S14','Rédaction et brouillons','/app/redaction','drafts','Laissez vos idées prendre forme.','Brouillon temporaire en mémoire, perdu au rechargement.'),
        ('S15','Progression','/app/progression','progress','Voir le chemin parcouru.','Données fictives, tableau équivalent au graphique.'),
        ('S16','Historique','/app/historique','history','Retrouver vos apprentissages.','Consulter les séances fictives et leurs retours.'),
        ('S17','Calendrier','/app/calendrier','calendar','Un rendez-vous avec vous-même.','Agenda en liste utilisable au clavier.'),
        ('S18','Notifications','/app/notifications','notifications','L’essentiel, au bon moment.','Marquer comme lu et régler les préférences simulées.'),
        ('S19','Abonnement','/app/abonnement','billing','Garder la maîtrise de votre formule.','Changement et annulation simulés, aucun paiement.'),
        ('S20','Profil','/app/profil','profile','Un espace qui vous ressemble.','Modifier un profil fictif sans données sensibles.'),
        ('S21','Paramètres','/app/parametres','settings','Votre confort, vos préférences.','Préférences locales temporaires et suppression simulée.'),
        ('S22','Correction','/app/correction','correction','Chaque réponse ouvre une piste.','Expliquer une réponse de démonstration.'),
        ('S23','Retour sur la rédaction','/app/feedback','feedback','Une idée, puis une amélioration.','Retour prédéfini et explicitement non évalué par une IA.'),
        ('S24','Rapport de séance orale','/app/rapport-oral','oral-report','Faire le point, sereinement.','Rapport fictif sans analyse ni enregistrement audio.'),
    ]),
    'teacher': ('Learn','enseignant','09 — Teachers & Schools',[
        ('T01','Espace enseignant','/enseignant','teacher-dashboard','Accompagner chaque progression.','Accéder aux classes et corrections en attente.'),
        ('T02','Classes','/enseignant/classes','classes','Votre classe, en un regard.','Ouvrir une classe fictive, sans données d’élèves réels.'),
        ('T03','Étudiants','/enseignant/etudiants','students','Un suivi attentif et structuré.','État des apprentissages et filtres simulés.'),
        ('T04','Devoirs','/enseignant/devoirs','assignment','Donner du sens à l’entraînement.','Préparer et attribuer un devoir fictif.'),
        ('T05','Corrections','/enseignant/corrections','review','Un retour qui fait progresser.','Commentaire et publication simulés, sans note officielle.'),
        ('T06','Statistiques de classe','/enseignant/statistiques','teacher-stats','Repérer les besoins du groupe.','Agrégats fictifs, aucun classement nominatif réel.'),
    ]),
    'school': ('Learn','gestionnaire','09 — Teachers & Schools',[
        ('E01','Établissement','/etablissement','school-dashboard','Un cadre pour apprendre ensemble.','Synthèse des accès et groupes fictifs.'),
        ('E02','Membres','/etablissement/membres','members','Les bonnes personnes, les bons accès.','Invitation et révocation simulées.'),
        ('E03','Groupes','/etablissement/groupes','groups','Organiser les apprentissages.','Affectation d’un groupe avec vérification de périmètre.'),
        ('E04','Licences','/etablissement/licences','licenses','Des accès lisibles et maîtrisés.','Attribution fictive, sans achat.'),
        ('E05','Facturation établissement','/etablissement/facturation','school-billing','Votre facturation, en toute clarté.','Factures fictives, aucune donnée bancaire ni transaction.'),
    ]),
    'admin': ('Learn','administrateur','10 — Administration',[
        ('M01','Administration','/admin','admin-dashboard','Piloter avec précision.','Supervision fictive et accès aux validations.'),
        ('M02','Utilisateurs','/admin/utilisateurs','users','Gérer les accès avec discernement.','Rôles fictifs et confirmation des actions sensibles.'),
        ('M03','Contenus','/admin/contenus','content','Des ressources prêtes à apprendre.','Brouillon, relecture et publication simulée.'),
        ('M04','Questions','/admin/questions','questions','La qualité commence par une question.','Versionner consigne, distracteurs et explication fictifs.'),
        ('M05','Examens','/admin/examens','admin-exams','Assembler un parcours cohérent.','Structure fictive et vérification de complétude.'),
        ('M06','Validations','/admin/validations','approval','Relire avant de publier.','Accepter ou renvoyer un contenu avec commentaire.'),
        ('M07','Modèles d’évaluation','/admin/modeles','rubric','Des critères explicites.','Critères de travail, non calibrés et non officiels.'),
        ('M08','Paiements','/admin/paiements','payments','Comprendre chaque opération.','Données fictives ; aucune opération de remboursement réelle.'),
        ('M09','Support','/admin/support','support','Une réponse attentive.','Ticket fictif, sans coordonnées personnelles.'),
        ('M10','Paramètres administration','/admin/parametres','admin-settings','Un fonctionnement sous contrôle.','Paramètres simulés ; secrets et clés exclus de la maquette.'),
    ]),
}
screens=[]
for group,(universe,role,page,items) in groups.items():
    for id,title,route,type,headline,task in items:
        screens.append(dict(id=id,title=title,route=route,type=type,headline=headline,task=task,group=group,role=role,universe='Voice' if type=='voice' else universe,figmaPage='08 — Voice Studio' if type=='voice' else page,formats=[375,768,1440],figmaId=None,localReference='prototype',status='référence locale à vérifier',states=['default','loading','empty','error','forbidden','offline'],data='fictives'))
flows=[
    dict(id='F01',title='Découverte → inscription → dashboard',screens=['P01','A01','A05','A06','S01'],error='Courriel invalide, consentement absent, lien expiré',interruption='Revenir sans création de compte ni conservation des mots de passe'),
    dict(id='F02',title='Compréhension orale → correction',screens=['S01','S05','S22'],error='Aucune réponse, média indisponible',interruption='Quitter via confirmation ; transcription disponible hors examen réel'),
    dict(id='F03',title='Expression écrite → feedback',screens=['S01','S07','S23'],error='Texte trop court pour la démonstration, analyse indisponible',interruption='Confirmation avant perte du brouillon temporaire'),
    dict(id='F04',title='Studio oral → simulation → rapport',screens=['S01','S13','S24'],error='Permission refusée simulée, déconnexion, délai dépassé',interruption='Pause, reprise et fin confirmée ; aucune capture audio'),
    dict(id='F05',title='Examen blanc → résultats',screens=['S01','S09','S10','S11'],error='Réponse manquante, délai fictif expiré',interruption='Confirmation de sortie et fin de session'),
    dict(id='F06',title='Gestion d’abonnement',screens=['S01','S19'],error='Paiement refusé simulé, formule indisponible',interruption='Annulation de dialogue sans changement ; aucun paiement'),
    dict(id='F07',title='Enseignant → classe → devoir',screens=['T01','T02','T04'],error='Classe sans étudiants, date absente',interruption='Abandonner le brouillon ou revenir à la classe'),
    dict(id='F08',title='Administrateur → contenu → validation',screens=['M01','M03','M06'],error='Champs incomplets, contenu refusé',interruption='Retour au brouillon et confirmation avant publication simulée'),
]
output={'version':'2.0-proposition','owner':'Jonathan Kakesa','notice':'Références locales : ni maquettes Figma enregistrées ni pages métier implémentées.','screens':screens,'flows':flows}
(ROOT/'catalogue.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'{len(screens)} écrans et {len(flows)} parcours spécifiés')
