"""Images de documents, séries importées et sujets de Rédaction et d’Oral.

SQLite reconstruit la table de la banque : ses garde-fous (0002) sont retirés puis réinstallés,
recalculés sur les colonnes actuelles, ce qui fige aussi l’image des versions approuvées.
"""

import uuid
from importlib import import_module

from django.conf import settings
import django.db.models.deletion
from django.db import migrations, models


guards = import_module("pedagogy.migrations.0002_editorial_guards")


class Migration(migrations.Migration):

    dependencies = [
        ('exams', '0004_question_image'),
        ('pedagogy', '0002_editorial_guards'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(guards.uninstall, guards.install),
        migrations.AddField(
            model_name='bankitem',
            name='image_text',
            field=models.TextField(blank=True),
        ),
        migrations.CreateModel(
            name='ImageAsset',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=180)),
                ('sha256', models.CharField(max_length=64)),
                ('size', models.PositiveIntegerField()),
                ('width', models.PositiveIntegerField()),
                ('height', models.PositiveIntegerField()),
                ('content_type', models.CharField(choices=[('image/png', 'PNG'), ('image/jpeg', 'JPEG')], max_length=16)),
                ('provenance', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name='bankitem',
            name='image',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to='pedagogy.imageasset'),
        ),
        migrations.CreateModel(
            name='TaskSet',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('skill', models.CharField(choices=[('writing', 'Rédaction'), ('speaking', 'Oral')], max_length=16)),
                ('title', models.CharField(max_length=180)),
                ('state', models.CharField(choices=[('draft', 'Brouillon'), ('review', 'En révision'), ('approved', 'Approuvé humainement'), ('published', 'Publié')], default='draft', max_length=16)),
                ('is_active', models.BooleanField(default=False)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('review_note', models.TextField(blank=True)),
                ('provenance', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('published_at', models.DateTimeField(blank=True, null=True)),
                ('editor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='task_sets', to=settings.AUTH_USER_MODEL)),
                ('reviewer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='task_reviews', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='SeriesImport',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('skill', models.CharField(choices=[('reading', 'Lecture'), ('listening', 'Écoute'), ('writing', 'Rédaction'), ('speaking', 'Oral')], max_length=16)),
                ('title', models.CharField(max_length=180)),
                ('mode', models.CharField(blank=True, max_length=16)),
                ('description', models.TextField(blank=True)),
                ('duration_seconds', models.PositiveIntegerField(default=0)),
                ('file_name', models.CharField(max_length=255)),
                ('item_ids', models.JSONField(default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL)),
                ('exam', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='imports', to='exams.exam')),
                ('task_set', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='series', to='pedagogy.taskset')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='TaskSubject',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('task_number', models.PositiveSmallIntegerField()),
                ('position', models.PositiveSmallIntegerField()),
                ('title', models.CharField(max_length=180)),
                ('prompt', models.TextField()),
                ('genre', models.CharField(blank=True, max_length=180)),
                ('min_words', models.PositiveIntegerField(blank=True, null=True)),
                ('max_words', models.PositiveIntegerField(blank=True, null=True)),
                ('minutes', models.PositiveIntegerField(blank=True, null=True)),
                ('documents', models.JSONField(blank=True, default=list)),
                ('prep_seconds', models.PositiveIntegerField(blank=True, null=True)),
                ('speak_seconds', models.PositiveIntegerField(blank=True, null=True)),
                ('cues', models.JSONField(blank=True, default=list)),
                ('task_set', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='subjects', to='pedagogy.taskset')),
            ],
            options={
                'ordering': ['task_number', 'position'],
            },
        ),
        migrations.AddConstraint(
            model_name='taskset',
            constraint=models.UniqueConstraint(condition=models.Q(('is_active', True)), fields=('skill',), name='one_active_task_set_per_skill'),
        ),
        migrations.AddConstraint(
            model_name='taskset',
            constraint=models.CheckConstraint(condition=models.Q(('is_active', False), ('state', 'published'), _connector='OR'), name='active_task_set_published'),
        ),
        migrations.AddConstraint(
            model_name='tasksubject',
            constraint=models.UniqueConstraint(fields=('task_set', 'task_number', 'position'), name='unique_task_subject_position'),
        ),
        migrations.AddConstraint(
            model_name='tasksubject',
            constraint=models.CheckConstraint(condition=models.Q(('task_number__gte', 1), ('task_number__lte', 3)), name='task_number_one_to_three'),
        ),
        migrations.RunPython(guards.install, guards.uninstall),
    ]
