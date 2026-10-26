"""Transitions éditoriales contrôlées et assemblage de versions d'examens."""

import hashlib
import io
import uuid
import wave
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ValidationError as ModelValidationError
from django.db import transaction
from django.db.models import F, Max
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError, NotFound

from exams.models import Exam, Question, Choice
from .models import (
    BankItem,
    MediaAsset,
    EditorialEvent,
    PublishedItem,
    ListeningAccess,
    ExamSeries,
)

CONTENT_FIELDS = (
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
)


def require(actor, permission):
    if (
        not actor.is_active
        or not actor.is_staff
        or not actor.has_perm("pedagogy." + permission)
    ):
        raise PermissionDenied("Droit pédagogique requis.")


def snapshot(item):
    return {
        "id": str(item.pk),
        "family": str(item.family),
        "version": item.version,
        "revision": item.revision,
        "state": item.state,
        "editor_id": item.editor_id,
        "reviewer_id": item.reviewer_id,
        "reviewed_at": item.reviewed_at.isoformat() if item.reviewed_at else None,
        "review_note": item.review_note,
        **{
            key: str(item.media_id)
            if key == "media" and item.media_id
            else None
            if key == "media"
            else getattr(item, key)
            for key in CONTENT_FIELDS
        },
    }


def event(item, actor, action, before=None):
    EditorialEvent.objects.create(
        item=item, actor=actor, action=action, before=before or {}, after=snapshot(item)
    )


def persist(item):
    try:
        item.save()
    except ModelValidationError as exc:
        raise ValidationError(
            exc.message_dict if hasattr(exc, "message_dict") else exc.messages
        ) from exc


@transaction.atomic
def create_item(actor, data):
    require(actor, "add_bankitem")
    item = BankItem(editor=actor, **data)
    persist(item)
    event(item, actor, "create")
    return item


def locked_item(item_id, revision):
    changed = BankItem.objects.filter(
        pk=item_id, revision=revision, state__in=["draft", "review"]
    ).update(revision=F("revision") + 1)
    if not changed:
        if not BankItem.objects.filter(pk=item_id).exists():
            raise NotFound()
        raise ValidationError(
            {"revision": "Cette version a changé ; rechargez-la avant de continuer."}
        )
    return BankItem.objects.select_related("media").get(pk=item_id)


@transaction.atomic
def edit_item(actor, item_id, revision, data):
    require(actor, "change_bankitem")
    # Le filtre empêche d'écrire sur un item figé avant le garde-fou SQL.
    if BankItem.objects.filter(
        pk=item_id, state__in=["approved", "published"]
    ).exists():
        raise ValidationError("Créez une nouvelle version de cet item approuvé.")
    item = locked_item(item_id, revision)
    if item.state != "draft":
        raise ValidationError("Seul un brouillon peut être modifié.")
    before = snapshot(item)
    before["revision"] -= 1
    for key, value in data.items():
        setattr(item, key, value)
    item.editor = actor
    persist(item)
    event(item, actor, "edit", before)
    return item


@transaction.atomic
def transition(actor, item_id, revision, action, note="", attest=False):
    require(
        actor,
        "review_bankitem" if action in ["approve", "reject"] else "change_bankitem",
    )
    if BankItem.objects.filter(
        pk=item_id, state__in=["approved", "published"]
    ).exists():
        raise ValidationError("Cette version est figée.")
    item = locked_item(item_id, revision)
    before = snapshot(item)
    before["revision"] -= 1
    if action == "request_review" and item.state == "draft":
        item.state = "review"
    elif action in ["approve", "reject"] and item.state == "review":
        if not item.editor_id or item.editor_id == actor.pk or not note.strip():
            raise ValidationError(
                "Une relecture documentée par une personne distincte est requise."
            )
        if action == "approve":
            if attest is not True:
                raise ValidationError(
                    "Attestez la relecture réelle du texte, des choix, du média et de leurs droits."
                )
            item.state, item.reviewer, item.reviewed_at, item.review_note = (
                "approved",
                actor,
                timezone.now(),
                note,
            )
        else:
            item.state, item.review_note = "draft", note
    else:
        raise ValidationError("Transition éditoriale impossible.")
    persist(item)
    event(item, actor, action, before)
    return item


