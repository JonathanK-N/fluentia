from django.db.models import Count, Sum
from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from accounts.views import SecureView
from exams.models import Attempt, Answer


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


class ProgressSerializer(serializers.Serializer):
    official = serializers.BooleanField()
    disclaimer = serializers.CharField()
    groups = ProgressGroupSerializer(many=True)
    categories = CategorySerializer(many=True)


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
            }
        )
