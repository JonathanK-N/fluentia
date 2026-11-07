from rest_framework import serializers
from .models import BankItem, ImageAsset, MediaAsset, EditorialEvent
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
    image = serializers.PrimaryKeyRelatedField(
        queryset=ImageAsset.objects.all(), allow_null=True, default=None
    )
    image_text = serializers.CharField(allow_blank=True, max_length=40000, default="")
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
            "image",
            "image_text",
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
    items = ContentSerializer(many=True, allow_empty=False, max_length=100)

    def validate_items(self, value):
        if len(value) > 100:
            raise serializers.ValidationError("Cent items maximum par import.")
        return value


class ExportSerializer(StrictSerializer):
    format = serializers.CharField()
    items = ContentSerializer(many=True)


class SeriesImportSerializer(serializers.Serializer):
    skill = serializers.ChoiceField(choices=["reading", "listening", "writing", "speaking"])
    file = serializers.FileField()


class SeriesActionSerializer(StrictSerializer):
    note = serializers.CharField(max_length=10000, allow_blank=True, default="")
    attest = serializers.BooleanField(default=False)


class SeriesExamSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    version = serializers.IntegerField()
    is_published = serializers.BooleanField()


class SeriesSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    skill = serializers.ChoiceField(choices=["reading", "listening", "writing", "speaking"])
    title = serializers.CharField()
    mode = serializers.CharField(allow_blank=True)
    description = serializers.CharField(allow_blank=True)
    file_name = serializers.CharField()
    created_at = serializers.DateTimeField()
    created_by = serializers.IntegerField()
    status = serializers.ChoiceField(choices=["draft", "review", "approved", "published"])
    counts = serializers.DictField(child=serializers.IntegerField())
    size = serializers.IntegerField()
    exam = SeriesExamSerializer(allow_null=True)
    active = serializers.BooleanField()


class SeriesQuestionSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    position = serializers.IntegerField()
    state = serializers.CharField()
    level = serializers.CharField()
    points = serializers.IntegerField()
    statement = serializers.CharField()
    passage = serializers.CharField(allow_blank=True)
    image = serializers.UUIDField(allow_null=True)
    image_text = serializers.CharField(allow_blank=True)
    transcript = serializers.CharField(allow_blank=True)
    choices = serializers.ListField(child=serializers.CharField())
    correct_index = serializers.IntegerField()
    explanation = serializers.CharField()
    review_note = serializers.CharField(allow_blank=True)


class TaskSubjectSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    title = serializers.CharField()
    prompt = serializers.CharField()
    documents = serializers.ListField(child=serializers.DictField(), required=False)
    cues = serializers.ListField(child=serializers.CharField(), required=False)


class TaskSerializer(serializers.Serializer):
    slug = serializers.CharField()
    number = serializers.IntegerField()
    title = serializers.CharField()
    advice = serializers.ListField(child=serializers.CharField())
    genre = serializers.CharField(required=False)
    min = serializers.IntegerField(required=False)
    max = serializers.IntegerField(required=False)
    minutes = serializers.IntegerField(required=False)
    goal = serializers.CharField(required=False)
    seconds = serializers.IntegerField(required=False)
    prepSeconds = serializers.IntegerField(required=False)
    subjects = TaskSubjectSerializer(many=True)


class TaskSetSerializer(serializers.Serializer):
    title = serializers.CharField(allow_blank=True)
    tasks = TaskSerializer(many=True)
    corrector = serializers.CharField(required=False, allow_blank=True)
    examiner = serializers.CharField(required=False, allow_blank=True)


class CorrectionRequestSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=8000, trim_whitespace=True)


class CorrectionCriterionSerializer(serializers.Serializer):
    id = serializers.ChoiceField(choices=["consigne", "organisation", "lexique", "grammaire"])
    label = serializers.CharField()
    level = serializers.ChoiceField(choices=["A1", "A2", "B1", "B2", "C1", "C2"])
    comment = serializers.CharField(required=False, allow_blank=True)


class CorrectionErrorSerializer(serializers.Serializer):
    original = serializers.CharField()
    correction = serializers.CharField(allow_blank=True)
    explanation = serializers.CharField()


class CorrectionSerializer(serializers.Serializer):
    """Format commun à tous les fournisseurs ; une réponse hors format n’est jamais montrée à l’étudiant."""

    demo = serializers.BooleanField()
    level = serializers.ChoiceField(choices=["A1", "A2", "B1", "B2", "C1", "C2"])
    score = serializers.IntegerField(min_value=0, max_value=20)
    summary = serializers.CharField()
    feedback = serializers.CharField(required=False, allow_blank=True, default="")
    criteria = CorrectionCriterionSerializer(many=True)
    errors = CorrectionErrorSerializer(many=True)
    improved = serializers.CharField(allow_blank=True)  # vide quand le texte est parfait
    advice = serializers.ListField(child=serializers.CharField())
    goal = serializers.CharField()
    off_topic = serializers.BooleanField(default=False)
    off_topic_reason = serializers.CharField(default="", allow_blank=True)
    disclaimer = serializers.CharField()
    remaining = serializers.IntegerField(required=False)


class ModelAnswerSerializer(serializers.Serializer):
    demo = serializers.BooleanField()
    text = serializers.CharField()
    words = serializers.IntegerField(required=False)


class SpeakingRequestSerializer(StrictSerializer):
    subject_id = serializers.IntegerField(min_value=1)
    mode = serializers.ChoiceField(choices=["practice", "simulation"])


class SpeakingSessionSerializer(serializers.Serializer):
    """Ce que reçoit le navigateur : une clé éphémère, jamais la clé d’API du serveur."""

    id = serializers.IntegerField()
    demo = serializers.BooleanField()
    client_secret = serializers.CharField()
    expires_at = serializers.DateTimeField()
    model = serializers.CharField()
    voice = serializers.CharField()
    seconds = serializers.IntegerField()
    prep_seconds = serializers.IntegerField()


class SpeakingTurnSerializer(StrictSerializer):
    role = serializers.ChoiceField(choices=["examiner", "candidate"])
    text = serializers.CharField(max_length=4000, allow_blank=True, trim_whitespace=True)


class SpeakingUsageSerializer(StrictSerializer):
    """Jetons rapportés par la session vocale (somme des response.done), pour mesurer le coût réel."""

    audio_in = serializers.IntegerField(min_value=0, max_value=50_000_000, default=0)
    cached_audio_in = serializers.IntegerField(min_value=0, max_value=50_000_000, default=0)
    text_in = serializers.IntegerField(min_value=0, max_value=50_000_000, default=0)
    audio_out = serializers.IntegerField(min_value=0, max_value=50_000_000, default=0)
    text_out = serializers.IntegerField(min_value=0, max_value=50_000_000, default=0)
    transcription_seconds = serializers.FloatField(min_value=0, max_value=7200, default=0)


class SpeakingFinishSerializer(StrictSerializer):
    seconds = serializers.IntegerField(min_value=0, max_value=7200)
    transcript = SpeakingTurnSerializer(many=True, max_length=400)
    usage = SpeakingUsageSerializer(required=False)


class SpeakingFinishedSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    status = serializers.CharField()
    seconds = serializers.IntegerField()
    seconds_left = serializers.IntegerField()


class SeriesDetailSerializer(SeriesSerializer):
    questions = SeriesQuestionSerializer(many=True, required=False)
    tasks = TaskSerializer(many=True, required=False)
    review_note = serializers.CharField(required=False, allow_blank=True)
