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
                # L’administrateur peut relire son propre import : la personne distincte est vérifiée dans services.
                condition=~Q(state__in=["approved", "published"])
                | Q(editor__isnull=False, reviewer__isnull=False, reviewed_at__isnull=False),
                name="bank_review_complete",
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

    def __str__(self):
        return f"{self.task_set.title} · tâche {self.task_number} · {self.title}"

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


class WritingCorrection(models.Model):
    """Correction automatique d’un texte de Rédaction ; sert aussi à compter la limite quotidienne."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="writing_corrections")
    subject = models.ForeignKey(TaskSubject, null=True, on_delete=models.SET_NULL, related_name="corrections")
    # Texte écrit pendant un Examen TCF : corrigé seulement à la fin de l’examen.
    run = models.ForeignKey("MockExamRun", null=True, blank=True, on_delete=models.SET_NULL, related_name="writing")
    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        RUNNING = "running", "En cours"
        DONE = "done", "Terminée"

    text = models.TextField()
    result = models.JSONField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DONE)
    provider = models.CharField(max_length=32)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "created_at"])]


class SpeakingSession(models.Model):
    """Passage d’une tâche d’Oral avec l’examinateur IA ; sert aussi à compter les minutes du jour."""

    class Mode(models.TextChoices):
        PRACTICE = "practice", "Entraînement"
        SIMULATION = "simulation", "Simulation d’examen"

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        LIVE = "live", "En cours"
        FINISHED = "finished", "Terminée"
        FAILED = "failed", "Échouée"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="speaking_sessions")
    subject = models.ForeignKey(TaskSubject, null=True, on_delete=models.SET_NULL, related_name="speaking_sessions")
    # Tâche passée pendant un Examen TCF : corrigée seulement à la fin de l’examen.
    run = models.ForeignKey("MockExamRun", null=True, blank=True, on_delete=models.SET_NULL, related_name="speaking")
    mode = models.CharField(max_length=16, choices=Mode.choices)
    provider = models.CharField(max_length=32)
    model = models.CharField(max_length=64, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    # Secondes réservées à l’ouverture, puis secondes réellement parlées à la fin.
    seconds = models.PositiveIntegerField(default=0)
    transcript = models.JSONField(default=list, blank=True)
    result = models.JSONField(null=True, blank=True)
    # Correction de la séance terminée : « pending » à la fin de la tâche, « running » pendant la lecture, « done » ensuite.
    correction_status = models.CharField(max_length=16, blank=True, default="")
    # Jetons rapportés par la session vocale ; vide si le navigateur n’a rien transmis.
    usage = models.JSONField(default=dict, blank=True)
    estimated_cost_usd = models.DecimalField(max_digits=10, decimal_places=6, default=0)

    class Meta:
        ordering = ["-started_at"]
        indexes = [models.Index(fields=["user", "started_at"])]


class ModelAnswer(models.Model):
    """Proposition de réponse à un sujet, rédigée une seule fois par fournisseur et partagée par tous."""

    subject = models.ForeignKey(TaskSubject, on_delete=models.CASCADE, related_name="model_answers")
    provider = models.CharField(max_length=32)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["subject", "provider"], name="one_model_answer_per_provider")]


def _subject_choices(skill, number):
    return {"task_set__skill": skill, "task_number": number}


class MockExam(models.Model):
    """« Examen TCF » composé dans l’administration : les 4 épreuves, passées dans l’ordre du test.

    Écoute puis Lecture (séries QCM chronométrées), Rédaction (3 sujets, 60 minutes pour les trois),
    puis Oral (3 sujets avec l’examinateur IA)."""

    WRITING_MINUTES = 60

    title = models.CharField("titre", max_length=180, help_text="Par exemple « Examen TCF 1 ».")
    position = models.PositiveSmallIntegerField("ordre", default=1)
    is_published = models.BooleanField("publié", default=False, help_text="Visible des étudiants dans Simulations TCF.")
    listening = models.ForeignKey(
        "exams.Exam", verbose_name="Écoute", null=True, on_delete=models.SET_NULL, related_name="+",
        limit_choices_to={"skill": "listening", "is_published": True},
    )
    reading = models.ForeignKey(
        "exams.Exam", verbose_name="Lecture", null=True, on_delete=models.SET_NULL, related_name="+",
        limit_choices_to={"skill": "reading", "is_published": True},
    )
    writing_1 = models.ForeignKey(TaskSubject, verbose_name="Rédaction · tâche 1", null=True, on_delete=models.SET_NULL, related_name="+", limit_choices_to=_subject_choices("writing", 1))
    writing_2 = models.ForeignKey(TaskSubject, verbose_name="Rédaction · tâche 2", null=True, on_delete=models.SET_NULL, related_name="+", limit_choices_to=_subject_choices("writing", 2))
    writing_3 = models.ForeignKey(TaskSubject, verbose_name="Rédaction · tâche 3", null=True, on_delete=models.SET_NULL, related_name="+", limit_choices_to=_subject_choices("writing", 3))
    speaking_1 = models.ForeignKey(TaskSubject, verbose_name="Oral · tâche 1", null=True, on_delete=models.SET_NULL, related_name="+", limit_choices_to=_subject_choices("speaking", 1))
    speaking_2 = models.ForeignKey(TaskSubject, verbose_name="Oral · tâche 2", null=True, on_delete=models.SET_NULL, related_name="+", limit_choices_to=_subject_choices("speaking", 2))
    speaking_3 = models.ForeignKey(TaskSubject, verbose_name="Oral · tâche 3", null=True, on_delete=models.SET_NULL, related_name="+", limit_choices_to=_subject_choices("speaking", 3))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["position", "id"]
        verbose_name = "Examen TCF"
        verbose_name_plural = "Examens TCF"

    def __str__(self):
        return self.title

    def writing_subjects(self):
        return [self.writing_1, self.writing_2, self.writing_3]

    def speaking_subjects(self):
        return [self.speaking_1, self.speaking_2, self.speaking_3]

    def complete(self):
        """Les 4 épreuves sont choisies : sinon l’examen n’est pas proposé aux étudiants."""
        return all([self.listening, self.reading, *self.writing_subjects(), *self.speaking_subjects()])

    def clean(self):
        errors = {}
        if self.listening and self.listening.skill != "listening":
            errors["listening"] = "Choisissez une série d’Écoute."
        if self.reading and self.reading.skill != "reading":
            errors["reading"] = "Choisissez une série de Lecture."
        for skill, subjects in (("writing", self.writing_subjects()), ("speaking", self.speaking_subjects())):
            for number, subject in enumerate(subjects, start=1):
                if subject and (subject.task_set.skill != skill or subject.task_number != number):
                    errors[f"{skill}_{number}"] = f"Choisissez un sujet de la tâche {number}."
        if self.is_published and not self.complete():
            errors["is_published"] = "Choisissez les 4 épreuves avant de publier l’examen."
        if errors:
            raise ValidationError(errors)


class MockExamRun(models.Model):
    """Passage d’un Examen TCF par un étudiant ; reprend là où il s’est arrêté, corrigé à la fin."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mock_exam_runs")
    exam = models.ForeignKey(MockExam, on_delete=models.CASCADE, related_name="runs")
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    listening_attempt = models.ForeignKey("exams.Attempt", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    reading_attempt = models.ForeignKey("exams.Attempt", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    writing_started_at = models.DateTimeField(null=True, blank=True)
    writing_submitted_at = models.DateTimeField(null=True, blank=True)
    # Tâches d’Oral passées sans examinateur (plus d’essais, service indisponible) : elles comptent pour zéro.
    speaking_skipped = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["-started_at"]
        verbose_name = "passage d’Examen TCF"
        verbose_name_plural = "passages d’Examen TCF"
