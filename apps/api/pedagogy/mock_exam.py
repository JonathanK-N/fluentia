"""Examen TCF : les 4 épreuves passées dans l’ordre du test, puis un bilan global.

Écoute et Lecture réutilisent les séances QCM chronométrées, la Rédaction ouvre un chrono unique de 60 minutes
pour les trois tâches, et l’Oral enchaîne les trois tâches avec l’examinateur IA. Aucune correction n’est
montrée avant la fin : les textes et les échanges sont corrigés quand l’étudiant ouvre son bilan.
"""

from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import OpenApiTypes, extend_schema
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import VerifiedEmail
from accounts.views import SecureView
from exams.models import Attempt
from exams.services import close_expired, start_attempt
from . import speaking
from .correction import CRITERIA, DISCLAIMER, WORD, nclc, recipient
from .models import MockExam, MockExamRun, SpeakingSession, WritingCorrection
from exams.estimate import qcm_estimate

from .progress import LEVELS, average
from .tasks import FORMATS

STEPS = [
    ("listening", "Écoute", "Compréhension orale"),
    ("reading", "Lecture", "Compréhension écrite"),
    ("writing", "Rédaction", "Expression écrite"),
    ("speaking", "Oral", "Expression orale"),
]
MIN_WORDS = 20  # en dessous, la tâche n’est pas envoyée à l’IA : elle compte pour zéro
UNFINISHED = "La correction sera disponible à la fin de votre Examen TCF."


def published():
    exams = MockExam.objects.filter(is_published=True).select_related(
        "listening", "reading", "writing_1", "writing_2", "writing_3", "speaking_1", "speaking_2", "speaking_3"
    )
    return [exam for exam in exams if exam.complete()]


def in_unfinished_run(*, attempt=None, correction=None, session=None):
    """Vrai si cette séance fait partie d’un Examen TCF pas encore terminé : sa correction attend la fin."""
    if attempt is not None:
        return MockExamRun.objects.filter(finished_at__isnull=True).filter(
            Q(listening_attempt=attempt) | Q(reading_attempt=attempt)
        ).exists()
    owner = correction if correction is not None else session
    return owner is not None and owner.run_id is not None and owner.run.finished_at is None


def unfinished_run_of(attempt):
    run = MockExamRun.objects.filter(finished_at__isnull=True).filter(
        Q(listening_attempt=attempt) | Q(reading_attempt=attempt)
    ).first()
    return run.pk if run else None


def minutes(seconds):
    return max(1, round(seconds / 60))


def speaking_seconds(subject):
    return (subject.speak_seconds or 0) + (subject.prep_seconds or 0)


def details(exam):
    return {
        "listening": f"{exam.listening.questions.count()} questions · {minutes(exam.listening.duration_seconds)} min",
        "reading": f"{exam.reading.questions.count()} questions · {minutes(exam.reading.duration_seconds)} min",
        "writing": f"3 tâches · {MockExam.WRITING_MINUTES} min",
        "speaking": f"3 tâches · {minutes(sum(speaking_seconds(s) for s in exam.speaking_subjects()))} min",
    }


# --- Avancement -----------------------------------------------------------------------------------------------

def qcm_state(run, field):
    attempt = getattr(run, field)
    if attempt is None:
        return "todo"
    if attempt.status == Attempt.Status.ACTIVE and attempt.expires_at > timezone.now():
        return "running"
    if attempt.status != Attempt.Status.SUBMITTED:
        # Chrono écoulé : noté avec les réponses déjà données, puis l’épreuve suivante s’ouvre.
        setattr(run, field, close_expired(attempt_id=attempt.pk, user=run.user))
    return "done"


def speaking_tasks(run):
    """État de chaque tâche d’Oral : terminée (séance finie), passée, ou à faire."""
    finished = {
        s.subject_id: s for s in SpeakingSession.objects.filter(run=run, status=SpeakingSession.Status.FINISHED).order_by("started_at")
    }
    states = []
    for number, subject in enumerate(run.exam.speaking_subjects(), start=1):
        session = finished.get(subject.pk) if subject else None
        status = "done" if session else "skipped" if number in run.speaking_skipped else "todo"
        states.append({"number": number, "subject": subject, "session": session, "status": status})
    return states


def states(run):
    writing = "done" if run.writing_submitted_at else "running" if run.writing_started_at else "todo"
    oral = speaking_tasks(run)
    speaking_state = (
        "done" if all(t["status"] != "todo" for t in oral)
        else "running" if any(t["status"] != "todo" for t in oral) else "todo"
    )
    result = {
        "listening": qcm_state(run, "listening_attempt"),
        "reading": qcm_state(run, "reading_attempt"),
        "writing": writing,
        "speaking": speaking_state,
    }
    if run.finished_at is None and all(value == "done" for value in result.values()):
        run.finished_at = timezone.now()
        run.save(update_fields=["finished_at"])
    return result


