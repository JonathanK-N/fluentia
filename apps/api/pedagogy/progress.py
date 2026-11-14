from django.db.models import Count, Sum
from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from accounts.views import SecureView
from exams.models import Attempt, Answer, Exam
from .models import SpeakingSession, TaskSubject, WritingCorrection


class ProgressGroupSerializer(serializers.Serializer):
    skill = serializers.CharField()
    mode = serializers.CharField()
    attempts = serializers.IntegerField()
    correct = serializers.IntegerField()
    questions = serializers.IntegerField()
    percentage = serializers.FloatField()


class CategorySerializer(serializers.Serializer):
    skill = serializers.CharField()
    difficulty = serializers.CharField()
    answered = serializers.IntegerField()
    correct = serializers.IntegerField()


class LevelSerializer(serializers.Serializer):
    level = serializers.CharField(allow_null=True)
    tests = serializers.IntegerField()


class ExploredSerializer(serializers.Serializer):
    seen = serializers.IntegerField()
    total = serializers.IntegerField()


class ProgressSerializer(serializers.Serializer):
    official = serializers.BooleanField()
    disclaimer = serializers.CharField()
    groups = ProgressGroupSerializer(many=True)
    categories = CategorySerializer(many=True)
    level = LevelSerializer()
    explored = ExploredSerializer()


LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"]


def level_of_rate(correct, questions):
    """Lecture ou Écoute : part de bonnes réponses ramenée à six paliers égaux, de A1 (moins de 16,7 %) à C2 (83,4 % et plus).

    Repère interne : le TCF répartit ses scores 100-699 en six niveaux de largeur égale.
    """
    return min(5, int(6 * correct / questions)) if questions else None


def corrected_levels(results):
    """Niveaux des corrections de Rédaction ou d’Oral par l’IA (les corrections de démonstration ne comptent pas)."""
    return [LEVELS.index(r["level"]) for r in results
            if isinstance(r, dict) and r.get("level") in LEVELS and not r.get("demo")]


class ProgressView(SecureView):
    permission_classes = [IsAuthenticated]
    throttle_classes = []

    @extend_schema(responses=ProgressSerializer)
    def get(self, request):
        attempts = Attempt.objects.filter(user=request.user, status="submitted")
        rows = (
            attempts.values("exam__skill", "exam__mode")
            .annotate(
                attempts=Count("id"),
                correct=Sum("correct_count"),
                questions=Sum("question_count"),
            )
            .order_by("exam__skill", "exam__mode")
        )
        groups = [
            {
                "skill": r["exam__skill"],
                "mode": r["exam__mode"],
                "attempts": r["attempts"],
                "correct": r["correct"],
                "questions": r["questions"],
                "percentage": round(100 * r["correct"] / r["questions"], 1),
            }
            for r in rows
        ]
        # Les omissions sont visibles dans le total d'examen, pas inventées comme réponses.
        from django.db.models import Q

        answers = (
            Answer.objects.filter(attempt__in=attempts)
            .values("question__exam__skill", "question__difficulty")
            .annotate(
                answered=Count("id"),
                correct=Count("id", filter=Q(choice__is_correct=True)),
            )
            .order_by("question__exam__skill", "question__difficulty")
        )
        categories = [
            {
                "skill": r["question__exam__skill"],
                "difficulty": r["question__difficulty"],
                "answered": r["answered"],
                "correct": r["correct"],
            }
            for r in answers
        ]
        return Response(
            {
                "official": False,
                "disclaimer": "Indicateurs internes sur vos tentatives soumises. Difficultés proposées, sans calibration ni score TCF/NCLC.",
                "groups": groups,
                "categories": categories,
                "level": self.level(request.user, attempts),
                "explored": self.explored(request.user),
            }
        )

    @staticmethod
    def level(user, attempts):
        """Moyenne des niveaux de tous les tests envoyés : séries de Lecture et d’Écoute, Rédactions et tâches d’Oral corrigées."""
        steps = [level_of_rate(a.correct_count or 0, a.question_count) for a in attempts.only("correct_count", "question_count")]
        steps = [step for step in steps if step is not None]
        steps += corrected_levels(WritingCorrection.objects.filter(user=user, status=WritingCorrection.Status.DONE).values_list("result", flat=True))
        steps += corrected_levels(SpeakingSession.objects.filter(user=user, status=SpeakingSession.Status.FINISHED).values_list("result", flat=True))
        return {"level": LEVELS[int(sum(steps) / len(steps) + 0.5)] if steps else None, "tests": len(steps)}

    @staticmethod
    def explored(user):
        """Séries et sujets ouverts au moins une fois, sur tout ce qui est proposé aujourd’hui (les 4 épreuves)."""
        exams = set(Exam.objects.filter(is_published=True).values_list("id", flat=True))
        subjects = set(TaskSubject.objects.filter(task_set__is_active=True).values_list("id", flat=True))
        seen_exams = set(Attempt.objects.filter(user=user).values_list("exam_id", flat=True)) & exams
        seen_subjects = (
            set(WritingCorrection.objects.filter(user=user).values_list("subject_id", flat=True))
            | set(SpeakingSession.objects.filter(user=user).exclude(status=SpeakingSession.Status.FAILED).values_list("subject_id", flat=True))
        ) & subjects
        return {"seen": len(seen_exams) + len(seen_subjects), "total": len(exams) + len(subjects)}
