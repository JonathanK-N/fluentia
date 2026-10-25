"""Banque versionnée et tentatives privées. Responsable : Jonathan Kakesa."""

import uuid
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q, F
from django.utils import timezone


class Exam(models.Model):
    class Skill(models.TextChoices):
        READING = "reading", "Compréhension écrite"
        LISTENING = "listening", "Compréhension orale"

    class Mode(models.TextChoices):
        TRAINING = "training", "Entraînement non officiel"
        SIMULATION = "simulation", "Simulation non officielle"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(max_length=120)
    version = models.PositiveIntegerField(default=1)
    title = models.CharField(max_length=180)
    skill = models.CharField(max_length=16, choices=Skill.choices)
    mode = models.CharField(max_length=16, choices=Mode.choices, default=Mode.TRAINING)
    description = models.TextField(blank=True)
    duration_seconds = models.PositiveIntegerField(default=900)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["slug", "-version"]
        constraints = [
            models.UniqueConstraint(
                fields=["slug", "version"], name="unique_exam_version"
            ),
            models.CheckConstraint(
                condition=Q(version__gt=0), name="exam_version_positive"
            ),
            models.CheckConstraint(
                condition=Q(duration_seconds__gt=0), name="exam_duration_positive"
            ),
            models.CheckConstraint(
                condition=Q(skill__in=["reading", "listening"]), name="exam_skill_valid"
            ),
            models.CheckConstraint(
                condition=Q(mode__in=["training", "simulation"]), name="exam_mode_valid"
            ),
            models.CheckConstraint(
                condition=Q(is_published=False) | Q(published_at__isnull=False),
                name="published_exam_has_date",
            ),
        ]

    def __str__(self):
        return f"{self.title} (v{self.version})"

    def clean(self):
        original = type(self).objects.filter(pk=self.pk).first()
        if original and original.published_at:
            frozen = [
                f.attname
                for f in self._meta.concrete_fields
                if f.name != "is_published"
            ]
            if any(getattr(self, name) != getattr(original, name) for name in frozen):
                raise ValidationError(
                    "Une version publiée est figée ; créez une nouvelle version."
                )
            return
        if self.is_published:
            questions = (
                list(self.questions.prefetch_related("choices")) if original else []
            )
            if not questions:
                raise ValidationError("Ajoutez des questions avant publication.")
            for question in questions:
                question.full_clean()
                choices = list(question.choices.all())
                if (
                    question.validation_status != Question.Review.VALIDATED
                    or len(choices) != 4
                    or sum(c.is_correct for c in choices) != 1
                ):
                    raise ValidationError(
                        "Chaque question publiée doit être validée et avoir quatre choix dont un seul correct."
                    )
            if self.mode == self.Mode.SIMULATION:
                duration = 3600 if self.skill == self.Skill.READING else 2100
                if len(questions) != 39 or self.duration_seconds != duration:
                    raise ValidationError(
                        "Une simulation doit respecter le format de compréhension TCF Canada (39 questions et durée adaptée)."
                    )

    def save(self, *args, **kwargs):
        # La date est conservée même après retrait du catalogue : pas de dégel.
        original = type(self).objects.filter(pk=self.pk).first()
        if self.is_published and not self.published_at:
            self.published_at = timezone.now()
        self.full_clean()
        if original and original.published_at:
            kwargs["update_fields"] = ["is_published"]
        return super().save(*args, **kwargs)


