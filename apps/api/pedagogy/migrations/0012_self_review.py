"""L’administrateur peut approuver ses propres imports : la base n’exige plus un relecteur distinct de l’éditeur.

La règle « personne distincte » reste appliquée dans le code pour les éditeurs qui ne sont pas administrateurs.
Les verrous de 0002 sont retirés pendant la reconstruction SQLite, puis réinstallés.
"""

from importlib import import_module

from django.conf import settings
from django.db import migrations, models

guards = import_module("pedagogy.migrations.0002_editorial_guards")


class Migration(migrations.Migration):

    dependencies = [
        ('pedagogy', '0011_mock_exam'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(guards.uninstall, guards.install),
        migrations.RemoveConstraint(
            model_name='bankitem',
            name='bank_review_distinct',
        ),
        migrations.AddConstraint(
            model_name='bankitem',
            constraint=models.CheckConstraint(condition=models.Q(models.Q(('state__in', ['approved', 'published']), _negated=True), models.Q(('editor__isnull', False), ('reviewed_at__isnull', False), ('reviewer__isnull', False)), _connector='OR'), name='bank_review_complete'),
        ),
        migrations.RunPython(guards.install, guards.uninstall),
    ]
