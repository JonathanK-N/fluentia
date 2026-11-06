"""Rédige à l’avance les propositions de réponse manquantes du jeu de Rédaction actif.

Chaque proposition n’est payée qu’une fois ; après cette commande, les étudiants l’ont tout de suite.
"""

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from pedagogy.correction import AnswerIncomplete, CorrectionUnavailable, stored_answer
from pedagogy.models import ModelAnswer, TaskSubject


class Command(BaseCommand):
    help = "Rédige les propositions de réponse manquantes pour les sujets de Rédaction actifs."

    def handle(self, *args, **options):
        subjects = TaskSubject.objects.filter(task_set__skill="writing", task_set__is_active=True).exclude(
            model_answers__provider=settings.WRITING_CORRECTOR
        )
        total = subjects.count()
        if not total:
            self.stdout.write("Toutes les propositions sont déjà prêtes.")
            return
        for index, subject in enumerate(subjects, 1):
            try:
                stored_answer(subject)
            except CorrectionUnavailable as error:
                raise CommandError(str(error))
            except AnswerIncomplete:
                self.stdout.write(self.style.WARNING(f"[{index}/{total}] Tâche {subject.task_number} · {subject.title} : réponse incomplète, à relancer."))
                continue
            self.stdout.write(f"[{index}/{total}] Tâche {subject.task_number} · {subject.title} : prête.")
        ready = ModelAnswer.objects.filter(provider=settings.WRITING_CORRECTOR, subject__task_set__is_active=True).count()
        self.stdout.write(self.style.SUCCESS(f"{ready} proposition(s) prête(s)."))
