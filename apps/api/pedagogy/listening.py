from django.utils import timezone
from rest_framework.exceptions import APIException
from .models import ListeningAccess
from .services import audio_asset


def decorate_questions(attempt, rows):
    questions = {str(q.pk): q for q in attempt.exam.questions.all()}
    accesses = {
        str(a.question_id): a
        for a in ListeningAccess.objects.filter(attempt=attempt).select_related(
            "question"
        )
    }
    now = timezone.now()
    last_position = max((a.question.position for a in accesses.values()), default=0)
    previous_finished = all(a.ends_at <= now for a in accesses.values())
    first_remaining = next(
        (str(q.pk) for q in questions.values() if str(q.pk) not in accesses), None
    )
    for row in rows:
        question = questions[str(row["id"])]
        try:
            asset = audio_asset(question)
        except APIException:
            row.update(audio_available=False, audio_state="unavailable")
            continue
        row["audio_available"] = True
        row["audio_ends_at"] = None
        if attempt.exam.mode == "training":
            row["audio_state"] = "training"
            row["transcript"] = asset.transcript
        else:
            access = accesses.get(str(row["id"]))
            state = "locked"
            if access:
                state = (
                    "past"
                    if question.position < last_position
                    else "playing"
                    if access.ends_at > now
                    else "ready"
                )
                row["audio_ends_at"] = access.ends_at.isoformat()
            elif previous_finished and str(row["id"]) == first_remaining:
                state = "available"
            row["audio_state"] = state
            row["reading_passage"] = ""
            if state not in ["ready", "past"]:
                row["image_available"], row["image_text"] = False, ""
                row["statement"] = "Écoutez le document et la question."
                row["choices"] = []
    return rows
