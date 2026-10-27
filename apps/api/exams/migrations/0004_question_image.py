"""Image de document par question : une lecture peut reposer sur un texte, une image ou les deux.

Les triggers de 0002 sont retirés pendant la reconstruction SQLite, puis réinstallés avec la
règle mise à jour : en lecture, le texte n’est plus exigé quand une image est fournie.
"""

from importlib import import_module

from django.db import migrations, models

guards = import_module("exams.migrations.0002_integrity_guards")

PASSAGE_RULE = "(NEW.skill = 'reading' AND length(trim(q.reading_passage)) = 0)"
PASSAGE_OR_IMAGE_RULE = (
    "(NEW.skill = 'reading' AND length(trim(q.reading_passage)) = 0"
    " AND length(trim(q.image_key)) = 0)"
)


def install(apps, schema_editor):
    original = guards.definitions
    rows = original(schema_editor.connection.vendor)
    if not any(PASSAGE_RULE in c for *_, c in rows):
        raise RuntimeError("Règle de lecture introuvable dans les garde-fous.")
    guards.definitions = lambda vendor: [
        (n, t, e, c.replace(PASSAGE_RULE, PASSAGE_OR_IMAGE_RULE)) for n, t, e, c in original(vendor)
    ]
    try:
        guards.install(apps, schema_editor)
    finally:
        guards.definitions = original


class Migration(migrations.Migration):
    dependencies = [("exams", "0003_question_points_and_weighted_score")]

    operations = [
        migrations.RunPython(guards.uninstall, guards.install),
        migrations.AddField(
            model_name="question",
            name="image_key",
            field=models.CharField(
                blank=True, help_text="Image privée du document (journal, lettre…)", max_length=64
            ),
        ),
        migrations.AddField(
            model_name="question",
            name="image_text",
            field=models.TextField(
                blank=True, help_text="Texte de l’image, lu par les lecteurs d’écran"
            ),
        ),
        migrations.RunPython(install, guards.uninstall),
    ]
