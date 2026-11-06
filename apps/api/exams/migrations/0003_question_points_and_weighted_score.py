"""Barème pondéré : points par question et score enregistré à la soumission.

SQLite reconstruit les tables modifiées ; les triggers de 0002 qui les citent sont
retirés le temps de l’opération, puis réinstallés à l’identique.
"""

from importlib import import_module

from django.conf import settings
from django.db import migrations, models

guards = import_module("exams.migrations.0002_integrity_guards")


class Migration(migrations.Migration):

    dependencies = [
        ('exams', '0002_integrity_guards'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(guards.uninstall, guards.install),
        migrations.AddField(
            model_name='attempt',
            name='max_score',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='attempt',
            name='score',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='question',
            name='points',
            field=models.PositiveSmallIntegerField(default=1, help_text='Points gagnés pour une bonne réponse'),
        ),
        migrations.AddConstraint(
            model_name='question',
            constraint=models.CheckConstraint(condition=models.Q(('points__gt', 0)), name='question_points_positive'),
        ),
        migrations.RunPython(guards.install, guards.uninstall),
    ]
