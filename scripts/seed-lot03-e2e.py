"""Base jetable : médias synthétiques et comptes explicitement fictifs de recette."""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "apps/api"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django

django.setup()
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from exams.models import Exam
from pedagogy.services import create_item, transition, publish_exam, upload_media
from pedagogy.tests import wav_upload, content

if os.getenv("FLUENTIA_E2E") != "1" or not settings.DEBUG:
    raise SystemExit("Interdit hors base jetable de recette avec DEBUG explicite.")
with transaction.atomic():
    User = get_user_model()
    editor, _ = User.objects.get_or_create(
        username="bank-editor-e2e",
        defaults={
            "email": "bank-editor@example.test",
            "is_staff": True,
            "is_superuser": True,
        },
    )
    reviewer, _ = User.objects.get_or_create(
        username="bank-reviewer-e2e",
        defaults={
            "email": "bank-reviewer@example.test",
            "is_staff": True,
            "is_superuser": True,
        },
    )
    for user in [editor, reviewer]:
        user.set_password("Edition!Fixture-7294")
        user.save()
    media = None
    for slug, title, skill, mode, count in [
        (
            "fixture-audio-training",
            "Écoute de recette — annonce",
            "listening",
            "training",
            1,
        ),
        (
            "fixture-reading-complete",
            "Lecture complète de recette — 39 questions",
            "reading",
            "simulation",
            39,
        ),
        (
            "fixture-listening-complete",
            "Écoute complète de recette — 39 questions",
            "listening",
            "simulation",
            39,
        ),
    ]:
        if Exam.objects.filter(slug=slug).exists():
            continue
        if skill == "listening" and media is None:
            media = upload_media(
                editor,
                wav_upload(),
                title="Signal synthétique de test, pas une voix",
                transcript="Signal synthétique de recette. La question de test demande le jour et l'heure : samedi à dix heures.",
                provenance="Signal PCM de 500 ms à 440 Hz généré pour tester le transport et la lecture. Aucune validation humaine.",
            )
        ids = []
        for index in range(count):
            item = create_item(
                editor,
                {
                    **content(skill, media if skill == "listening" else None),
                    "difficulty": ["A1", "A2", "B1", "B2", "C1", "C2"][
                        min(index // 7, 5)
                    ]
                    if mode == "simulation"
                    else "non_calibree",
                },
            )
            item = transition(editor, item.pk, item.revision, "request_review")
            item = transition(
                reviewer,
                item.pk,
                item.revision,
                "approve",
                note="Attestation FICTIVE strictement réservée à la recette automatisée.",
                attest=True,
            )
            ids.append(item.pk)
        publish_exam(
            editor,
            slug=slug,
            title=title,
            skill=skill,
            mode=mode,
            duration_seconds=2100
            if skill == "listening" and mode == "simulation"
            else 3600
            if mode == "simulation"
            else 120,
            item_ids=ids,
            description="Fixture technique synthétique. Aucun contenu validé pédagogiquement.",
        )
print("Recette Lot 03 préparée ; aucune banque réelle validée humainement.")
