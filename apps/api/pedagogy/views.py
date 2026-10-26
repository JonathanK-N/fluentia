"""API éditoriale privée et médias servis sous contrôle de la tentative."""

from django.db import transaction, IntegrityError
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiTypes, OpenApiParameter
from rest_framework import generics
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from accounts.views import SecureView
from exams.serializers import ExamListSerializer
from exams.views import CataloguePagination
from .models import BankItem
from .serializers import (
    BankSerializer,
    ContentSerializer,
    EditSerializer,
    TransitionSerializer,
    PublishSerializer,
    MediaUploadSerializer,
    MediaSerializer,
    EventSerializer,
    ImportSerializer,
    ExportSerializer,
)
from .services import (
    create_item,
    edit_item,
    transition,
    fork_item,
    publish_exam,
    upload_media,
    claim_audio,
    CONTENT_FIELDS,
    require,
)


class EditorPermission(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.is_active
            and request.user.is_staff
            and request.user.has_perm("pedagogy.view_bankitem")
        )


class EditorThrottle(UserRateThrottle):
    scope = "pedagogy"
    rate = "120/minute"


class EditorView(SecureView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [EditorPermission]
    throttle_classes = [EditorThrottle]


@extend_schema(
    parameters=[
        OpenApiParameter("skill", str, description="reading ou listening"),
        OpenApiParameter(
            "difficulty", str, description="Difficulté proposée : non_calibree, A1 à C2"
        ),
        OpenApiParameter(
            "state", str, description="draft, review, approved ou published"
        ),
    ]
)
class BankListView(generics.ListAPIView, EditorView):
    serializer_class = BankSerializer
    pagination_class = CataloguePagination
    queryset = BankItem.objects.all()

    def get_queryset(self):
        data = self.queryset
        for field in ["skill", "difficulty", "state"]:
            value = self.request.query_params.get(field)
            if value:
                data = data.filter(**{field: value})
        return data

    @extend_schema(request=ContentSerializer, responses={201: BankSerializer})
    def post(self, request):
        data = ContentSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        return Response(
            BankSerializer(create_item(request.user, data.validated_data)).data,
            status=201,
        )


class BankDetailView(EditorView):
    @extend_schema(responses=BankSerializer)
    def get(self, request, item_id):
        return Response(BankSerializer(get_object_or_404(BankItem, pk=item_id)).data)

    @extend_schema(request=EditSerializer, responses=BankSerializer)
    def put(self, request, item_id):
        data = EditSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        values = dict(data.validated_data)
        revision = values.pop("revision")
        return Response(
            BankSerializer(edit_item(request.user, item_id, revision, values)).data
        )


class TransitionView(EditorView):
    @extend_schema(request=TransitionSerializer, responses=BankSerializer)
    def post(self, request, item_id):
        data = TransitionSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        return Response(
            BankSerializer(
                transition(request.user, item_id, **data.validated_data)
            ).data
        )


class ForkView(EditorView):
    @extend_schema(request=None, responses={201: BankSerializer})
    def post(self, request, item_id):
        get_object_or_404(BankItem, pk=item_id)
        return Response(
            BankSerializer(fork_item(request.user, item_id)).data, status=201
        )


class HistoryView(EditorView):
    @extend_schema(responses=EventSerializer(many=True))
    def get(self, request, item_id):
        item = get_object_or_404(BankItem, pk=item_id)
        return Response(EventSerializer(item.events.all(), many=True).data)


class PublishView(EditorView):
    @extend_schema(request=PublishSerializer, responses={201: ExamListSerializer})
    def post(self, request):
        data = PublishSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        try:
            exam = publish_exam(request.user, **data.validated_data)
        except IntegrityError as exc:
            raise ValidationError(
                "Publication concurrente ou incohérente ; rechargez les versions."
            ) from exc
        exam.question_count = exam.questions.count()
        return Response(ExamListSerializer(exam).data, status=201)


class MediaUploadView(EditorView):
    parser_classes = [MultiPartParser]

    @extend_schema(request=MediaUploadSerializer, responses={201: MediaSerializer})
    def post(self, request):
        data = MediaUploadSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        values = dict(data.validated_data)
        uploaded = values.pop("file")
        return Response(
            MediaSerializer(upload_media(request.user, uploaded, **values)).data,
            status=201,
        )


class BankImportView(EditorView):
    @extend_schema(request=ImportSerializer, responses={201: BankSerializer(many=True)})
    def post(self, request):
        require(request.user, "add_bankitem")
        if len(request.body) > 2_000_000:
            raise ValidationError("Import limité à 2 Mo.")
        data = ImportSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        with transaction.atomic():
            items = [
                create_item(request.user, row) for row in data.validated_data["items"]
            ]
        return Response(BankSerializer(items, many=True).data, status=201)


class BankExportView(EditorView):
    @extend_schema(responses=ExportSerializer)
    def get(self, request):
        # Pagination explicite : l'export d'un lot ne prétend pas exporter toute la banque.
        try:
            offset = max(0, int(request.query_params.get("offset", 0)))
            if offset > 10_000_000:
                raise ValidationError("Offset limité à dix millions d’items.")
        except ValueError as exc:
            raise ValidationError("Offset invalide.") from exc
        rows = []
        for item in BankItem.objects.order_by("created_at", "id")[
            offset : offset + 100
        ]:
            row = {
                key: str(item.media_id)
                if key == "media" and item.media_id
                else None
                if key == "media"
                else getattr(item, key)
                for key in CONTENT_FIELDS
            }
            row["provenance"] += (
                f"\nExport Fluentia : famille {item.family}, version {item.version}, item {item.pk}. Import à relire."
            )
            rows.append(row)
        response = Response({"format": "fluentia.bank.v1", "items": rows})
        response["X-Export-Next-Offset"] = (
            str(offset + 100) if BankItem.objects.count() > offset + 100 else ""
        )
        return response


class AudioView(SecureView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    throttle_classes = [EditorThrottle]

    @extend_schema(request=None, responses={(200, "audio/wav"): OpenApiTypes.BINARY})
    def post(self, request, attempt_id, question_id):
        asset, payload = claim_audio(request.user, attempt_id, question_id)
        response = HttpResponse(payload, content_type="audio/wav")
        response["Cache-Control"] = "private, no-store"
        response["Content-Disposition"] = 'inline; filename="document.wav"'
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Audio-Duration-Ms"] = str(asset.duration_ms)
        return response
