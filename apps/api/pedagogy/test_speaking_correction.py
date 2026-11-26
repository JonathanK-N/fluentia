import json
from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.test import override_settings
from django.utils import timezone

from .models import SpeakingSession
from .speaking_correction import CRITERIA, MIN_WORDS, RULES, brief
from .test_speaking import SpeakingClient

LONG = [
    {"role": "examiner", "text": "Bonjour, pouvez-vous vous présenter ?"},
    {"role": "candidate", "text": "Bonjour, je m’appelle Awa, je viens du Sénégal et je vis à Montréal depuis deux ans. "
                                  "Je travaille comme infirmière dans un hôpital et, le week-end, j’aime marcher au bord du fleuve avec mes amis."},
    {"role": "examiner", "text": "Pourquoi apprenez-vous le français ?"},
    {"role": "candidate", "text": "Je veux obtenir la résidence permanente, donc je prépare le TCF pour atteindre le niveau sept."},
]
GRADED = {
    "off_topic": False, "off_topic_reason": "",
    "levels": [{"id": key, "level": "B2"} for key, _ in CRITERIA],
    "level": "B2", "score": 12, "goal": "Variez davantage vos connecteurs.", "summary": "Bonne présentation.",
    "feedback": "Vos réponses sont développées.", "errors": [{"original": "je vis à Montréal depuis deux ans", "correction": "j’habite à Montréal depuis deux ans", "explanation": "plus naturel"}],
    "improved": "Je m’appelle Awa…", "advice": ["Parlez plus longtemps.", "Ajoutez des exemples."],
}


@override_settings(SPEAKING_REQUIRE_PREMIUM=False, WRITING_CORRECTOR="demo")
class SpeakingCorrectionTests(SpeakingClient):
    def finished(self, transcript=LONG, client=None):
        client = client or self.client_for(self.student)
        session_id = self.open(client=client).data["id"]
        self.assertEqual(self.finish(session_id, transcript=transcript, client=client).status_code, 200)
        return session_id, client

    def stream(self, session_id, client):
        response = client.post(f"/api/v1/speaking/sessions/{session_id}/correction/", HTTP_X_CSRFTOKEN=client.csrf)
        if response.status_code != 200:
            return response, []
        return response, [json.loads(line) for line in b"".join(response.streaming_content).decode().splitlines() if line]

    def test_a_finished_task_is_corrected_once_on_its_page(self):
        session_id, client = self.finished()
        page = client.get(f"/api/v1/speaking/sessions/{session_id}/")
        self.assertEqual((page.status_code, page.data["status"], page.data["result"]), (200, "pending", None))
        self.assertIn("infirmière", page.data["text"])
        response, events = self.stream(session_id, client)
        self.assertTrue(events[-1]["done"])
        self.assertEqual([c["id"] for c in events[-1]["result"]["criteria"]], [key for key, _ in CRITERIA])
        page = client.get(f"/api/v1/speaking/sessions/{session_id}/")
        self.assertEqual(page.data["status"], "done")
        self.assertEqual(page.data["nclc"], "4")  # démonstration : une quarantaine de mots → A2 4/20
        self.assertEqual(self.stream(session_id, client)[0].status_code, 409)

    def test_too_little_speech_is_a1_without_calling_the_ai(self):
        session_id, client = self.finished([{"role": "candidate", "text": "Bonjour, oui."}])
        with patch("pedagogy.speaking_correction.openai_grade") as grader:
            _, events = self.stream(session_id, client)
        grader.assert_not_called()
        result = events[-1]["result"]
        self.assertEqual((result["level"], result["score"]), ("A1", 0))

    def test_only_its_author_can_read_or_correct_it(self):
        session_id, _ = self.finished()
        other = self.client_for(self.make_other())
        self.assertEqual(other.get(f"/api/v1/speaking/sessions/{session_id}/").status_code, 404)
        self.assertEqual(self.stream(session_id, other)[0].status_code, 404)

    def test_a_failed_correction_can_be_started_again(self):
        session_id, client = self.finished()
        with patch.dict("pedagogy.speaking_correction.GRADERS", {"demo": lambda *args: iter([{"score": 40}])}):
            _, events = self.stream(session_id, client)
        self.assertEqual(events[-1]["status"], 502)
        self.assertEqual(SpeakingSession.objects.get(pk=session_id).correction_status, "pending")
        self.assertTrue(self.stream(session_id, client)[1][-1]["done"])

    def test_an_interrupted_correction_is_released(self):
        session_id, client = self.finished()
        SpeakingSession.objects.filter(pk=session_id).update(correction_status="running", ended_at=timezone.now() - timedelta(minutes=6))
        self.assertEqual(client.get(f"/api/v1/speaking/sessions/{session_id}/").data["status"], "pending")

    def graded_by_openai(self, graded=GRADED):
        session_id, client = self.finished()
        text = json.dumps(graded)
        events = [SimpleNamespace(type="response.output_text.delta", delta=text[i:i + 7]) for i in range(0, len(text), 7)]
        fake = MagicMock()
        fake.responses.stream.return_value.__enter__.return_value = iter(events)
        with patch("pedagogy.speaking_correction.openai_client", return_value=fake), \
                override_settings(WRITING_CORRECTOR="openai", OPENAI_MODEL="modele-test", OPENAI_API_KEY="sk-test"):
            _, lines = self.stream(session_id, client)
        return session_id, client, lines, fake

    def test_openai_reads_the_transcript_with_the_oral_grid(self):
        session_id, client, lines, fake = self.graded_by_openai()
        self.assertTrue(lines[-1].get("done"), lines[-1])
        result = lines[-1]["result"]
        self.assertEqual((result["level"], result["score"]), ("B2", 12))
        self.assertEqual(client.get(f"/api/v1/speaking/sessions/{session_id}/").data["nclc"], "8")
        self.assertIn("prononciation", result["disclaimer"])
        sent = fake.responses.stream.call_args.kwargs
        self.assertEqual(sent["instructions"], RULES)
        self.assertIn("Candidat : Bonjour, je m’appelle Awa", sent["input"])

    def test_off_topic_is_a1_with_the_lowest_score(self):
        _, _, lines, _ = self.graded_by_openai({**GRADED, "off_topic": True, "off_topic_reason": "Il parle d’autre chose."})
        result = lines[-1]["result"]
        self.assertEqual((result["level"], result["score"]), ("A1", 1))

    def test_the_brief_names_the_task_and_counts_the_words(self):
        session = SpeakingSession(subject=self.task2, transcript=LONG, seconds=210)
        text = brief(self.task2, LONG, 210)
        self.assertIn("Tâche 2, exercice en interaction", text)
        self.assertIn("3 min 30 s", text)
        self.assertGreater(MIN_WORDS, 0)
        self.assertEqual(session.seconds, 210)

    def make_other(self):
        from django.contrib.auth import get_user_model
        return get_user_model().objects.create_user(username="autre", email="autre@example.test")