def current_step(state):
    return next((key for key, _, _ in STEPS if state[key] != "done"), None)


# --- Bilan ----------------------------------------------------------------------------------------------------

def qcm_part(attempt):
    if attempt is None or attempt.status != Attempt.Status.SUBMITTED or not attempt.question_count:
        return {"level": "A1", "step": 0, "nclc": None, "attempt_id": None, "score": 0, "max_score": 0, "correct": 0, "questions": 0}
    estimate = qcm_estimate(attempt.exam.skill, attempt.score or 0, attempt.max_score or attempt.question_count)
    return {
        "level": estimate["level"], "step": estimate["step"], "nclc": estimate["nclc"], "attempt_id": str(attempt.pk),
        "score": attempt.score or 0, "max_score": attempt.max_score or 0,
        "correct": attempt.correct_count, "questions": attempt.question_count,
    }


def task_result(result):
    if not isinstance(result, dict) or result.get("level") not in LEVELS:
        return None, None
    return result["level"], result.get("tcf_score", result.get("score"))


def corrected_part(tasks):
    """Rédaction ou Oral : niveau moyen des trois tâches, note moyenne sur 20 et NCLC ; None tant qu’une correction attend."""
    levels, scores = [], []
    for task in tasks:
        if task["pending"]:
            return None
        levels.append(LEVELS.index(task["level"]) if task["level"] else 0)
        scores.append(task["score"] or 0)
    score = int(sum(scores) / len(scores) + 0.5)
    return {"level": average(levels), "step": LEVELS.index(average(levels)), "score": score, "nclc": nclc(score)}


def writing_tasks(run):
    saved = {c.subject_id: c for c in WritingCorrection.objects.filter(run=run)}
    tasks = []
    for number, subject in enumerate(run.exam.writing_subjects(), start=1):
        correction = saved.get(subject.pk) if subject else None
        level, score = task_result(correction.result if correction else None)
        tasks.append({
            "number": number, "title": subject.title if subject else "", "id": correction.pk if correction else None,
            "pending": bool(correction) and correction.status != WritingCorrection.Status.DONE,
            "level": level, "score": score,
        })
    return tasks


def oral_tasks(run):
    tasks = []
    for task in speaking_tasks(run):
        session = task["session"]
        level, score = task_result(session.result if session else None)
        tasks.append({
            "number": task["number"], "title": task["subject"].title if task["subject"] else "",
            "id": session.pk if session else None, "skipped": task["status"] == "skipped",
            "pending": bool(session) and session.correction_status != "done",
            "level": level, "score": score,
        })
    return tasks


def bilan(run):
    listening, reading = qcm_part(run.listening_attempt), qcm_part(run.reading_attempt)
    writing, oral = writing_tasks(run), oral_tasks(run)
    written, spoken = corrected_part(writing), corrected_part(oral)
    pending = [{"kind": "writing", "id": t["id"]} for t in writing if t["pending"]]
    pending += [{"kind": "speaking", "id": t["id"]} for t in oral if t["pending"]]
    parts = [listening, reading, written, spoken]
    return {
        "overall": None if pending else average([part["step"] for part in parts]),
        "listening": listening,
        "reading": reading,
        "writing": {"tasks": writing, **(written or {})},
        "speaking": {"tasks": oral, **(spoken or {})},
        "pending": pending,
    }


def run_payload(run):
    exam = run.exam
    state = states(run)
    detail = details(exam)
    titles = {
        "listening": exam.listening.title, "reading": exam.reading.title,
        "writing": " · ".join(s.title for s in exam.writing_subjects()),
        "speaking": " · ".join(s.title for s in exam.speaking_subjects()),
    }
    return {
        "id": run.pk,
        "title": exam.title,
        "started_at": run.started_at,
        "finished_at": run.finished_at,
        "current": current_step(state),
        "steps": [
            {"key": key, "name": name, "subtitle": subtitle, "detail": detail[key], "topic": titles[key], "status": state[key]}
            for key, name, subtitle in STEPS
        ],
        "listening_attempt": str(run.listening_attempt_id) if run.listening_attempt_id else None,
        "reading_attempt": str(run.reading_attempt_id) if run.reading_attempt_id else None,
        "bilan": bilan(run) if run.finished_at else None,
    }


