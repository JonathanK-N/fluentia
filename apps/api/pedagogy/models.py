"""Banque éditoriale indépendante des examens historiques immuables."""

import uuid
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q, F


class MediaAsset(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=180)
    sha256 = models.CharField(max_length=64)
    size = models.PositiveIntegerField()
    duration_ms = models.PositiveIntegerField()
    transcript = models.TextField()
    provenance = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if type(self).objects.filter(pk=self.pk).exists():
            raise ValidationError(
                "Le média est immuable ; importez une nouvelle version."
            )
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class ImageAsset(models.Model):
    """Image privée d’un document (journal, lettre, affiche), immuable comme les médias audio."""

    class Kind(models.TextChoices):
        PNG = "image/png", "PNG"
        JPEG = "image/jpeg", "JPEG"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=180)
    sha256 = models.CharField(max_length=64)
    size = models.PositiveIntegerField()
    width = models.PositiveIntegerField()
    height = models.PositiveIntegerField()
    content_type = models.CharField(max_length=16, choices=Kind.choices)
    provenance = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if type(self).objects.filter(pk=self.pk).exists():
            raise ValidationError("L’image est immuable ; importez une nouvelle version.")
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class BankItem(models.Model):
    class State(models.TextChoices):
        DRAFT = "draft", "Brouillon"
        REVIEW = "review", "En révision"
        APPROVED = "approved", "Approuvé humainement"
        PUBLISHED = "published", "Publié dans un examen"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family = models.UUIDField(default=uuid.uuid4, editable=False)
    version = models.PositiveIntegerField(default=1)
    revision = models.PositiveIntegerField(default=1, editable=False)
    skill = models.CharField(
        max_length=16,
        choices=[
            ("reading", "Compréhension écrite"),
            ("listening", "Compréhension orale"),
        ],
    )
    difficulty = models.CharField(
        max_length=32,
        default="non_calibree",
        choices=[(v, v) for v in ["non_calibree", "A1", "A2", "B1", "B2", "C1", "C2"]],
    )
    statement = models.TextField()
    passage = models.TextField(blank=True)
    media = models.ForeignKey(
        MediaAsset, null=True, blank=True, on_delete=models.PROTECT
    )
    image = models.ForeignKey(
        ImageAsset, null=True, blank=True, on_delete=models.PROTECT
    )
    image_text = models.TextField(blank=True)
    choices = models.JSONField(default=list)
    correct_index = models.PositiveSmallIntegerField(default=0)
    explanation = models.TextField()
    origin = models.CharField(
        max_length=16,
        choices=[("original", "Original"), ("licensed", "Sous licence")],
        default="original",
    )
    provenance = models.TextField()
    credit = models.CharField(
        max_length=250,
        blank=True,
        help_text="Attribution réelle ; conserver les sources et contributions.",
    )
    editor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="bank_editions",
    )
    state = models.CharField(max_length=16, choices=State.choices, default=State.DRAFT)
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="bank_reviews",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        permissions = [
            ("review_bankitem", "Relire et approuver un contenu pédagogique"),
            ("publish_bankitem", "Assembler et publier un examen"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["family", "version"], name="bank_family_version_unique"
            ),
            models.CheckConstraint(
                condition=Q(version__gt=0) & Q(revision__gt=0),
                name="bank_version_positive",
            ),
            models.CheckConstraint(
                condition=Q(correct_index__gte=0, correct_index__lt=4),
                name="bank_correct_index_valid",
            ),
            models.CheckConstraint(
                condition=~Q(state__in=["approved", "published"])
                | (
                    Q(
                        editor__isnull=False,
                        reviewer__isnull=False,
                        reviewed_at__isnull=False,
                    )
                    & ~Q(editor=F("reviewer"))
                ),
                name="bank_review_distinct",
            ),
        ]

    def clean(self):
        if (
            not isinstance(self.choices, list)
            or len(self.choices) != 4
            or any(
                not isinstance(c, str) or not c.strip() or len(c) > 500
                for c in self.choices
            )
        ):
            raise ValidationError(
                {
                    "choices": "Quatre libellés non vides de 500 caractères maximum sont requis."
                }
            )
        if len({c.strip().casefold() for c in self.choices}) != 4:
            raise ValidationError(
                {"choices": "Les quatre choix doivent être distincts."}
            )
        if self.skill == "reading" and not self.passage.strip() and not self.image_id:
            raise ValidationError(
                {"passage": "Le texte de lecture ou une image du document est requis."}
            )
        if self.image_id and not self.image_text.strip():
            raise ValidationError(
                {"image_text": "Le texte de l’image est requis pour les lecteurs d’écran."}
            )
        if (
            self.state in [self.State.REVIEW, self.State.APPROVED, self.State.PUBLISHED]
            and self.skill == "listening"
            and not self.media_id
        ):
            raise ValidationError(
                {"media": "Ajoutez un document audio autorisé avant révision."}
            )
        if (
            self.state in [self.State.APPROVED, self.State.PUBLISHED]
            and not self.review_note.strip()
        ):
            raise ValidationError(
                {"review_note": "La relecture humaine doit être documentée."}
            )

    def save(self, *args, **kwargs):
        old = type(self).objects.filter(pk=self.pk).first()
        if old and old.state in [self.State.APPROVED, self.State.PUBLISHED]:
            raise ValidationError(
                "La version approuvée est figée. Créez une nouvelle version."
            )
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.skill} · v{self.version} · {self.statement[:70]}"


