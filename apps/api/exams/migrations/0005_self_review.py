"""L’administrateur peut approuver ses propres imports : la base n’exige plus un relecteur distinct de l’auteur.

La règle « personne distincte » reste appliquée dans le code pour les éditeurs qui ne sont pas administrateurs.
Les triggers de 0002 (version 0004) sont retirés pendant la reconstruction SQLite, puis réinstallés sans
la condition « auteur = relecteur ».
"""

from importlib import import_module

from django.conf import settings
from django.db import migrations, models

guards = import_module("exams.migrations.0002_integrity_guards")
previous = import_module("exams.migrations.0004_question_image")

SAME_PERSON = " OR q.author_id = q.reviewer_id"


def install(apps, schema_editor):
    original = guards.definitions
    rows = original(schema_editor.connection.vendor)
    if not any(SAME_PERSON in c for *_, c in rows):
        raise RuntimeError("Règle « auteur = relecteur » introuvable dans les garde-fous.")
    guards.definitions = lambda vendor: [
        (n, t, e, c.replace(previous.PASSAGE_RULE, previous.PASSAGE_OR_IMAGE_RULE).replace(SAME_PERSON, ""))
        for n, t, e, c in original(vendor)
    ]
    try:
        guards.install(apps, schema_editor)
    finally:
        guards.definitions = original


class Migration(migrations.Migration):

    dependencies = [
        ("exams", "0004_question_image"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(guards.uninstall, previous.install),
        migrations.RemoveConstraint(
            model_name="question",
            name="validated_question_has_review",
        ),
        migrations.AddConstraint(
            model_name="question",
            constraint=models.CheckConstraint(
                condition=models.Q(("validation_status", "draft"), models.Q(("author__isnull", False), ("reviewed_at__isnull", False), ("reviewer__isnull", False)), _connector="OR"),
                name="validated_question_reviewed",
            ),
        ),
        migrations.RunPython(install, guards.uninstall),
    ]
