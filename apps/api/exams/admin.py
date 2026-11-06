"""Édition pédagogique en brouillon ; historique et résultats en lecture seule."""

from django.contrib import admin, messages
from django.core.exceptions import ValidationError
from django.db import transaction
from .models import Exam, Question, Choice, Attempt, Answer


@admin.action(description="Publier après vérification pédagogique")
def publish(modeladmin, request, queryset):
    for item in queryset:
        try:
            with transaction.atomic():
                exam = Exam.objects.select_for_update().get(pk=item.pk)
                exam.is_published = True
                exam.save()
        except ValidationError as exc:
            modeladmin.message_user(
                request, "; ".join(exc.messages), level=messages.ERROR
            )
        else:
            modeladmin.message_user(request, f"Version {exam.version} publiée.")


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ("title", "skill", "mode", "version", "is_published", "published_at")
    list_filter = ("skill", "mode", "is_published")
    search_fields = ("title", "slug")
    actions = [publish]

    def get_readonly_fields(self, request, obj=None):
        if obj and obj.published_at:
            return tuple(
                f.name for f in self.model._meta.fields if f.name != "is_published"
            )
        return ("published_at", "is_published")

    def has_delete_permission(self, request, obj=None):
        return bool(
            obj and not obj.published_at and super().has_delete_permission(request, obj)
        )


class ContentAdmin(admin.ModelAdmin):
    def frozen(self, obj):
        return bool(
            obj
            and (
                obj.exam.published_at
                if isinstance(obj, Question)
                else obj.question.exam.published_at
            )
        )

    def get_readonly_fields(self, request, obj=None):
        return (
            tuple(f.name for f in self.model._meta.fields) if self.frozen(obj) else ()
        )

    def has_delete_permission(self, request, obj=None):
        return bool(
            obj and not self.frozen(obj) and super().has_delete_permission(request, obj)
        )


@admin.register(Question)
class QuestionAdmin(ContentAdmin):
    list_display = (
        "exam",
        "position",
        "statement",
        "validation_status",
        "author",
        "reviewer",
    )
    list_filter = ("exam", "validation_status")


@admin.register(Choice)
class ChoiceAdmin(ContentAdmin):
    list_display = ("question", "position", "is_correct")


class ReadOnlyAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


admin.site.register(Attempt, ReadOnlyAdmin)
admin.site.register(Answer, ReadOnlyAdmin)
