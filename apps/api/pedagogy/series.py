"""Circuit d’une série importée : relecture, approbation par une personne distincte, publication."""

import uuid
from collections import Counter

from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify
from rest_framework.exceptions import ValidationError

from exams.models import LEVEL_POINTS
from .models import BankItem, SeriesImport, TaskSet
from .services import publish_exam, require, transition
from .tasks import tasks_payload

STATES = ["draft", "review", "approved", "published"]


def items_of(series):
    ids = [uuid.UUID(value) for value in series.item_ids]
    found = BankItem.objects.select_related("media").in_bulk(ids)
    return [found[key] for key in ids if key in found]


def summary(series):
    states = [series.task_set.state] if series.task_set_id else [item.state for item in items_of(series)]
    counts = Counter(states)
    payload = {
        "id": str(series.pk), "skill": series.skill, "title": series.title, "mode": series.mode,
        "description": series.description, "file_name": series.file_name, "created_at": series.created_at,
        "created_by": series.created_by_id, "status": min(states, key=STATES.index) if states else "draft", "counts": dict(counts),
        "size": len(series.item_ids) if not series.task_set_id else series.task_set.subjects.count(),
        "exam": {"id": str(series.exam_id), "version": series.exam.version, "is_published": series.exam.is_published} if series.exam_id else None,
        "active": bool(series.task_set_id and series.task_set.is_active),
    }
    return payload


def detail(series):
    payload = summary(series)
    if series.task_set_id:
        payload["tasks"] = tasks_payload(series.task_set)["tasks"]
        payload["review_note"] = series.task_set.review_note
        return payload
    payload["questions"] = [
        {
            "id": str(item.pk), "position": position, "state": item.state, "level": item.difficulty,
            "points": LEVEL_POINTS.get(item.difficulty, 1), "statement": item.statement, "passage": item.passage,
            "image": str(item.image_id) if item.image_id else None, "image_text": item.image_text,
            "transcript": item.media.transcript if item.media_id else "", "choices": item.choices,
            "correct_index": item.correct_index, "explanation": item.explanation, "review_note": item.review_note,
        }
        for position, item in enumerate(items_of(series), 1)
    ]
    return payload


@transaction.atomic
def act(actor, series, action, note="", attest=False):
    """request_review, approve, reject ou publish, appliqué à toute la série."""
    if series.task_set_id:
        return act_on_tasks(actor, series.task_set, action, note, attest)
    items = items_of(series)
    if action == "publish":
        require(actor, "publish_bankitem")
        if any(item.state not in ("approved", "published") for item in items):
            raise ValidationError("Toutes les questions doivent être approuvées avant publication.")
        exam = publish_exam(
            actor, slug=slugify(series.title)[:120] or f"serie-{series.pk}", title=series.title,
            skill=series.skill, mode=series.mode, duration_seconds=series.duration_seconds,
            item_ids=series.item_ids, description=series.description,
        )
        series.exam = exam
        series.save(update_fields=["exam"])
        return
    source = {"request_review": "draft", "approve": "review", "reject": "review"}[action]
    targets = [item for item in items if item.state == source]
    if not targets:
        raise ValidationError("Aucune question n’est à cette étape.")
    for item in targets:
        transition(actor, item.pk, item.revision, action, note=note, attest=attest)


def act_on_tasks(actor, task_set, action, note, attest):
    if action == "request_review":
        require(actor, "change_bankitem")
        expected = "draft"
    elif action in ("approve", "reject"):
        require(actor, "review_bankitem")
        expected = "review"
        if not task_set.editor_id or task_set.editor_id == actor.pk or not note.strip():
            raise ValidationError("Une relecture documentée par une personne distincte est requise.")
        if action == "approve" and attest is not True:
            raise ValidationError("Attestez la relecture réelle des sujets, des documents et de leurs droits.")
    else:
        require(actor, "publish_bankitem")
        expected = "approved"
    locked = TaskSet.objects.select_for_update().get(pk=task_set.pk)
    if locked.state != expected:
        raise ValidationError("Les sujets ne sont pas à cette étape.")
    if action == "request_review":
        locked.state = "review"
    elif action == "approve":
        locked.state, locked.reviewer, locked.reviewed_at, locked.review_note = "approved", actor, timezone.now(), note
    elif action == "reject":
        locked.state, locked.review_note = "draft", note
    else:
        # Un seul jeu actif par épreuve : le nouveau remplace l’ancien pour les étudiants.
        TaskSet.objects.filter(skill=locked.skill, is_active=True).update(is_active=False)
        locked.state, locked.is_active, locked.published_at = "published", True, timezone.now()
    locked.save()


def all_series():
    return SeriesImport.objects.select_related("task_set", "exam")