@transaction.atomic
def fork_item(actor, item_id):
    require(actor, "add_bankitem")
    # Verrou du premier membre de famille, commun à tous les forks concurrents.
    original = BankItem.objects.get(pk=item_id)
    anchor = BankItem.objects.filter(family=original.family).order_by("version").first()
    BankItem.objects.select_for_update().get(pk=anchor.pk)
    version = (
        BankItem.objects.filter(family=original.family).aggregate(v=Max("version"))["v"]
        + 1
    )
    item = BankItem(
        family=original.family,
        version=version,
        editor=actor,
        **{key: getattr(original, key) for key in CONTENT_FIELDS},
    )
    persist(item)
    event(item, actor, "new_version", snapshot(original))
    return item


@transaction.atomic
def publish_exam(
    actor, *, slug, title, skill, mode, duration_seconds, item_ids, description=""
):
    require(actor, "publish_bankitem")
    if len(item_ids) != len(set(item_ids)) or not item_ids or len(item_ids) > 100:
        raise ValidationError("Choisissez de un à cent items distincts.")
    # Verrou commun du compte de publication ; les contraintes slug/version arbitrent aussi entre comptes.
    ExamSeries.objects.get_or_create(slug=slug)
    ExamSeries.objects.filter(pk=slug).update(lock_version=F("lock_version") + 1)
    items = {
        str(i.pk): i
        for i in BankItem.objects.select_for_update()
        .filter(pk__in=item_ids)
        .order_by("pk")
    }
    if len(items) != len(item_ids):
        raise ValidationError("Item inexistant.")
    if mode == "simulation":
        ranks = {
            value: index
            for index, value in enumerate(["A1", "A2", "B1", "B2", "C1", "C2"])
        }
        levels = [ranks.get(items[str(key)].difficulty, -1) for key in item_ids]
        if -1 in levels or levels != sorted(levels):
            raise ValidationError(
                "Une simulation exige des difficultés proposées renseignées et ordonnées de façon croissante. Cela ne vaut pas calibration officielle."
            )
    version = (Exam.objects.filter(slug=slug).aggregate(v=Max("version"))["v"] or 0) + 1
    exam = Exam(
        slug=slug,
        title=title,
        skill=skill,
        mode=mode,
        duration_seconds=duration_seconds,
        version=version,
        description=description,
    )
    try:
        exam.save()
        for position, item_id in enumerate(item_ids, 1):
            item = items[str(item_id)]
            if item.state not in ["approved", "published"] or item.skill != skill:
                raise ValidationError(
                    "Chaque item doit être approuvé humainement et correspondre à la compétence."
                )
            item.full_clean()
            if item.media_id:
                read_media(item.media)
            question = Question.objects.create(
                exam=exam,
                position=position,
                statement=item.statement,
                reading_passage=item.passage,
                audio_key=str(item.media_id) if item.media_id else "",
                explanation=item.explanation,
                difficulty=item.difficulty,
                origin=item.origin,
                source_reference=item.provenance
                + ("\n" + item.media.provenance if item.media_id else ""),
                validation_status="validated",
                author=item.editor,
                reviewer=item.reviewer,
                reviewed_at=item.reviewed_at,
            )
            for index, label in enumerate(item.choices):
                Choice.objects.create(
                    question=question,
                    position=index + 1,
                    label=label,
                    is_correct=index == item.correct_index,
                )
            PublishedItem.objects.create(item=item, question=question)
            before = snapshot(item)
            if item.state == "approved":
                BankItem.objects.filter(pk=item.pk, state="approved").update(
                    state="published"
                )
                item.state = "published"
            event(item, actor, "publish_exam", {**before, "exam_id": str(exam.pk)})
        exam.is_published = True
        exam.save()
    except ModelValidationError as exc:
        raise ValidationError(exc.messages) from exc
    return exam


def media_path(asset):
    return Path(settings.PRIVATE_MEDIA_ROOT) / (str(asset.pk) + ".wav")


def read_media(asset):
    try:
        if asset.size > 20_000_000 or media_path(asset).stat().st_size != asset.size:
            raise ValidationError("Taille du média incohérente.")
        with media_path(asset).open("rb") as source:
            payload = source.read(asset.size + 1)
    except OSError as exc:
        raise NotFound("Document audio indisponible.") from exc
    if (
        len(payload) != asset.size
        or hashlib.sha256(payload).hexdigest() != asset.sha256
    ):
        raise ValidationError("L’intégrité du document audio n’est plus garantie.")
    return payload


