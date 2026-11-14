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


class SkillLevelSerializer(serializers.Serializer):
    skill = serializers.CharField()
    tests = serializers.IntegerField()
    level = serializers.CharField(allow_null=True)
    last_score = serializers.IntegerField(allow_null=True)
    last_unit = serializers.CharField(allow_null=True)


class ExploredSerializer(serializers.Serializer):
    seen = serializers.IntegerField()
    total = serializers.IntegerField()


class ProgressSerializer(serializers.Serializer):
    official = serializers.BooleanField()
    disclaimer = serializers.CharField()
    groups = ProgressGroupSerializer(many=True)
    categories = CategorySerializer(many=True)
    level = LevelSerializer()
    skills = SkillLevelSerializer(many=True)
    explored = ExploredSerializer()


LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"]


def level_of_rate(correct, questions):
    """Lecture ou Écoute : part de bonnes réponses ramenée à six paliers égaux, de A1 (moins de 16,7 %) à C2 (83,4 % et plus).

    Repère interne : le TCF répartit ses scores 100-699 en six niveaux de largeur égale.
    """
    return min(5, int(6 * correct / questions)) if questions else None


def corrected_levels(results):
    """(palier, note sur 20) des corrections de Rédaction ou d’Oral par l’IA ; les corrections de démonstration ne comptent pas."""
    return [(LEVELS.index(r["level"]), r.get("score")) for r in results
            if isinstance(r, dict) and r.get("level") in LEVELS and not r.get("demo")]


def average(steps):
    return LEVELS[int(sum(steps) / len(steps) + 0.5)] if steps else None


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
                **self.levels(request.user, attempts),
                "explored": self.explored(request.user),
            }
        )

    @staticmethod
    def levels(user, attempts):
        """Niveau moyen de tous les tests envoyés, puis par épreuve, avec la dernière note (du plus récent au plus ancien)."""
        tests = {"reading": [], "listening": [], "writing": [], "speaking": []}
        for row in attempts.order_by("-submitted_at").values("exam__skill", "correct_count", "question_count"):
            step = level_of_rate(row["correct_count"] or 0, row["question_count"])
            if step is not None and row["exam__skill"] in tests:
                tests[row["exam__skill"]].append((step, round(100 * (row["correct_count"] or 0) / row["question_count"])))
        tests["writing"] = corrected_levels(WritingCorrection.objects.filter(user=user, status=WritingCorrection.Status.DONE)
                                            .order_by("-created_at").values_list("result", flat=True))
        tests["speaking"] = corrected_levels(SpeakingSession.objects.filter(user=user, status=SpeakingSession.Status.FINISHED)
                                             .order_by("-started_at").values_list("result", flat=True))
        every = [step for done in tests.values() for step, _ in done]
        return {
            "level": {"level": average(every), "tests": len(every)},
            "skills": [{
                "skill": skill,
                "tests": len(done),
                "level": average([step for step, _ in done]),
                "last_score": done[0][1] if done else None,
                "last_unit": ("%" if skill in ("reading", "listening") else "/20") if done else None,
            } for skill, done in tests.items()],
        }

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