class EditorialEvent(models.Model):
    item = models.ForeignKey(BankItem, on_delete=models.PROTECT, related_name="events")
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.PROTECT
    )
    action = models.CharField(max_length=32)
    before = models.JSONField(default=dict)
    after = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]


class PublishedItem(models.Model):
    item = models.ForeignKey(
        BankItem, on_delete=models.PROTECT, related_name="publications"
    )
    question = models.OneToOneField(
        "exams.Question", on_delete=models.PROTECT, related_name="bank_source"
    )


class ListeningAccess(models.Model):
    attempt = models.ForeignKey(
        "exams.Attempt", on_delete=models.CASCADE, related_name="listening_accesses"
    )
    question = models.ForeignKey("exams.Question", on_delete=models.PROTECT)
    started_at = models.DateTimeField()
    ends_at = models.DateTimeField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["attempt", "question"], name="listening_access_unique"
            ),
            models.CheckConstraint(
                condition=Q(ends_at__gt=F("started_at")),
                name="listening_positive_window",
            ),
        ]


class ExamSeries(models.Model):
    slug = models.SlugField(primary_key=True, max_length=120)
    lock_version = models.PositiveBigIntegerField(default=0)


class SeriesImport(models.Model):
    """Une série importée depuis un modèle Excel, suivie jusqu’à sa publication."""

    class Skill(models.TextChoices):
        READING = "reading", "Lecture"
        LISTENING = "listening", "Écoute"
        WRITING = "writing", "Rédaction"
        SPEAKING = "speaking", "Oral"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    skill = models.CharField(max_length=16, choices=Skill.choices)
    title = models.CharField(max_length=180)
    mode = models.CharField(max_length=16, blank=True)
    description = models.TextField(blank=True)
    duration_seconds = models.PositiveIntegerField(default=0)
    file_name = models.CharField(max_length=255)
    # Questions de la banque, dans l’ordre du fichier (Lecture et Écoute).
    item_ids = models.JSONField(default=list)
    task_set = models.OneToOneField(
        "TaskSet", null=True, blank=True, on_delete=models.PROTECT, related_name="series"
    )
    exam = models.ForeignKey(
        "exams.Exam", null=True, blank=True, on_delete=models.PROTECT, related_name="imports"
    )
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class TaskSet(models.Model):
    """Sujets de Rédaction ou d’Oral : un jeu actif par épreuve, visible des étudiants."""

    class State(models.TextChoices):
        DRAFT = "draft", "Brouillon"
        REVIEW = "review", "En révision"
        APPROVED = "approved", "Approuvé humainement"
        PUBLISHED = "published", "Publié"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    skill = models.CharField(
        max_length=16, choices=[("writing", "Rédaction"), ("speaking", "Oral")]
    )
    title = models.CharField(max_length=180)
    state = models.CharField(max_length=16, choices=State.choices, default=State.DRAFT)
    is_active = models.BooleanField(default=False)
    editor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.PROTECT, related_name="task_sets"
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.PROTECT, related_name="task_reviews"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_note = models.TextField(blank=True)
    provenance = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["skill"], condition=Q(is_active=True), name="one_active_task_set_per_skill"
            ),
            models.CheckConstraint(
                condition=Q(is_active=False) | Q(state="published"), name="active_task_set_published"
            ),
        ]

    def __str__(self):
        return f"{self.get_skill_display()} · {self.title}"


class TaskSubject(models.Model):
    task_set = models.ForeignKey(TaskSet, on_delete=models.CASCADE, related_name="subjects")
    task_number = models.PositiveSmallIntegerField()
    position = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=180)
    prompt = models.TextField()
    # Rédaction
    genre = models.CharField(max_length=180, blank=True)
    min_words = models.PositiveIntegerField(null=True, blank=True)
    max_words = models.PositiveIntegerField(null=True, blank=True)
    minutes = models.PositiveIntegerField(null=True, blank=True)
    documents = models.JSONField(default=list, blank=True)
    # Oral
    prep_seconds = models.PositiveIntegerField(null=True, blank=True)
    speak_seconds = models.PositiveIntegerField(null=True, blank=True)
    cues = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["task_number", "position"]
        constraints = [
            models.UniqueConstraint(
                fields=["task_set", "task_number", "position"], name="unique_task_subject_position"
            ),
            models.CheckConstraint(
                condition=Q(task_number__gte=1, task_number__lte=3), name="task_number_one_to_three"
            ),
        ]