def upload_media(actor, uploaded, *, title, transcript, provenance):
    require(actor, "add_mediaasset")
    if uploaded.size > 20_000_000:
        raise ValidationError("Le média dépasse 20 Mo.")
    payload = uploaded.read(20_000_001)
    try:
        with wave.open(io.BytesIO(payload), "rb") as audio:
            frames, rate, channels, width = (
                audio.getnframes(),
                audio.getframerate(),
                audio.getnchannels(),
                audio.getsampwidth(),
            )
            if (
                rate not in [8000, 16000, 22050, 24000, 44100, 48000]
                or channels not in [1, 2]
                or width not in [1, 2]
                or audio.getcomptype() != "NONE"
                or not 0 < frames / rate <= 900
            ):
                raise ValueError()
            if len(audio.readframes(frames)) != frames * channels * width:
                raise ValueError()
    except (wave.Error, EOFError, ValueError) as exc:
        raise ValidationError(
            "Un WAV PCM intègre de 15 minutes maximum est requis."
        ) from exc
    asset = MediaAsset(
        title=title,
        transcript=transcript,
        provenance=provenance,
        created_by=actor,
        size=len(payload),
        sha256=hashlib.sha256(payload).hexdigest(),
        duration_ms=max(1, round(1000 * frames / rate)),
    )
    asset.full_clean()
    path = media_path(asset)
    path.parent.mkdir(parents=True, exist_ok=True)
    created = False
    try:
        with path.open("xb") as output:
            created = True
            output.write(payload)
        asset.save()
    except Exception:
        if created:
            path.unlink(missing_ok=True)
        raise
    return asset


def audio_asset(question):
    try:
        asset_id = uuid.UUID(question.audio_key)
    except (ValueError, TypeError, AttributeError) as exc:
        raise NotFound("Document audio non intégré à la banque privée.") from exc
    try:
        return MediaAsset.objects.get(pk=asset_id)
    except MediaAsset.DoesNotExist as exc:
        raise NotFound("Document audio indisponible.") from exc


def listening_guard(attempt, question):
    """Autorise la réponse seulement après diffusion et avant la question suivante."""
    access = ListeningAccess.objects.filter(attempt=attempt, question=question).first()
    if (
        not access
        or timezone.now() < access.ends_at
        or ListeningAccess.objects.filter(
            attempt=attempt, question__position__gt=question.position
        ).exists()
    ):
        raise ValidationError(
            "Cette question ne peut pas recevoir de réponse à cet instant."
        )


def claim_audio(user, attempt_id, question_id):
    from exams.services import _locked_attempt, _active_error

    error = None
    with transaction.atomic():
        attempt = _locked_attempt(attempt_id, user)
        error = _active_error(attempt)
        if not error:
            question = Question.objects.filter(
                pk=question_id, exam=attempt.exam, exam__skill="listening"
            ).first()
            if question is None:
                raise NotFound()
            asset = audio_asset(question)
            payload = read_media(asset)
            error = _active_error(attempt)
            if not error and attempt.exam.mode == "simulation":
                if ListeningAccess.objects.filter(
                    attempt=attempt, question=question
                ).exists():
                    raise ValidationError(
                        "Ce document a déjà été délivré pour cette simulation."
                    )
                prior = list(
                    attempt.exam.questions.filter(
                        position__lt=question.position
                    ).values_list("pk", flat=True)
                )
                if ListeningAccess.objects.filter(
                    attempt=attempt, question_id__in=prior, ends_at__lte=timezone.now()
                ).count() != len(prior):
                    raise ValidationError(
                        "Terminez l’écoute précédente avant de continuer."
                    )
                now = timezone.now()
                if now + timedelta(milliseconds=asset.duration_ms) > attempt.expires_at:
                    raise ValidationError(
                        "Le temps restant ne permet pas de démarrer ce document."
                    )
                ListeningAccess.objects.create(
                    attempt=attempt,
                    question=question,
                    started_at=now,
                    ends_at=now + timedelta(milliseconds=asset.duration_ms),
                )
    if error:
        raise ValidationError({"attempt": error})
    return asset, payload
