"""Transitions sérialisées ; expiration validée avant de lever une erreur REST."""

from datetime import timedelta
from django.db import transaction
from django.db.models import F, Sum
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError
from .models import Attempt, Answer, Choice, Question, Exam


def create_attempt(*, user, exam: Exam) -> Attempt:
    return start_attempt(user=user, exam=exam, resume=False)[0]


def start_attempt(*, user, exam: Exam, resume=True) -> tuple[Attempt, bool]:
    """Ouvre une séance ; avec ``resume``, reprend celle de la même série dont le chrono tourne encore.

    Renvoie (séance, créée). Le verrou sur l’examen évite deux séances ouvertes par un double clic.
    """
    with transaction.atomic():
        locked = Exam.objects.select_for_update().get(pk=exam.pk)
        if not locked.is_published or not locked.published_at:
            raise NotFound("Examen indisponible.")
        now = timezone.now()
        if resume:
            running = (
                Attempt.objects.filter(user=user, exam=locked, status=Attempt.Status.ACTIVE, expires_at__gt=now)
                .order_by("-started_at")
                .first()
            )
            if running is not None:
                return running, False
        return Attempt.objects.create(
            user=user,
            exam=locked,
            started_at=now,
            expires_at=now + timedelta(seconds=locked.duration_seconds),
        ), True


def expire_overdue(user) -> int:
    """Ferme les séances dont le chrono est écoulé : elles ne restent pas « en cours » indéfiniment."""
    return Attempt.objects.filter(
        user=user, status=Attempt.Status.ACTIVE, expires_at__lte=timezone.now()
    ).update(status=Attempt.Status.EXPIRED)


def _locked_attempt(attempt_id, user) -> Attempt:
    # Première instruction d’écriture : verrou de ligne PostgreSQL et verrou d’écriture SQLite.
    # Toutes les transitions, y compris la lecture expirante, passent par ce même verrou.
    changed = Attempt.objects.filter(pk=attempt_id, user=user).update(
        lock_version=F("lock_version") + 1
    )
    if not changed:
        raise NotFound("Tentative introuvable.")
    return Attempt.objects.select_related("exam").get(pk=attempt_id, user=user)


def _expire(attempt: Attempt) -> bool:
    if attempt.status == Attempt.Status.ACTIVE and timezone.now() >= attempt.expires_at:
        attempt.status = Attempt.Status.EXPIRED
        attempt.save(update_fields=["status"])
    return attempt.status == Attempt.Status.EXPIRED


def _active_error(attempt: Attempt) -> str | None:
    if _expire(attempt):
        return "Le temps de cette tentative est écoulé."
    if attempt.status != Attempt.Status.ACTIVE:
        return "Cette tentative est déjà terminée."
    return None


def get_attempt(*, attempt_id, user) -> Attempt:
    with transaction.atomic():
        attempt = _locked_attempt(attempt_id, user)
        _expire(attempt)
    return attempt


def save_answer(*, attempt_id, user, question_id, choice_id) -> Answer:
    answer = None
    with transaction.atomic():
        attempt = _locked_attempt(attempt_id, user)
        error = _active_error(attempt)
        if not error:
            question = Question.objects.filter(
                pk=question_id, exam_id=attempt.exam_id
            ).first()
            if question is None:
                raise ValidationError(
                    {"question_id": "Cette question ne fait pas partie de l’examen."}
                )
            choice = Choice.objects.filter(
                pk=choice_id, question_id=question.pk
            ).first()
            if choice is None:
                raise ValidationError(
                    {"choice_id": "Réponse invalide pour cette question."}
                )
            # Recontrôle après les lectures : une validation lente ne prolonge pas le délai.
            error = _active_error(attempt)
            if not error:
                answer, _ = Answer.objects.update_or_create(
                    attempt=attempt, question=question, defaults={"choice": choice}
                )
    if error:
        # Hors atomic : l’état expired ne doit pas être annulé par le rollback d’une exception.
        raise ValidationError({"attempt": error})
    return answer


def submit_attempt(*, attempt_id, user) -> Attempt:
    with transaction.atomic():
        attempt = _locked_attempt(attempt_id, user)
        if attempt.status == Attempt.Status.SUBMITTED:
            return attempt  # Idempotent, même lorsque le délai est dépassé depuis.
        error = _active_error(attempt)
        if not error:
            total = attempt.exam.questions.count()
            max_score = attempt.exam.questions.aggregate(total=Sum("points"))["total"] or 0
            right = Answer.objects.filter(attempt=attempt, choice__is_correct=True)
            correct = right.count()
            score = right.aggregate(total=Sum("question__points"))["total"] or 0
            error = _active_error(attempt)
            if not error:
                submitted_at = timezone.now()
                if submitted_at >= attempt.expires_at:
                    _expire(attempt)
                    error = "Le temps de cette tentative est écoulé."
                else:
                    attempt.correct_count = correct
                    attempt.question_count = total
                    attempt.score = score
                    attempt.max_score = max_score
                    attempt.submitted_at = submitted_at
                    attempt.status = Attempt.Status.SUBMITTED
                    attempt.save(
                        update_fields=[
                            "correct_count",
                            "question_count",
                            "score",
                            "max_score",
                            "submitted_at",
                            "status",
                        ]
                    )
    if error:
        raise ValidationError({"attempt": error})
    return attempt
