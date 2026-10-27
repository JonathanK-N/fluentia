"""Reprise en base des sujets originaux de Rédaction et d’Oral, jusqu’ici écrits dans le front."""

from django.db import migrations
from django.utils import timezone

PROVENANCE = "Sujets originaux rédigés pour Fluentia ; aucun sujet officiel reproduit."

WRITING = [
    (1, "Courriel, invitation ou message informatif", 60, 120, 10, [
        ("Invitation à un repas", "Vous organisez un repas partagé dans votre immeuble. Écrivez un message à vos voisins pour les inviter : précisez la date, le lieu, ce que chacun peut apporter et comment confirmer sa présence.", []),
        ("Changement de rendez-vous", "Vous deviez aider un ami à déménager samedi, mais vous avez un empêchement. Écrivez-lui pour vous excuser, expliquer la situation et proposer une autre solution.", []),
        ("Renseignements sur un club", "Vous souhaitez rejoindre le club de randonnée de votre quartier. Écrivez au responsable pour vous présenter et poser des questions sur les sorties, le matériel et l’inscription.", []),
    ]),
    (2, "Article de blogue, compte rendu, témoignage", 120, 150, 20, [
        ("Une première fois", "Pour le blogue d’une association d’accueil, racontez votre première semaine dans une nouvelle ville : ce qui vous a surpris, les difficultés rencontrées et ce qui vous a aidé.", []),
        ("Un événement local", "Vous avez participé à une fête de quartier. Rédigez un court article pour le journal local : décrivez l’événement, l’ambiance et donnez votre avis sur son organisation.", []),
        ("Un apprentissage marquant", "Un magazine en ligne recueille des témoignages sur le thème « Apprendre à tout âge ». Racontez une compétence que vous avez acquise récemment et ce qu’elle vous a apporté.", []),
    ]),
    (3, "Texte argumentatif à partir de deux documents", 120, 180, 30, [
        ("Le télétravail", "Lisez les deux opinions suivantes. Présentez-les en les comparant, puis donnez votre point de vue argumenté.", [
            "Travailler depuis chez soi permet de gagner du temps, de mieux organiser sa journée et de réduire la pollution liée aux trajets. Beaucoup de salariés se disent plus concentrés.",
            "Le télétravail isole. Sans échanges informels, l’esprit d’équipe s’affaiblit et la frontière entre vie professionnelle et vie personnelle disparaît peu à peu.",
        ]),
        ("Les écrans à l’école", "Lisez les deux opinions suivantes. Présentez-les en les comparant, puis donnez votre point de vue argumenté.", [
            "Les tablettes rendent les cours plus interactifs et préparent les élèves au monde numérique. Elles permettent aussi d’adapter les exercices au rythme de chacun.",
            "Multiplier les écrans en classe disperse l’attention. Lire sur papier et écrire à la main restent essentiels pour mémoriser et réfléchir.",
        ]),
    ]),
]

SPEAKING = [
    (1, 0, 120, [
        ("Se présenter", "Présentez-vous : votre parcours, votre travail ou vos études, et vos centres d’intérêt.", ["D’où venez-vous ?", "Que faites-vous au quotidien ?", "Pourquoi apprenez-vous le français ?", "Que faites-vous pendant votre temps libre ?"]),
        ("Votre ville", "Parlez de la ville où vous habitez ou aimeriez habiter.", ["Qu’appréciez-vous dans ce lieu ?", "Comment vous déplacez-vous ?", "Que conseilleriez-vous à un visiteur ?"]),
    ]),
    (2, 120, 330, [
        ("Un cours de cuisine", "Vous voulez vous inscrire à un atelier de cuisine. Posez des questions à l’organisateur pour obtenir toutes les informations utiles.", ["Horaires et durée", "Tarifs et paiement", "Niveau requis", "Matériel à apporter"]),
        ("Un logement à louer", "Vous appelez au sujet d’un appartement à louer. Interrogez le propriétaire pour décider si vous le visitez.", ["Loyer et charges", "Quartier et transports", "Date de disponibilité", "Conditions du bail"]),
    ]),
    (3, 0, 270, [
        ("Voyager seul", "« Voyager seul est la meilleure façon de découvrir un pays. » Qu’en pensez-vous ?", ["Liberté et rencontres", "Sécurité et budget", "Expérience personnelle"]),
        ("Les réseaux sociaux", "« Les réseaux sociaux rapprochent les gens plus qu’ils ne les éloignent. » Êtes-vous d’accord ?", ["Liens à distance", "Qualité des échanges", "Temps passé en ligne"]),
    ]),
]


def seed(apps, schema_editor):
    TaskSet = apps.get_model("pedagogy", "TaskSet")
    TaskSubject = apps.get_model("pedagogy", "TaskSubject")
    now = timezone.now()
    writing = TaskSet.objects.create(
        skill="writing", title="Sujets originaux Fluentia", state="published", is_active=True,
        provenance=PROVENANCE, published_at=now,
    )
    for number, genre, low, high, minutes, subjects in WRITING:
        for position, (title, prompt, documents) in enumerate(subjects, 1):
            TaskSubject.objects.create(
                task_set=writing, task_number=number, position=position, title=title, prompt=prompt,
                genre=genre, min_words=low, max_words=high, minutes=minutes,
                documents=[{"label": f"Document {i}", "text": text} for i, text in enumerate(documents, 1)],
            )
    speaking = TaskSet.objects.create(
        skill="speaking", title="Sujets originaux Fluentia", state="published", is_active=True,
        provenance=PROVENANCE, published_at=now,
    )
    for number, prep, speak, subjects in SPEAKING:
        for position, (title, prompt, cues) in enumerate(subjects, 1):
            TaskSubject.objects.create(
                task_set=speaking, task_number=number, position=position, title=title, prompt=prompt,
                prep_seconds=prep, speak_seconds=speak, cues=cues,
            )


def unseed(apps, schema_editor):
    apps.get_model("pedagogy", "TaskSet").objects.filter(
        title="Sujets originaux Fluentia", editor__isnull=True
    ).delete()


class Migration(migrations.Migration):
    dependencies = [("pedagogy", "0003_images_series_and_tasks")]
    operations = [migrations.RunPython(seed, unseed)]
