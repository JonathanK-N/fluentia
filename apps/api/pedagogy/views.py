"""API éditoriale privée et médias servis sous contrôle de la tentative."""

import json
import re

from datetime import datetime, timedelta, timezone as dt_timezone

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction, IntegrityError
from django.db.models import Sum
from django.http import HttpResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiTypes, OpenApiParameter
from rest_framework import generics
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import NotFound, PermissionDenied, Throttled, ValidationError
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from accounts.subscription import is_premium
from accounts.views import SecureView
from exams.serializers import ExamListSerializer
from exams.views import CataloguePagination
from .models import BankItem, ImageAsset, SpeakingSession, TaskSubject, WritingCorrection
from . import speaking
from .correction import NCLC_GOAL, WORD, AnswerIncomplete, CorrectionUnavailable, correct, nclc, provider, stored_answer
from . import series as workflow
from .importer import SKILLS, ImportRejected, build_template, import_series
from .tasks import active_tasks
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
    SeriesImportSerializer,
    SeriesSerializer,
    SeriesDetailSerializer,
    SeriesActionSerializer,
    TaskSetSerializer,
    CorrectionRequestSerializer,
    CorrectionSerializer,
    ModelAnswerSerializer,
    SpeakingRequestSerializer,
    SpeakingSessionSerializer,
    SpeakingFinishSerializer,
    SpeakingFinishedSerializer,
)
from .services import (
    create_item,
    edit_item,
    transition,
    fork_item,
    publish_exam,
    upload_media,
    claim_audio,
    read_image,
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

    @extend_schema(responses={(200, "audio/wav"): OpenApiTypes.BINARY, (206, "audio/wav"): OpenApiTypes.BINARY})
    def get(self, request, attempt_id, question_id):
        asset, payload = claim_audio(request.user, attempt_id, question_id)
        size, start, end = len(payload), 0, len(payload) - 1
        # Plages d’octets : le navigateur lit et se déplace dans le document sans tout attendre.
        wanted = re.fullmatch(r"bytes=(\d*)-(\d*)", request.headers.get("Range", ""))
        if wanted and any(wanted.groups()):
            first, last = wanted.groups()
            if first:
                start, end = int(first), min(int(last), end) if last else end
            else:
                start = max(0, size - int(last))
            if start > end:
                response = HttpResponse(status=416)
                response["Content-Range"] = f"bytes */{size}"
                return response
        response = HttpResponse(payload[start:end + 1], content_type="audio/wav", status=206 if wanted and any(wanted.groups()) else 200)
        if response.status_code == 206:
            response["Content-Range"] = f"bytes {start}-{end}/{size}"
        response["Accept-Ranges"] = "bytes"
        response["Cache-Control"] = "private, max-age=3600"
        response["Content-Disposition"] = 'inline; filename="document.wav"'
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Audio-Duration-Ms"] = str(asset.duration_ms)
        return response


class TemplateView(EditorView):
    @extend_schema(responses={(200, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"): OpenApiTypes.BINARY})
    def get(self, request, skill):
        if skill not in SKILLS:
            raise ValidationError({"skill": "Épreuve inconnue."})
        response = HttpResponse(
            build_template(skill),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        name = {"reading": "lecture", "listening": "ecoute", "writing": "redaction", "speaking": "oral"}[skill]
        response["Content-Disposition"] = f'attachment; filename="modele-{name}-fluentia.xlsx"'
        return response


class SeriesImportView(EditorView):
    parser_classes = [MultiPartParser]

    @extend_schema(request=SeriesImportSerializer, responses={201: SeriesSerializer})
    def post(self, request):
        data = SeriesImportSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        try:
            series = import_series(request.user, data.validated_data["skill"], data.validated_data["file"])
        except ImportRejected as rejected:
            return Response(rejected.payload, status=400)
        return Response(workflow.summary(series), status=201)


class SeriesListView(EditorView):
    @extend_schema(responses=SeriesSerializer(many=True))
    def get(self, request):
        return Response([workflow.summary(s) for s in workflow.all_series()[:100]])


class SeriesDetailView(EditorView):
    @extend_schema(responses=SeriesDetailSerializer)
    def get(self, request, series_id):
        return Response(workflow.detail(get_object_or_404(workflow.all_series(), pk=series_id)))

    @extend_schema(responses={204: None})
    def delete(self, request, series_id):
        workflow.discard(request.user, get_object_or_404(workflow.all_series(), pk=series_id))
        return Response(status=204)


class SeriesActionView(EditorView):
    @extend_schema(request=SeriesActionSerializer, responses=SeriesSerializer)
    def post(self, request, series_id, action):
        if action not in ("request_review", "approve", "reject", "publish", "withdraw", "restore"):
            raise ValidationError({"action": "Action inconnue."})
        data = SeriesActionSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        series = get_object_or_404(workflow.all_series(), pk=series_id)
        if action in ("withdraw", "restore"):
            workflow.set_online(request.user, series, action == "restore")
        else:
            workflow.act(request.user, series, action, **data.validated_data)
        return Response(workflow.summary(workflow.all_series().get(pk=series_id)))


def image_response(asset):
    response = HttpResponse(read_image(asset), content_type=asset.content_type)
    response["Cache-Control"] = "private, max-age=3600"
    response["X-Content-Type-Options"] = "nosniff"
    return response


class BankImageView(EditorView):
    @extend_schema(responses={(200, "image/png"): OpenApiTypes.BINARY})
    def get(self, request, image_id):
        return image_response(get_object_or_404(ImageAsset, pk=image_id))


class QuestionImageView(SecureView):
    """Image d’une question, réservée à la personne qui passe ou relit la tentative."""

    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    throttle_classes = [EditorThrottle]

    @extend_schema(responses={(200, "image/png"): OpenApiTypes.BINARY})
    def get(self, request, attempt_id, question_id):
        from exams.models import Attempt, Question

        attempt = get_object_or_404(Attempt, pk=attempt_id, user=request.user)
        question = get_object_or_404(Question, pk=question_id, exam_id=attempt.exam_id)
        if not question.image_key:
            raise NotFound("Cette question n’a pas d’image.")
        return image_response(get_object_or_404(ImageAsset, pk=question.image_key))


class TaskListView(SecureView):
    permission_classes = [AllowAny]
    authentication_classes = []
    # Lecture publique comme le catalogue : la limite des connexions bloquerait la page au bout de 20 visites.
    throttle_classes = []

    @extend_schema(responses=TaskSetSerializer)
    def get(self, request, skill):
        if skill not in ("writing", "speaking"):
            raise ValidationError({"skill": "writing ou speaking."})
        return Response(active_tasks(skill))


def writing_subject(subject_id):
    return get_object_or_404(TaskSubject, pk=subject_id, task_set__skill="writing", task_set__is_active=True)


class WritingCorrectionView(SecureView):
    permission_classes = [IsAuthenticated]
    # La limite est comptée en base, par jour : elle survit aux redémarrages et protège le coût de l’IA.
    throttle_classes = []
    MIN_WORDS = 20

    @extend_schema(request=CorrectionRequestSerializer, responses=CorrectionSerializer)
    def post(self, request, subject_id):
        subject = writing_subject(subject_id)
        text = CorrectionRequestSerializer(data=request.data)
        text.is_valid(raise_exception=True)
        text = text.validated_data["text"]
        if len(WORD.findall(text)) < self.MIN_WORDS:
            raise ValidationError({"text": [f"Écrivez au moins {self.MIN_WORDS} mots avant de demander une correction."]})
        if corrections_left(request.user) <= 0:
            limit = settings.WRITING_CORRECTION_DAILY_LIMIT
            raise Throttled(detail=f"Vous avez utilisé vos {limit} corrections des dernières 24 heures. Réessayez demain.")
        try:
            provider("correct")
        except CorrectionUnavailable as error:
            return Response({"detail": str(error)}, status=503)
        # La correction elle-même arrive sur sa page, au fil de l’eau (CorrectionStreamView).
        saved = WritingCorrection.objects.create(
            user=request.user, subject=subject, text=text, status=WritingCorrection.Status.PENDING, provider=settings.WRITING_CORRECTOR
        )
        return Response({"id": saved.pk, "remaining": corrections_left(request.user)}, status=201)


def stream_events(saved):
    """Lignes JSON : corrections partielles, puis la correction finale ou une erreur. Rien n’est compté en cas d’échec."""
    finished, last = False, {}
    try:
        try:
            for last in correct(saved.subject, saved.text):
                yield json.dumps({"partial": last}, ensure_ascii=False) + "\n"
        except CorrectionUnavailable as error:
            yield json.dumps({"error": str(error), "status": 503}, ensure_ascii=False) + "\n"
            return
        result = CorrectionSerializer(data=last)
        if not result.is_valid():
            yield json.dumps({"error": "La correction reçue est incomplète. Réessayez dans un instant.", "status": 502}, ensure_ascii=False) + "\n"
            return
        saved.result, saved.status = result.validated_data, WritingCorrection.Status.DONE
        saved.save(update_fields=["result", "status"])
        finished = True
        yield json.dumps({"done": True, "result": result.validated_data, "remaining": corrections_left(saved.user)}, ensure_ascii=False) + "\n"
    finally:
        if not finished:  # échec ou page fermée en cours de route
            saved.delete()


class CorrectionStreamView(SecureView):
    permission_classes = [IsAuthenticated]
    throttle_classes = []

    @extend_schema(request=None, responses={(200, "application/x-ndjson"): OpenApiTypes.STR})
    def post(self, request, correction_id):
        started = WritingCorrection.objects.filter(
            pk=correction_id, user=request.user, status=WritingCorrection.Status.PENDING, subject__isnull=False
        ).update(status=WritingCorrection.Status.RUNNING)
        if not started:
            get_object_or_404(WritingCorrection, pk=correction_id, user=request.user)
            return Response({"detail": "Cette correction est déjà en cours ou terminée."}, status=409)
        saved = WritingCorrection.objects.select_related("subject", "user").get(pk=correction_id)
        response = StreamingHttpResponse(stream_events(saved), content_type="application/x-ndjson; charset=utf-8")
        response["X-Accel-Buffering"] = "no"  # pas de mise en tampon par un proxy
        return response


def corrections_left(user):
    since = timezone.now() - timedelta(days=1)
    used = WritingCorrection.objects.filter(user=user, created_at__gte=since).count()
    return max(0, settings.WRITING_CORRECTION_DAILY_LIMIT - used)


def subject_link(subject):
    return {"id": subject.pk, "title": subject.title, "task_number": subject.task_number, "task_slug": f"tache-{subject.task_number}"}


class WritingCorrectionDetailView(SecureView):
    """Page de correction : relisible par son auteur seulement, avec le sujet suivant à proposer."""

    permission_classes = [IsAuthenticated]
    throttle_classes = []

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request, correction_id):
        saved = get_object_or_404(WritingCorrection.objects.select_related("subject"), pk=correction_id, user=request.user)
        subject, following = saved.subject, None
        if subject is not None:
            siblings = list(TaskSubject.objects.filter(task_set_id=subject.task_set_id).order_by("task_number", "position"))
            index = next(i for i, item in enumerate(siblings) if item.pk == subject.pk)
            following = siblings[index + 1] if index + 1 < len(siblings) else None
        return Response({
            "id": saved.pk,
            "status": saved.status,
            "created_at": saved.created_at,
            "text": saved.text,
            "result": saved.result,
            "nclc": nclc(saved.result["score"]) if saved.result else None,
            "nclc_goal": NCLC_GOAL,
            "remaining": corrections_left(request.user),
            "subject": subject_link(subject) | {"prompt": subject.prompt, "min_words": subject.min_words, "max_words": subject.max_words} if subject else None,
            "next": subject_link(following) if following else None,
        })


def speaking_seconds_left(user):
    """Minutes d’oral du jour comptées en base sur 24 h glissantes ; une session échouée ne compte pas."""
    since = timezone.now() - timedelta(days=1)
    used = (
        SpeakingSession.objects.filter(user=user, started_at__gte=since)
        .exclude(status=SpeakingSession.Status.FAILED)
        .aggregate(total=Sum("seconds"))["total"]
        or 0
    )
    return max(0, settings.SPEAKING_DAILY_MINUTES * 60 - used)


def free_trial_left(user, subject):
    """Sans Premium : une seule tâche 1 offerte par compte, quelle que soit la date."""
    if subject.task_number != 1:
        return False
    return not (
        SpeakingSession.objects.filter(user=user, subject__task_number=1)
        .exclude(status=SpeakingSession.Status.FAILED)
        .exists()
    )


class SpeakingSessionView(SecureView):
    permission_classes = [IsAuthenticated]
    # La limite est comptée en base, en minutes par jour : elle protège le coût de la voix en direct.
    throttle_classes = []
    MIN_SECONDS = 60

    @extend_schema(request=SpeakingRequestSerializer, responses={201: SpeakingSessionSerializer})
    def post(self, request):
        data = SpeakingRequestSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        subject = get_object_or_404(
            TaskSubject, pk=data.validated_data["subject_id"], task_set__skill="speaking", task_set__is_active=True
        )
        try:
            speaking.provider()
        except speaking.SpeakingUnavailable as error:
            return Response({"detail": str(error)}, status=503)
        with transaction.atomic():
            # Verrou par compte : deux onglets ne peuvent pas dépasser la limite ni rejouer l’essai gratuit.
            get_user_model().objects.select_for_update().get(pk=request.user.pk)
            if not is_premium(request.user) and not free_trial_left(request.user, subject):
                raise PermissionDenied(
                    "L’oral avec examinateur est réservé aux comptes Premium. "
                    "Votre essai gratuit de la tâche 1 a déjà été utilisé, ou ce sujet n’en fait pas partie."
                )
            left = speaking_seconds_left(request.user)
            if left < self.MIN_SECONDS:
                minutes = settings.SPEAKING_DAILY_MINUTES
                raise Throttled(detail=f"Vous avez utilisé vos {minutes} minutes d’oral des dernières 24 heures. Réessayez demain.")
            saved = SpeakingSession.objects.create(
                user=request.user,
                subject=subject,
                mode=data.validated_data["mode"],
                provider=settings.SPEAKING_PROVIDER,
                seconds=min(subject.speak_seconds or left, left),
            )
        try:
            opened = speaking.provider()["session"](subject, request.user)
        except speaking.SpeakingUnavailable as error:
            saved.status, saved.ended_at = SpeakingSession.Status.FAILED, timezone.now()
            saved.save(update_fields=["status", "ended_at"])
            return Response({"detail": str(error)}, status=503)
        saved.model = opened["model"]
        saved.save(update_fields=["model"])
        return Response(
            SpeakingSessionSerializer({
                "id": saved.pk,
                "demo": opened["demo"],
                "client_secret": opened["client_secret"],
                "expires_at": datetime.fromtimestamp(opened["expires_at"], tz=dt_timezone.utc),
                "model": opened["model"],
                "voice": opened["voice"],
                "seconds": saved.seconds,
                "prep_seconds": subject.prep_seconds or 0,
            }).data,
            status=201,
        )


class SpeakingFinishView(SecureView):
    permission_classes = [IsAuthenticated]
    throttle_classes = []

    @extend_schema(request=SpeakingFinishSerializer, responses=SpeakingFinishedSerializer)
    def post(self, request, session_id):
        data = SpeakingFinishSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        with transaction.atomic():
            saved = get_object_or_404(SpeakingSession.objects.select_for_update(), pk=session_id, user=request.user)
            if saved.status not in (SpeakingSession.Status.PENDING, SpeakingSession.Status.LIVE):
                return Response({"detail": "Cette session est déjà terminée."}, status=409)
            # Le temps écoulé est mesuré par le serveur, préparation déduite : le navigateur ne peut pas
            # se rembourser des minutes en envoyant moins, ni dépasser les secondes réservées à l’ouverture.
            now = timezone.now()
            prep = (saved.subject.prep_seconds or 0) if saved.subject else 0
            elapsed = max(0, int((now - saved.started_at).total_seconds()) - prep)
            saved.seconds = min(saved.seconds, max(data.validated_data["seconds"], elapsed))
            saved.transcript = data.validated_data["transcript"]
            saved.status, saved.ended_at = SpeakingSession.Status.FINISHED, now
            saved.estimated_cost_usd = 0 if saved.provider == "demo" else speaking.estimated_cost_ceiling(saved.seconds)
            saved.save(update_fields=["seconds", "transcript", "status", "ended_at", "estimated_cost_usd"])
        return Response(SpeakingFinishedSerializer({
            "id": saved.pk, "status": saved.status, "seconds": saved.seconds, "seconds_left": speaking_seconds_left(request.user),
        }).data)


class ModelAnswerView(SecureView):
    permission_classes = [IsAuthenticated]
    # Rédigée une fois par sujet puis relue en base : pas de coût par étudiant, donc pas de limite.
    throttle_classes = []

    @extend_schema(responses=ModelAnswerSerializer)
    def get(self, request, subject_id):
        try:
            saved = stored_answer(writing_subject(subject_id))
        except CorrectionUnavailable as error:
            return Response({"detail": str(error)}, status=503)
        except AnswerIncomplete:
            return Response({"detail": "La proposition reçue est incomplète. Réessayez dans un instant."}, status=502)
        return Response({"demo": saved.provider == "demo", "text": saved.text, "words": len(WORD.findall(saved.text))})
