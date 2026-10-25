"""Catalogue public limité et tentatives privées protégées par la session Django."""

from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView
from .models import Exam, Attempt
from .serializers import (
    ExamListSerializer,
    QuestionPublicSerializer,
    SaveAnswerSerializer,
    AttemptSerializer,
    AttemptReadSerializer,
    SaveAnswerResponseSerializer,
    ResultSerializer,
)
from .services import create_attempt, save_answer, submit_attempt, get_attempt
from accounts.permissions import VerifiedEmail


class CataloguePagination(LimitOffsetPagination):
    default_limit = 50
    max_limit = 100


class StartThrottle(UserRateThrottle):
    scope = "exam_start"
    rate = "30/hour"


class WriteThrottle(UserRateThrottle):
    scope = "exam_write"
    rate = "120/minute"


class ExamListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = ExamListSerializer
    pagination_class = CataloguePagination
    queryset = Exam.objects.filter(is_published=True).annotate(
        question_count=Count("questions")
    )


class ExamDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = ExamListSerializer
    lookup_url_kwarg = "exam_id"
    queryset = Exam.objects.filter(is_published=True).annotate(
        question_count=Count("questions")
    )


class StartAttemptView(APIView):
    permission_classes = [IsAuthenticated, VerifiedEmail]
    throttle_classes = [StartThrottle]

    @extend_schema(request=None, responses={201: AttemptSerializer})
    def post(self, request, exam_id):
        if request.data:
            raise ValidationError("Le délai et l’examen sont définis par le serveur.")
        exam = get_object_or_404(Exam.objects.filter(is_published=True), pk=exam_id)
        attempt = create_attempt(user=request.user, exam=exam)
        return Response(AttemptSerializer(attempt).data, status=status.HTTP_201_CREATED)


class AttemptView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=AttemptReadSerializer)
    def get(self, request, attempt_id):
        attempt = get_attempt(attempt_id=attempt_id, user=request.user)
        payload = AttemptSerializer(attempt).data
        payload["server_now"] = timezone.now().isoformat()
        payload["answers"] = list(attempt.answers.values("question_id", "choice_id"))
        if attempt.status == Attempt.Status.ACTIVE:
            payload["questions"] = QuestionPublicSerializer(
                attempt.exam.questions.prefetch_related("choices"), many=True
            ).data
        return Response(payload)


class SaveAnswerView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [WriteThrottle]

    @extend_schema(request=SaveAnswerSerializer, responses=SaveAnswerResponseSerializer)
    def put(self, request, attempt_id):
        serializer = SaveAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answer = save_answer(
            attempt_id=attempt_id, user=request.user, **serializer.validated_data
        )
        return Response(
            {
                "question_id": str(answer.question_id),
                "choice_id": str(answer.choice_id),
                "saved": True,
            }
        )


def result_payload(attempt: Attempt) -> dict:
    return {
        "attempt_id": str(attempt.pk),
        "status": attempt.status,
        "correct_count": attempt.correct_count,
        "question_count": attempt.question_count,
        "percentage": round(100 * attempt.correct_count / attempt.question_count, 1),
        "official": False,
        "disclaimer": "Résultat d’entraînement, non officiel. Aucune conversion TCF ou NCLC.",
    }


class SubmitAttemptView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [WriteThrottle]

    @extend_schema(request=None, responses=ResultSerializer)
    def post(self, request, attempt_id):
        attempt = submit_attempt(attempt_id=attempt_id, user=request.user)
        return Response(result_payload(attempt))


class AttemptResultsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: ResultSerializer, 409: None})
    def get(self, request, attempt_id):
        attempt = get_attempt(attempt_id=attempt_id, user=request.user)
        if attempt.status != Attempt.Status.SUBMITTED:
            return Response(
                {"detail": "Résultats disponibles après soumission."}, status=409
            )
        answers = {a.question_id: a for a in attempt.answers.select_related("choice")}
        payload = result_payload(attempt)
        payload["details"] = [
            {
                "question_id": str(q.pk),
                "selected_choice_id": str(answers[q.pk].choice_id)
                if q.pk in answers
                else None,
                "correct_choice_id": str(
                    next(c.pk for c in q.choices.all() if c.is_correct)
                ),
                "explanation": q.explanation,
                "statement": q.statement,
                "selected_label": answers[q.pk].choice.label if q.pk in answers else None,
                "correct_label": next(c.label for c in q.choices.all() if c.is_correct),
            }
            for q in attempt.exam.questions.prefetch_related("choices")
        ]
        return Response(payload)


class MyAttemptsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AttemptSerializer
    pagination_class = CataloguePagination

    def get_queryset(self):
        return Attempt.objects.filter(user=self.request.user).order_by("-started_at")
