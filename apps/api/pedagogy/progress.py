from django.db.models import Count, Sum
from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from accounts.views import SecureView
from exams.models import Attempt, Answer
from accounts.subscription import speaking_allowance
from .models import SpeakingSession, WritingCorrection


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


class GradedSerializer(serializers.Serializer):
    count = serializers.IntegerField()
    last_score = serializers.IntegerField(allow_null=True)
    last_level = serializers.CharField(allow_null=True)


class SpeakingProgressSerializer(GradedSerializer):
    attempts_left = serializers.IntegerField(allow_null=True)
    attempts_total = serializers.IntegerField(allow_null=True)


class ProgressSerializer(serializers.Serializer):
    official = serializers.BooleanField()
    disclaimer = serializers.CharField()
    groups = ProgressGroupSerializer(many=True)
    categories = CategorySerializer(many=True)
    writing = GradedSerializer()
    speaking = SpeakingProgressSerializer()


def graded(results):
    """Nombre de corrections notées et dernière note sur 20 (les résultats sont triés du plus récent au plus ancien)."""
    notes = [r for r in results if isinstance(r, dict) and isinstance(r.get("score"), int) and not r.get("demo")]
    last = notes[0] if notes else {}
    return {"count": len(notes), "last_score": last.get("score"), "last_level": last.get("level")}


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
                "writing": self.writing(request.user),
                "speaking": self.speaking(request.user),
            }
        )

    @staticmethod
    def writing(user):
        results = WritingCorrection.objects.filter(user=user, status=WritingCorrection.Status.DONE).order_by("-created_at").values_list("result", flat=True)
        return graded(results)

    @staticmethod
    def speaking(user):
        results = SpeakingSession.objects.filter(user=user, status=SpeakingSession.Status.FINISHED).order_by("-started_at").values_list("result", flat=True)
        allowance = speaking_allowance(user)
        left, total = allowance if allowance else (None, None)
        return {**graded(results), "attempts_left": left, "attempts_total": total}
