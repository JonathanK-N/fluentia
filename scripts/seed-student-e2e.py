"""Fixtures synthétiques réservées à une base de recette jetable, jamais une validation humaine."""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "apps/api"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django

django.setup()
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from exams.models import Exam, Question, Choice

from e2e_guard import require_disposable

require_disposable(settings)
with transaction.atomic():
    User = get_user_model()
    author, _ = User.objects.get_or_create(username="fixture-author-not-human")
    reviewer, _ = User.objects.get_or_create(username="fixture-reviewer-not-human")
    exam, created = Exam.objects.get_or_create(
        slug="fixture-lecture-e2e",
        version=1,
        defaults={
            "title": "Lecture de recette — atelier vélo",
            "skill": "reading",
            "duration_seconds": 600,
            "description": "Jeu synthétique de recette technique, sans validation pédagogique humaine.",
        },
    )
    if created:
        q = Question.objects.create(
            exam=exam,
            position=1,
            reading_passage="Samedi, l’atelier vélo ouvre à 10 h. Les réparations sont gratuites, mais chaque participant doit apporter les pièces à remplacer. Il est conseillé de réserver avant vendredi midi.",
            statement="Que doit apporter chaque participant ?",
            explanation="Le texte demande à chaque participant d’apporter les pièces à remplacer. Les réparations elles-mêmes sont gratuites.",
            author=author,
            reviewer=reviewer,
            reviewed_at=timezone.now(),
            validation_status="validated",
            source_reference="Fixture technique originale ; personnes synthétiques, aucune validation humaine.",
        )
        for position, label in enumerate(
            [
                "Les pièces à remplacer",
                "Une preuve de paiement",
                "Un vélo neuf",
                "Une réservation du samedi soir",
            ],
            1,
        ):
            Choice.objects.create(
                question=q, position=position, label=label, is_correct=position == 1
            )
        exam.is_published = True
        exam.save()
print("Fixture technique installée ; aucune banque pédagogique publiée.")