def empty_correction(words):
    """Tâche vide ou trop courte : pas envoyée à l’IA, comptée A1 et 0/20, avec une explication."""
    summary = "Tâche non traitée." if not words else f"Texte trop court ({words} mot{'s' if words > 1 else ''}) pour être évalué."
    return {
        "demo": False, "level": "A1", "score": 0, "summary": summary,
        "feedback": f"Il faut au moins {MIN_WORDS} mots pour que le texte soit corrigé. Le jour du test, une tâche non traitée vaut zéro.",
        "criteria": [{"id": key, "label": label, "level": "A1"} for key, label in CRITERIA],
        "errors": [], "improved": "", "advice": ["Gardez du temps pour chacune des trois tâches.", "Écrivez au moins le nombre de mots demandé."],
        "goal": "Traitez la consigne de chaque tâche dans la longueur demandée.",
        "off_topic": False, "off_topic_reason": "", "disclaimer": DISCLAIMER,
    }


# --- Vues -----------------------------------------------------------------------------------------------------

def own_run(request, run_id):
    return get_object_or_404(
        MockExamRun.objects.select_related(
            "exam", "exam__listening", "exam__reading", "listening_attempt", "reading_attempt",
            "exam__writing_1", "exam__writing_2", "exam__writing_3", "exam__speaking_1", "exam__speaking_2", "exam__speaking_3",
        ),
        pk=run_id, user=request.user,
    )


def open_run(request, run_id, step):
    """Passage en cours dont l’épreuve demandée est bien la suivante à faire."""
    run = own_run(request, run_id)
    if run.finished_at:
        raise ValidationError({"detail": "Cet examen est terminé."})
    if current_step(states(run)) != step:
        raise ValidationError({"detail": "Terminez d’abord l’épreuve précédente."})
    return run


class MockExamListView(SecureView):
    permission_classes = [AllowAny]
    throttle_classes = []

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        exams = published()
        runs = {}
        if request.user.is_authenticated:
            for run in MockExamRun.objects.filter(user=request.user, exam__in=exams).order_by("started_at"):
                runs[run.exam_id] = run  # le plus récent en dernier
        return Response([{
            "id": exam.pk,
            "title": exam.title,
            "parts": [{"key": key, "name": name, "detail": detail[key]} for detail in [details(exam)] for key, name, _ in STEPS],
            "run": {"id": runs[exam.pk].pk, "finished": runs[exam.pk].finished_at is not None, "finished_at": runs[exam.pk].finished_at}
            if exam.pk in runs else None,
        } for exam in exams])


class MockExamStartView(SecureView):
    permission_classes = [IsAuthenticated, VerifiedEmail]
    throttle_classes = []

    @extend_schema(request=None, responses=OpenApiTypes.OBJECT)
    def post(self, request, exam_id):
        exam = next((e for e in published() if e.pk == exam_id), None)
        if exam is None:
            raise ValidationError({"detail": "Cet examen n’est pas disponible."})
        with transaction.atomic():
            run = MockExamRun.objects.select_for_update().filter(user=request.user, exam=exam, finished_at__isnull=True).first()
            created = run is None
            if created:
                run = MockExamRun.objects.create(user=request.user, exam=exam)
        return Response({"id": run.pk}, status=201 if created else 200)


class MockExamRunView(SecureView):
    permission_classes = [IsAuthenticated]
    throttle_classes = []

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request, run_id):
        return Response(run_payload(own_run(request, run_id)))


class MockExamQcmView(SecureView):
    """Ouvre (ou reprend) la séance d’Écoute ou de Lecture de l’examen."""

    permission_classes = [IsAuthenticated, VerifiedEmail]
    throttle_classes = []

    @extend_schema(request=None, responses=OpenApiTypes.OBJECT)
    def post(self, request, run_id, step):
        if step not in ("listening", "reading"):
            raise ValidationError({"detail": "Épreuve inconnue."})
        run = open_run(request, run_id, step)
        field = f"{step}_attempt"
        attempt = getattr(run, field)
        if attempt is None:
            attempt, _ = start_attempt(user=request.user, exam=getattr(run.exam, step), resume=False)
            setattr(run, field, attempt)
            run.save(update_fields=[field])
        return Response({"attempt_id": str(attempt.pk), "skill": step})


class WritingTextsSerializer(serializers.Serializer):
    texts = serializers.ListField(child=serializers.CharField(allow_blank=True, max_length=20000, trim_whitespace=False), min_length=3, max_length=3)


