from rest_framework import serializers
from .models import BankItem, MediaAsset, EditorialEvent
from exams.models import Exam


class StrictSerializer(serializers.Serializer):
    def to_internal_value(self, data):
        if isinstance(data, dict) and set(data) - set(self.fields):
            raise serializers.ValidationError({"detail": "Champs non autorisés."})
        return super().to_internal_value(data)


class ContentSerializer(StrictSerializer):
    skill = serializers.ChoiceField(choices=Exam.Skill.choices)
    difficulty = serializers.ChoiceField(
        choices=["non_calibree", "A1", "A2", "B1", "B2", "C1", "C2"],
        default="non_calibree",
    )
    statement = serializers.CharField(max_length=10000)
    passage = serializers.CharField(allow_blank=True, max_length=40000, default="")
    media = serializers.PrimaryKeyRelatedField(
        queryset=MediaAsset.objects.all(), allow_null=True, default=None
    )
    choices = serializers.ListField(
        child=serializers.CharField(max_length=500), min_length=4, max_length=4
    )
    correct_index = serializers.IntegerField(min_value=0, max_value=3)
    explanation = serializers.CharField(max_length=10000)
    origin = serializers.ChoiceField(
        choices=BankItem._meta.get_field("origin").choices, default="original"
    )
    provenance = serializers.CharField(max_length=10000)
    credit = serializers.CharField(max_length=250, allow_blank=True, default="")


class EditSerializer(ContentSerializer):
    revision = serializers.IntegerField(min_value=1)


class BankSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankItem
        fields = [
            "id",
            "family",
            "version",
            "revision",
            "skill",
            "difficulty",
            "statement",
            "passage",
            "media",
            "choices",
            "correct_index",
            "explanation",
            "origin",
            "provenance",
            "credit",
            "editor",
            "state",
            "reviewer",
            "reviewed_at",
            "review_note",
            "updated_at",
        ]
        read_only_fields = fields


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = EditorialEvent
        fields = ["id", "actor", "action", "before", "after", "created_at"]
        read_only_fields = fields


class TransitionSerializer(StrictSerializer):
    revision = serializers.IntegerField(min_value=1)
    action = serializers.ChoiceField(choices=["request_review", "approve", "reject"])
    note = serializers.CharField(max_length=10000, allow_blank=True, default="")
    attest = serializers.BooleanField(default=False)


class PublishSerializer(StrictSerializer):
    slug = serializers.SlugField(max_length=120)
    title = serializers.CharField(max_length=180)
    skill = serializers.ChoiceField(choices=Exam.Skill.choices)
    mode = serializers.ChoiceField(choices=Exam.Mode.choices)
    duration_seconds = serializers.IntegerField(min_value=1, max_value=14400)
    item_ids = serializers.ListField(
        child=serializers.UUIDField(), min_length=1, max_length=100
    )
    description = serializers.CharField(max_length=10000, allow_blank=True, default="")


class MediaUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    title = serializers.CharField(max_length=180)
    transcript = serializers.CharField(max_length=40000)
    provenance = serializers.CharField(max_length=10000)


class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaAsset
        fields = [
            "id",
            "title",
            "sha256",
            "size",
            "duration_ms",
            "transcript",
            "provenance",
            "created_by",
        ]
        read_only_fields = fields


class ImportSerializer(StrictSerializer):
    format = serializers.ChoiceField(choices=["fluentia.bank.v1"])
    items = ContentSerializer(many=True, allow_empty=False)

    def validate_items(self, value):
        if len(value) > 100:
            raise serializers.ValidationError("Cent items maximum par import.")
        return value


class ExportSerializer(StrictSerializer):
    format = serializers.CharField()
    items = ContentSerializer(many=True)