class Question(models.Model):
    class Review(models.TextChoices):
        DRAFT = "draft", "Brouillon pédagogique"
        VALIDATED = "validated", "Relue et validée"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exam = models.ForeignKey(Exam, on_delete=models.PROTECT, related_name="questions")
    position = models.PositiveIntegerField()
    statement = models.TextField()
    reading_passage = models.TextField(blank=True)
    audio_key = models.CharField(
        max_length=255,
        blank=True,
        help_text="Référence privée ; aucun média n’est livré par ce lot",
    )
    explanation = models.TextField(blank=True)
    difficulty = models.CharField(max_length=32, default="non_calibree")
    origin = models.CharField(
        max_length=16,
        choices=[("original", "Original"), ("licensed", "Sous licence")],
        default="original",
    )
    source_reference = models.TextField(
        blank=True, help_text="Provenance et autorisation du texte ou du média"
    )
    validation_status = models.CharField(
        max_length=16, choices=Review.choices, default=Review.DRAFT
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="authored_tcf_questions",
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="reviewed_tcf_questions",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["position"]
        constraints = [
            models.UniqueConstraint(
                fields=["exam", "position"], name="unique_exam_question_position"
            ),
            models.CheckConstraint(
                condition=Q(position__gt=0), name="question_position_positive"
            ),
            models.CheckConstraint(
                condition=Q(validation_status__in=["draft", "validated"]),
                name="question_review_valid",
            ),
            models.CheckConstraint(
                condition=Q(origin__in=["original", "licensed"]),
                name="question_origin_valid",
            ),
            models.CheckConstraint(
                condition=Q(validation_status="draft")
                | (
                    Q(
                        author__isnull=False,
                        reviewer__isnull=False,
                        reviewed_at__isnull=False,
                    )
                    & ~Q(author=F("reviewer"))
                ),
                name="validated_question_has_review",
            ),
        ]

    def clean(self):
        old = type(self).objects.filter(pk=self.pk).first()
        exam_ids = [self.exam_id] + ([old.exam_id] if old else [])
        if Exam.objects.filter(pk__in=exam_ids, published_at__isnull=False).exists():
            raise ValidationError("Les questions d’une version publiée sont figées.")
        if self.validation_status == self.Review.VALIDATED:
            if (
                not self.author_id
                or not self.reviewer_id
                or self.author_id == self.reviewer_id
                or not self.reviewed_at
            ):
                raise ValidationError(
                    "Une validation exige un auteur et un relecteur distincts, avec date."
                )
            if not self.explanation or (
                self.exam.skill == Exam.Skill.READING and not self.reading_passage
            ):
                raise ValidationError("Ajoutez le texte et l’explication pédagogique.")
            if (
                self.origin == "licensed" or self.exam.skill == Exam.Skill.LISTENING
            ) and not self.source_reference:
                raise ValidationError(
                    "La provenance et l’autorisation sont nécessaires."
                )
            if self.exam.skill == Exam.Skill.LISTENING and not self.audio_key:
                raise ValidationError("Le document audio autorisé est manquant.")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


class Choice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(
        Question, on_delete=models.PROTECT, related_name="choices"
    )
    position = models.PositiveSmallIntegerField()
    label = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)

    class Meta:
        ordering = ["position"]
        constraints = [
            models.UniqueConstraint(
                fields=["question", "position"], name="unique_choice_position"
            ),
            models.UniqueConstraint(
                fields=["question"],
                condition=Q(is_correct=True),
                name="at_most_one_correct_choice",
            ),
            models.CheckConstraint(
                condition=Q(position__gt=0), name="choice_position_positive"
            ),
        ]

    def clean(self):
        old = type(self).objects.filter(pk=self.pk).first()
        ids = [self.question_id] + ([old.question_id] if old else [])
        if Question.objects.filter(
            pk__in=ids, exam__published_at__isnull=False
        ).exists():
            raise ValidationError("Les choix d’une version publiée sont figés.")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


class Attempt(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "En cours"
        SUBMITTED = "submitted", "Terminée"
        EXPIRED = "expired", "Expirée"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tcf_attempts"
    )
    exam = models.ForeignKey(Exam, on_delete=models.PROTECT, related_name="attempts")
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.ACTIVE
    )
    started_at = models.DateTimeField(default=timezone.now, editable=False)
    expires_at = models.DateTimeField()
    submitted_at = models.DateTimeField(null=True, blank=True)
    correct_count = models.PositiveIntegerField(null=True, blank=True)
    question_count = models.PositiveIntegerField(null=True, blank=True)
    lock_version = models.PositiveBigIntegerField(default=0, editable=False)

    class Meta:
        indexes = [
            models.Index(
                fields=["user", "status", "expires_at"],
                name="attempt_user_status_deadline",
            )
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(expires_at__gt=F("started_at")),
                name="attempt_positive_window",
            ),
            models.CheckConstraint(
                condition=(
                    Q(
                        status__in=["active", "expired"],
                        submitted_at__isnull=True,
                        correct_count__isnull=True,
                        question_count__isnull=True,
                    )
                    | Q(
                        status="submitted",
                        submitted_at__isnull=False,
                        correct_count__isnull=False,
                        question_count__isnull=False,
                        question_count__gt=0,
                        correct_count__lte=F("question_count"),
                        submitted_at__gte=F("started_at"),
                        submitted_at__lt=F("expires_at"),
                    )
                ),
                name="attempt_terminal_consistency",
            ),
        ]


class Answer(models.Model):
    attempt = models.ForeignKey(
        Attempt, on_delete=models.CASCADE, related_name="answers"
    )
    question = models.ForeignKey(Question, on_delete=models.PROTECT)
    choice = models.ForeignKey(Choice, on_delete=models.PROTECT)
    saved_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["attempt", "question"], name="one_answer_per_attempt_question"
            )
        ]

    def clean(self):
        if (
            self.question_id
            and self.attempt_id
            and self.question.exam_id != self.attempt.exam_id
        ):
            raise ValidationError("La question n’appartient pas à la tentative.")
        if (
            self.choice_id
            and self.question_id
            and self.choice.question_id != self.question_id
        ):
            raise ValidationError("Le choix n’appartient pas à la question.")
