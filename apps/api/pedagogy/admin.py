"""Consultation et transitions ; édition complète dans l'espace éditorial protégé."""

from django.contrib import admin, messages
from django.core.exceptions import ValidationError as ModelValidationError
from rest_framework.exceptions import APIException
from .models import (
    BankItem,
    ImageAsset,
    MediaAsset,
    SeriesImport,
    SpeakingSession,
    TaskSet,
    TaskSubject,
    EditorialEvent,
    PublishedItem,
    ListeningAccess,
    ExamSeries,
    MockExam,
    MockExamRun,
)
from .services import transition, fork_item


class AuditAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.action(description="Demander une relecture humaine", permissions=["view"])
def request_review(modeladmin, request, queryset):
    for item in queryset:
        try:
            transition(request.user, item.pk, item.revision, "request_review")
            modeladmin.message_user(request, "Demande de relecture enregistrée.")
        except (APIException, ModelValidationError) as exc:
            modeladmin.message_user(request, str(exc), level=messages.ERROR)


@admin.action(description="Créer un nouveau brouillon versionné", permissions=["view"])
def new_version(modeladmin, request, queryset):
    for item in queryset:
        try:
            result = fork_item(request.user, item.pk)
            modeladmin.message_user(
                request,
                f"Brouillon v{result.version} créé ; aucune approbation héritée.",
            )
        except (APIException, ModelValidationError) as exc:
            modeladmin.message_user(request, str(exc), level=messages.ERROR)


@admin.register(BankItem)
class BankAdmin(AuditAdmin):
    list_display = [
        "statement",
        "skill",
        "difficulty",
        "version",
        "state",
        "editor",
        "reviewer",
    ]
    list_filter = ["skill", "difficulty", "state"]
    search_fields = ["statement", "passage", "provenance", "credit"]
    actions = [request_review, new_version]


@admin.register(EditorialEvent)
class EventAdmin(AuditAdmin):
    list_display = ["item", "action", "actor", "created_at"]
    list_filter = ["action"]


@admin.register(MediaAsset)
class MediaAdmin(AuditAdmin):
    list_display = ["title", "duration_ms", "size", "created_by", "created_at"]
    search_fields = ["title", "provenance"]


admin.site.register(PublishedItem, AuditAdmin)
admin.site.register(ListeningAccess, AuditAdmin)
admin.site.register(ExamSeries, AuditAdmin)


@admin.register(SeriesImport)
class SeriesImportAdmin(AuditAdmin):
    list_display = ["title", "skill", "mode", "question_count", "file_name", "created_by", "created_at", "exam"]
    list_filter = ["skill", "mode"]
    search_fields = ["title", "file_name"]

    @admin.display(description="Questions ou sujets")
    def question_count(self, obj):
        return obj.task_set.subjects.count() if obj.task_set_id else len(obj.item_ids)


@admin.register(ImageAsset)
class ImageAdmin(AuditAdmin):
    list_display = ["title", "width", "height", "size", "content_type", "created_by", "created_at"]
    search_fields = ["title", "provenance"]


class TaskSubjectInline(admin.TabularInline):
    model = TaskSubject
    extra = 0
    fields = ["task_number", "position", "title", "prompt"]

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(SpeakingSession)
class SpeakingSessionAdmin(AuditAdmin):
    list_display = ["user", "subject", "mode", "provider", "model", "status", "seconds", "estimated_cost_usd", "started_at"]
    list_filter = ["mode", "provider", "status"]
    search_fields = ["user__email"]


@admin.register(TaskSet)
class TaskSetAdmin(AuditAdmin):
    list_display = ["title", "skill", "state", "is_active", "editor", "reviewer", "published_at"]
    list_filter = ["skill", "state", "is_active"]
    inlines = [TaskSubjectInline]


@admin.register(MockExam)
class MockExamAdmin(admin.ModelAdmin):
    """Examens TCF : les 4 épreuves choisies ici sont passées dans l’ordre par l’étudiant, puis corrigées à la fin."""

    list_display = ["title", "position", "is_published", "listening", "reading"]
    list_editable = ["position", "is_published"]
    list_filter = ["is_published"]
    fieldsets = [
        (None, {"fields": ["title", "position", "is_published"]}),
        ("1. Écoute et 2. Lecture", {"fields": ["listening", "reading"]}),
        ("3. Rédaction", {"fields": ["writing_1", "writing_2", "writing_3"]}),
        ("4. Oral", {"fields": ["speaking_1", "speaking_2", "speaking_3"]}),
    ]

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        field = super().formfield_for_foreignkey(db_field, request, **kwargs)
        if db_field.name.startswith(("writing_", "speaking_")):
            field.queryset = field.queryset.select_related("task_set")
        return field


@admin.register(MockExamRun)
class MockExamRunAdmin(AuditAdmin):
    list_display = ["user", "exam", "started_at", "finished_at"]
    list_filter = ["exam"]
    search_fields = ["user__email"]
