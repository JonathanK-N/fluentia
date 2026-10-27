"""Contrats REST explicites : aucune solution avant soumission."""

from rest_framework import serializers
from .models import Exam, Question, Choice, Attempt


class ChoicePublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ("id", "position", "label")


class QuestionPublicSerializer(serializers.ModelSerializer):
    audio_available = serializers.BooleanField(read_only=True, default=False)
    audio_state = serializers.CharField(read_only=True, default="unavailable")
    audio_ends_at = serializers.DateTimeField(read_only=True, allow_null=True)
    transcript = serializers.CharField(read_only=True, required=False)
    choices = ChoicePublicSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ("id", "position", "statement", "reading_passage", "points", "choices", "audio_available", "audio_state", "audio_ends_at", "transcript")


class ExamListSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(read_only=True)
    total_points = serializers.IntegerField(read_only=True)
    official = serializers.SerializerMethodField()

    def get_official(self, obj) -> bool:
        return False

    class Meta:
        model = Exam
        fields = (
            "id",
            "slug",
            "version",
            "title",
            "skill",
            "mode",
            "description",
            "duration_seconds",
            "question_count",
            "total_points",
            "official",
        )


class SavedAnswerSerializer(serializers.Serializer):
    question_id = serializers.UUIDField(read_only=True)
    choice_id = serializers.UUIDField(read_only=True)


class AttemptSerializer(serializers.ModelSerializer):
    exam_id = serializers.UUIDField(read_only=True)
    skill = serializers.CharField(source="exam.skill", read_only=True)
    mode = serializers.CharField(source="exam.mode", read_only=True)
    exam_title = serializers.CharField(source="exam.title", read_only=True)

    class Meta:
        model = Attempt
        fields = ("id", "exam_id", "status", "started_at", "expires_at", "submitted_at", "skill", "mode", "exam_title")
        read_only_fields = fields


class AttemptReadSerializer(AttemptSerializer):
    server_now = serializers.DateTimeField(read_only=True)
    questions = QuestionPublicSerializer(many=True, required=False, read_only=True)
    answers = SavedAnswerSerializer(many=True, read_only=True)

    class Meta(AttemptSerializer.Meta):
        fields = AttemptSerializer.Meta.fields + ("questions", "answers", "server_now")


class SaveAnswerSerializer(serializers.Serializer):
    question_id = serializers.UUIDField()
    choice_id = serializers.UUIDField()

    def to_internal_value(self, data):
        if isinstance(data, dict) and set(data) - set(self.fields):
            raise serializers.ValidationError(
                {"non_field_errors": ["Champs non autorisés."]}
            )
        return super().to_internal_value(data)


class SaveAnswerResponseSerializer(SavedAnswerSerializer):
    saved = serializers.BooleanField(read_only=True)
    # Verdict immédiat si le profil l’a activé ; null sinon.
    correct = serializers.BooleanField(read_only=True, allow_null=True)


class ResultDetailSerializer(serializers.Serializer):
    transcript = serializers.CharField(read_only=True, allow_blank=True)
    statement = serializers.CharField(read_only=True)
    reading_passage = serializers.CharField(read_only=True, allow_blank=True)
    selected_label = serializers.CharField(read_only=True, allow_null=True)
    correct_label = serializers.CharField(read_only=True)
    question_id = serializers.UUIDField(read_only=True)
    selected_choice_id = serializers.UUIDField(read_only=True, allow_null=True)
    correct_choice_id = serializers.UUIDField(read_only=True)
    explanation = serializers.CharField(read_only=True)
    points = serializers.IntegerField(read_only=True)


class ResultSerializer(serializers.Serializer):
    attempt_id = serializers.UUIDField(read_only=True)
    status = serializers.CharField(read_only=True)
    correct_count = serializers.IntegerField(read_only=True)
    question_count = serializers.IntegerField(read_only=True)
    percentage = serializers.FloatField(read_only=True)
    score = serializers.IntegerField(read_only=True)
    max_score = serializers.IntegerField(read_only=True)
    official = serializers.BooleanField(read_only=True)
    disclaimer = serializers.CharField(read_only=True)
    details = ResultDetailSerializer(many=True, read_only=True, required=False)
