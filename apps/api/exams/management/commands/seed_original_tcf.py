"""Installe un exercice original illustratif, sans emprunt à des bases tierces."""

from django.core.management.base import BaseCommand
from django.db import transaction
from exams.models import Exam, Question, Choice

SAMPLES = [
    {
        "passage": "La médiathèque du quartier sera fermée lundi pour des travaux. Les abonnés pourront rendre leurs livres dans la boîte extérieure et emprunter de nouveaux documents dès mardi matin.",
        "question": "Quand les abonnés pourront-ils emprunter de nouveaux documents ?",
        "options": ["Lundi matin", "Lundi soir", "Mardi matin", "Mercredi soir"],
        "answer": 2,
        "explanation": "Le texte précise que les nouveaux emprunts reprennent mardi matin.",
    },
    {
        "passage": "À partir du 1er novembre, la ligne 7 desservira le centre sportif toutes les vingt minutes, sauf le dimanche. Les horaires détaillés seront affichés aux arrêts dès vendredi.",
        "question": "Quelle restriction concerne le nouveau service ?",
        "options": [
            "Il est réservé aux étudiants",
            "Il ne fonctionne pas le dimanche",
            "Il est gratuit le samedi",
            "Il commence chaque vendredi",
        ],
        "answer": 1,
        "explanation": "La fréquence annoncée exclut explicitement le dimanche.",
    },
    {
        "passage": "Camille souhaite participer à l'atelier de photographie, mais les inscriptions sont closes. L'organisatrice lui propose de laisser son adresse e-mail afin d'être contactée si une place se libère.",
        "question": "Pourquoi Camille doit-elle laisser son adresse e-mail ?",
        "options": [
            "Pour payer sa participation",
            "Pour recevoir les photos",
            "Pour être prévenue d'une place disponible",
            "Pour annuler son inscription",
        ],
        "answer": 2,
        "explanation": "Le message annonce une liste d'attente, pas une inscription confirmée.",
    },
]


class Command(BaseCommand):
    help = "Créer un mini-examen de compréhension écrite avec textes originaux"

    @transaction.atomic
    def handle(self, *args, **options):
        exam, created = Exam.objects.get_or_create(
            slug="lecture-originale-demo",
            version=1,
            defaults={
                "title": "Lecture pratique — démonstration",
                "skill": "reading",
                "description": "Trois questions originales d'entraînement, sans score officiel.",
                "duration_seconds": 600,
                "is_published": False,
            },
        )
        if not created:
            self.stdout.write(
                "Démonstration déjà présente — aucune modification des questions versionnées."
            )
            return
        for index, data in enumerate(SAMPLES, start=1):
            q = Question.objects.create(
                exam=exam,
                position=index,
                statement=data["question"],
                reading_passage=data["passage"],
                explanation=data["explanation"],
            )
            for ci, label in enumerate(data["options"]):
                Choice.objects.create(
                    question=q,
                    position=ci + 1,
                    label=label,
                    is_correct=(ci == data["answer"]),
                )
        self.stdout.write(
            self.style.SUCCESS(
                "3 questions originales ajoutées en brouillon, à attribuer et faire relire avant publication."
            )
        )
