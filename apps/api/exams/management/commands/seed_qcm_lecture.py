"""Installe le QCM Compréhension écrite – Fluentia : 39 questions pondérées, 699 points."""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from exams.data import qcm_lecture as qcm
from exams.models import Exam, Question, Choice

SLUG = "qcm-comprehension-ecrite-fluentia"


class Command(BaseCommand):
    help = "Créer le QCM de compréhension écrite (39 questions, barème de 699 points)"

    def add_arguments(self, parser):
        parser.add_argument("--author", required=True, help="E-mail ou identifiant de l’auteur")
        parser.add_argument("--reviewer", required=True, help="E-mail ou identifiant du relecteur, distinct de l’auteur")
        parser.add_argument("--publish", action="store_true", help="Publier la série après création")

    def user(self, key):
        found = get_user_model().objects.filter(Q(email__iexact=key) | Q(username=key)).first()
        if found is None:
            raise CommandError(f"Compte introuvable : {key}")
        return found

    @transaction.atomic
    def handle(self, *args, author, reviewer, publish, **options):
        author, reviewer = self.user(author), self.user(reviewer)
        if author == reviewer:
            raise CommandError("L’auteur et le relecteur doivent être deux comptes distincts.")
        exam, created = Exam.objects.get_or_create(
            slug=SLUG,
            version=1,
            defaults={
                "title": qcm.TITLE,
                "skill": Exam.Skill.READING,
                "mode": Exam.Mode.SIMULATION,
                "description": qcm.DESCRIPTION,
                "duration_seconds": 3600,
            },
        )
        if not created:
            self.stdout.write("QCM déjà présent — version figée, aucune modification.")
            return
        now = timezone.now()
        for position, (passage, statement, options, answer, hint) in enumerate(qcm.QUESTIONS, 1):
            level, points = qcm.palier(position)
            question = Question.objects.create(
                exam=exam,
                position=position,
                reading_passage=passage,
                statement=statement,
                explanation=f"Indice dans le texte : {hint}.",
                difficulty=level,
                points=points,
                source_reference=qcm.SOURCE,
                author=author,
                reviewer=reviewer,
                reviewed_at=now,
                validation_status=Question.Review.VALIDATED,
            )
            for index, label in enumerate(options):
                Choice.objects.create(
                    question=question, position=index + 1, label=label, is_correct="ABCD"[index] == answer
                )
        if publish:
            exam.is_published = True
            exam.save()
        total = sum(qcm.palier(p)[1] for p in range(1, len(qcm.QUESTIONS) + 1))
        state = "publiée" if publish else "en brouillon"
        self.stdout.write(self.style.SUCCESS(f"{len(qcm.QUESTIONS)} questions installées ({total} points), série {state}."))
