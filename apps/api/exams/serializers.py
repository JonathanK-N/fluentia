"""Contrats REST explicites : aucune solution avant soumission."""

from rest_framework import serializers
from .models import Exam, Question, Choice, Attempt


class ChoicePublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ("id", "position", "label")


class QuestionPublicSerializer(serializers.ModelSerializer):
    choices = ChoicePublicSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ("id", "position", "statement", "reading_passage", "choices")


class ExamListSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(read_only=True)
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
            "official",
        )


class SavedAnswerSerializer(serializers.Serializer):
    question_id = serializers.UUIDField(read_only=True)
    choice_id = serializers.UUIDField(read_only=True)


class AttemptSerializer(serializers.ModelSerializer):
    exam_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = Attempt
        fields = ("id", "exam_id", "status", "started_at", "expires_at", "submitted_at")
        read_only_fields = fields


class AttemptReadSerializer(AttemptSerializer):
    questions = QuestionPublicSerializer(many=True, required=False, read_only=True)
    answers = SavedAnswerSerializer(many=True, read_only=True)

    class Meta(AttemptSerializer.Meta):
        fields = AttemptSerializer.Meta.fields + ("questions", "answers")


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


class ResultDetailSerializer(serializers.Serializer):
    statement = serializers.CharField(read_only=True)
    selected_label = serializers.CharField(read_only=True, allow_null=True)
    correct_label = serializers.CharField(read_only=True)
    question_id = serializers.UUIDField(read_only=True)
    selected_choice_id = serializers.UUIDField(read_only=True, allow_null=True)
    correct_choice_id = serializers.UUIDField(read_only=True)
    explanation = serializers.CharField(read_only=True)


class ResultSerializer(serializers.Serializer):
    attempt_id = serializers.UUIDField(read_only=True)
    status = serializers.CharField(read_only=True)
    correct_count = serializers.IntegerField(read_only=True)
    question_count = serializers.IntegerField(read_only=True)
    percentage = serializers.FloatField(read_only=True)
    official = serializers.BooleanField(read_only=True)
    disclaimer = serializers.CharField(read_only=True)
    details = ResultDetailSerializer(many=True, read_only=True, required=False)