class MockExamWritingView(SecureView):
    """Rédaction de l’examen : un seul chrono de 60 minutes pour les trois tâches."""

    permission_classes = [IsAuthenticated]
    throttle_classes = []

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request, run_id):
        run = own_run(request, run_id)
        exam = run.exam
        return Response({
            "title": exam.title,
            "started_at": run.writing_started_at,
            "deadline": run.writing_started_at + timedelta(minutes=MockExam.WRITING_MINUTES) if run.writing_started_at else None,
            "submitted": run.writing_submitted_at is not None,
            "server_now": timezone.now(),
            "minutes": MockExam.WRITING_MINUTES,
            "corrector": recipient(),
            "tasks": [{
                "number": number, "id": s.pk, "title": s.title, "prompt": s.prompt, "genre": s.genre,
                "min": s.min_words, "max": s.max_words, "documents": s.documents,
                "name": FORMATS["writing"][number]["title"],
            } for number, s in enumerate(exam.writing_subjects(), start=1)],
        })

    @extend_schema(request=WritingTextsSerializer, responses=OpenApiTypes.OBJECT)
    def post(self, request, run_id):
        """Sans `texts` : démarre le chrono. Avec `texts` : enregistre les trois textes et ferme l’épreuve."""
        if not request.data:
            run = open_run(request, run_id, "writing")
            if run.writing_started_at is None:
                run.writing_started_at = timezone.now()
                run.save(update_fields=["writing_started_at"])
            return self.get(request, run_id)
        body = WritingTextsSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        with transaction.atomic():
            run = open_run(request, run_id, "writing")
            run = MockExamRun.objects.select_for_update().get(pk=run.pk)
            if run.writing_submitted_at or run.writing_started_at is None:
                raise ValidationError({"detail": "Cette épreuve n’est pas en cours."})
            for subject, text in zip(run.exam.writing_subjects(), body.validated_data["texts"]):
                words = len(WORD.findall(text))
                WritingCorrection.objects.create(
                    user=request.user, subject=subject, run=run, text=text.strip(), provider=_corrector(),
                    status=WritingCorrection.Status.PENDING if words >= MIN_WORDS else WritingCorrection.Status.DONE,
                    result=None if words >= MIN_WORDS else empty_correction(words),
                )
            run.writing_submitted_at = timezone.now()
            run.save(update_fields=["writing_submitted_at"])
        return Response(run_payload(own_run(request, run_id)))


def _corrector():
    return settings.WRITING_CORRECTOR


class MockExamSpeakingView(SecureView):
    """Oral de l’examen : les trois tâches, dans l’ordre, avec l’état de chacune."""

    permission_classes = [IsAuthenticated]
    throttle_classes = []

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request, run_id):
        run = own_run(request, run_id)
        tasks = []
        for task in speaking_tasks(run):
            subject, number = task["subject"], task["number"]
            form = FORMATS["speaking"][number]
            tasks.append({
                "number": number, "status": task["status"],
                "task": {
                    "slug": f"tache-{number}", "number": number, "title": form["title"], "advice": form["advice"], "goal": form["goal"],
                    "seconds": subject.speak_seconds, "prepSeconds": subject.prep_seconds,
                    "subjects": [{"id": subject.pk, "title": subject.title, "prompt": subject.prompt, "cues": subject.cues}],
                },
            })
        return Response({"title": run.exam.title, "examiner": speaking.recipient(), "tasks": tasks, "finished": run.finished_at is not None})


class SkipSerializer(serializers.Serializer):
    task = serializers.IntegerField(min_value=1, max_value=3)


class MockExamSkipView(SecureView):
    """Tâche d’Oral impossible à passer (plus d’essais, service indisponible) : elle compte pour zéro."""

    permission_classes = [IsAuthenticated]
    throttle_classes = []

    @extend_schema(request=SkipSerializer, responses=OpenApiTypes.OBJECT)
    def post(self, request, run_id):
        body = SkipSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        with transaction.atomic():
            run = open_run(request, run_id, "speaking")
            run = MockExamRun.objects.select_for_update().get(pk=run.pk)
            number = body.validated_data["task"]
            if number not in run.speaking_skipped:
                run.speaking_skipped = sorted([*run.speaking_skipped, number])
                run.save(update_fields=["speaking_skipped"])
        return Response(run_payload(own_run(request, run_id)))


def speaking_run(request, run_id, subject):
    """Séance d’Oral ouverte depuis l’examen : le sujet doit être celui de la prochaine tâche à faire."""
    run = open_run(request, run_id, "speaking")
    todo = next((t for t in speaking_tasks(run) if t["status"] == "todo"), None)
    if todo is None or todo["subject"] is None or todo["subject"].pk != subject.pk:
        raise PermissionDenied("Ce sujet ne correspond pas à la tâche en cours de votre examen.")
    return run


def exam_speaking_subject_ids():
    return {s.pk for exam in published() for s in exam.speaking_subjects() if s}
