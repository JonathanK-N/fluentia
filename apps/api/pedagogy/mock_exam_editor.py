"""Espace éditorial : composer, publier et retirer les Examens TCF sans passer par l’administration Django."""

from django.core.exceptions import ValidationError as ModelValidationError
from django.db.models import Q
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiTypes, extend_schema
from rest_framework import serializers
from rest_framework.response import Response

from exams.models import Exam
from .models import MockExam, TaskSubject, TaskSet
from .views import EditorView

SUBJECT_FIELDS = [f"{skill}_{n}" for skill in ("writing", "speaking") for n in (1, 2, 3)]


def exams_of(skill):
    return Exam.objects.filter(skill=skill, is_published=True).order_by("title", "-version")


def subjects_of(skill, number):
    # Sujets relus et publiés, ou ceux du jeu actif que voient déjà les étudiants.
    return TaskSubject.objects.filter(
        Q(task_set__state=TaskSet.State.PUBLISHED) | Q(task_set__is_active=True), task_set__skill=skill, task_number=number,
    ).select_related("task_set").order_by("task_set__title", "position")


class MockExamSerializer(serializers.ModelSerializer):
    listening = serializers.PrimaryKeyRelatedField(queryset=exams_of("listening"), allow_null=True, required=False)
    reading = serializers.PrimaryKeyRelatedField(queryset=exams_of("reading"), allow_null=True, required=False)
    writing_1 = serializers.PrimaryKeyRelatedField(queryset=subjects_of("writing", 1), allow_null=True, required=False)
    writing_2 = serializers.PrimaryKeyRelatedField(queryset=subjects_of("writing", 2), allow_null=True, required=False)
    writing_3 = serializers.PrimaryKeyRelatedField(queryset=subjects_of("writing", 3), allow_null=True, required=False)
    speaking_1 = serializers.PrimaryKeyRelatedField(queryset=subjects_of("speaking", 1), allow_null=True, required=False)
    speaking_2 = serializers.PrimaryKeyRelatedField(queryset=subjects_of("speaking", 2), allow_null=True, required=False)
    speaking_3 = serializers.PrimaryKeyRelatedField(queryset=subjects_of("speaking", 3), allow_null=True, required=False)

    class Meta:
        model = MockExam
        fields = ["id", "title", "position", "is_published", "listening", "reading", *SUBJECT_FIELDS]

    def validate(self, attrs):
        # Mêmes règles que l’administration : bonnes épreuves, et 4 épreuves choisies pour publier.
        exam = MockExam(**{field.name: getattr(self.instance, field.name) for field in MockExam._meta.concrete_fields} if self.instance else {})
        for key, value in attrs.items():
            setattr(exam, key, value)
        try:
            exam.clean()
        except ModelValidationError as error:
            raise serializers.ValidationError(error.message_dict)
        return attrs


def summary(exam):
    data = MockExamSerializer(exam).data
    data["complete"] = exam.complete()
    data["runs"] = exam.runs.count()
    return data


def options():
    label = lambda s: f"{s.title} · {s.task_set.title}"  # noqa: E731
    return {
        "listening": [{"id": str(e.pk), "label": f"{e.title} (v{e.version})"} for e in exams_of("listening")],
        "reading": [{"id": str(e.pk), "label": f"{e.title} (v{e.version})"} for e in exams_of("reading")],
        **{field: [{"id": s.pk, "label": label(s)} for s in subjects_of(field.split("_")[0], int(field[-1]))] for field in SUBJECT_FIELDS},
    }


class MockExamEditorView(EditorView):
    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        return Response({"exams": [summary(exam) for exam in MockExam.objects.all()], "options": options()})

    @extend_schema(request=MockExamSerializer, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        body = MockExamSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        return Response(summary(body.save()), status=201)


class MockExamEditorDetailView(EditorView):
    @extend_schema(request=MockExamSerializer, responses=OpenApiTypes.OBJECT)
    def put(self, request, exam_id):
        exam = get_object_or_404(MockExam, pk=exam_id)
        body = MockExamSerializer(exam, data=request.data, partial=True)
        body.is_valid(raise_exception=True)
        return Response(summary(body.save()))

    @extend_schema(request=None, responses={204: None})
    def delete(self, request, exam_id):
        exam = get_object_or_404(MockExam, pk=exam_id)
        if exam.runs.exists():
            return Response({"detail": "Des étudiants ont déjà passé cet examen : retirez-le plutôt de la publication."}, status=409)
        exam.delete()
        return Response(status=204)
