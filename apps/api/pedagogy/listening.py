from rest_framework.exceptions import APIException
from .services import audio_asset


def decorate_questions(attempt, rows):
    """Toutes les questions sont ouvertes : document, image, question et choix dès l’affichage."""
    questions = {str(q.pk): q for q in attempt.exam.questions.all()}
    for row in rows:
        try:
            asset = audio_asset(questions[str(row["id"])])
        except APIException:
            row.update(audio_available=False, audio_state="unavailable")
            continue
        row.update(audio_available=True, audio_state="open", audio_ends_at=None)
        if attempt.exam.mode == "training":
            row["transcript"] = asset.transcript
    return rows
