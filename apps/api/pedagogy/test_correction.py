import json
from io import StringIO
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import httpx
import openai

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .correction import coherent, in_band, level, nclc
from .models import ModelAnswer, TaskSubject, WritingCorrection

User = get_user_model()
TEXT = (
    "Bonjour Marie,\n\nD’abord, merci pour ton invitation à la fête de rue. "
    "Je viendrai avec plaisir samedi, mais je arriverai un peu tard car je travaille le matin. "
    "ensuite, je peux apporter un gâteau au chocolat et des boissons pour tout le monde.\n\n"
    "Enfin, dis-moi si tu as besoin d’aide pour installer les tables. À samedi !"
)


class StudentClient(TestCase):
    def setUp(self):
        cache.clear()
        self.student = User.objects.create_user(username="eleve", email="eleve@example.test")
        self.subject = TaskSubject.objects.filter(task_set__skill="writing", task_set__is_active=True).first()

    def client_for(self, user):
        client = APIClient(enforce_csrf_checks=True)
        client.force_login(user)
        client.csrf = client.get("/api/v1/auth/csrf/").data["csrf_token"]
        return client

    def post(self, text=TEXT, subject=None, client=None):
        client = client or self.client_for(self.student)
        return client.post(
            f"/api/v1/tasks/writing/subjects/{(subject or self.subject).pk}/correction/",
            {"text": text}, format="json", HTTP_X_CSRFTOKEN=client.csrf,
        )

    def answer(self, client=None, subject=None):
        client = client or self.client_for(self.student)
        return client.get(f"/api/v1/tasks/writing/subjects/{(subject or self.subject).pk}/model-answer/")

    def stream(self, correction_id, client=None):
        client = client or self.client_for(self.student)
        response = client.post(f"/api/v1/tasks/writing/corrections/{correction_id}/stream/", HTTP_X_CSRFTOKEN=client.csrf)
        if response.status_code != 200:
            return response, []
        return response, [json.loads(line) for line in b"".join(response.streaming_content).decode().splitlines()]

    def correct(self, text=TEXT, subject=None, client=None):
        """Demande puis lecture complète du flux : renvoie le statut et la correction finale, ou l’erreur."""
        client = client or self.client_for(self.student)
        created = self.post(text, subject, client)
        if created.status_code != 201:
            return SimpleNamespace(status_code=created.status_code, data=created.data, events=[])
        _, events = self.stream(created.data["id"], client)
        last = events[-1]
        if "error" in last:
            return SimpleNamespace(status_code=last["status"], data={"detail": last["error"]}, events=events)
        return SimpleNamespace(status_code=200, data={**last["result"], "id": created.data["id"], "remaining": last["remaining"]}, events=events)


class WritingCorrectionTests(StudentClient):
    def test_subjects_carry_their_id(self):
        tasks = APIClient().get("/api/v1/tasks/writing/").data["tasks"]
        first = TaskSubject.objects.filter(task_set__is_active=True, task_set__skill="writing", task_number=1).order_by("position").first()
        self.assertEqual(tasks[0]["subjects"][0]["id"], first.pk)

    def test_demo_correction_follows_the_common_format(self):
        response = self.correct()
        self.assertEqual(response.status_code, 200, response.data)
        data = response.data
        self.assertTrue(data["demo"])
        self.assertEqual([c["id"] for c in data["criteria"]], ["consigne", "organisation", "lexique", "grammaire"])
        self.assertEqual(data["level"], level(data["score"]))
        self.assertIn({"original": "ensuite", "correction": "Ensuite", "explanation": "Une phrase commence par une majuscule."}, data["errors"])
        self.assertIn("d’abord", data["criteria"][1]["comment"])
        self.assertIn("le matin. Ensuite, je peux", data["improved"])
        self.assertTrue(data["improved"].startswith("Bonjour Marie,\n\n"))
        self.assertEqual(data["remaining"], 9)
        self.assertIn("NCLC 7", data["goal"])
        self.assertEqual(data["id"], WritingCorrection.objects.get().pk)
        saved = WritingCorrection.objects.get()
        self.assertEqual((saved.user, saved.subject, saved.provider), (self.student, self.subject, "demo"))

    def test_needs_an_account_and_a_real_text(self):
        anonymous = APIClient().post(f"/api/v1/tasks/writing/subjects/{self.subject.pk}/correction/", {"text": TEXT}, format="json")
        self.assertIn(anonymous.status_code, (401, 403))
        short = self.post("Bonjour, je viendrai samedi.")
        self.assertEqual(short.status_code, 400)
        self.assertIn("au moins 20 mots", short.data["text"][0])
        self.assertFalse(WritingCorrection.objects.exists())

    def test_only_active_writing_subjects_can_be_corrected(self):
        speaking = TaskSubject.objects.filter(task_set__skill="speaking").first()
        self.assertEqual(self.post(subject=speaking).status_code, 404)

    @override_settings(WRITING_CORRECTION_DAILY_LIMIT=2)
    def test_daily_limit_is_counted_per_student(self):
        client = self.client_for(self.student)
        self.assertEqual([self.post(client=client).status_code for _ in range(3)], [201, 201, 429])
        self.assertIn("2 corrections", self.post(client=client).data["detail"])
        other = User.objects.create_user(username="autre", email="autre@example.test")
        self.assertEqual(self.post(client=self.client_for(other)).status_code, 201)

    @override_settings(WRITING_CORRECTOR="inconnu")
    def test_unconfigured_provider_is_reported(self):
        response = self.post()
        self.assertEqual(response.status_code, 503)
        self.assertFalse(WritingCorrection.objects.exists())

    def test_malformed_provider_answer_is_never_shown(self):
        with patch.dict("pedagogy.correction.PROVIDERS", {"demo": {"correct": lambda subject, text: iter([{"score": 40}])}}):
            response = self.correct()
        self.assertEqual(response.status_code, 502)
        self.assertFalse(WritingCorrection.objects.exists())

    def test_model_answer_is_written_once_and_shared(self):
        calls = []

        def provider(subject):
            calls.append(subject.pk)
            return {"demo": False, "text": "Bonjour à tous, je vous invite samedi."}

        with patch.dict("pedagogy.correction.PROVIDERS", {"demo": {"answer": provider}}):
            first = self.answer()
            other = User.objects.create_user(username="autre", email="autre@example.test")
            second = self.answer(client=self.client_for(other))
        self.assertEqual(first.status_code, 200, first.data)
        self.assertEqual(first.data, second.data)
        self.assertEqual((first.data["text"], first.data["words"]), ("Bonjour à tous, je vous invite samedi.", 7))
        self.assertEqual(calls, [self.subject.pk])
        self.assertEqual(ModelAnswer.objects.get().provider, "demo")

    def test_demo_model_answer_needs_an_account(self):
        self.assertIn(APIClient().get(f"/api/v1/tasks/writing/subjects/{self.subject.pk}/model-answer/").status_code, (401, 403))
        response = self.answer()
        self.assertTrue(response.data["demo"])
        self.assertTrue(response.data["text"].startswith("Bonjour à tous"))


OPENAI_CORRECTION = {
    "off_topic": False,
    "off_topic_reason": "",
    "levels": [{"id": "grammaire", "level": "A2"}, {"id": "consigne", "level": "B2"}, {"id": "lexique", "level": "B1"}, {"id": "organisation", "level": "B2"}],
    "level": "B1",
    "score": 8,
    "goal": "Relisez les conjugaisons pour gagner les points qui manquent.",
    "summary": "Message clair et poli ; relisez les conjugaisons.",
    "feedback": "Tous les points sont traités, avec de bons connecteurs comme « d’abord, ensuite ». Le vocabulaire est simple mais juste ; relisez les conjugaisons.",
    "errors": [{"original": "je arriverai", "correction": "j’arriverai", "explanation": "Élision devant une voyelle, \"j’\"."}],
    "improved": "Bonjour Marie, j’arriverai un peu tard.",
    "advice": ["Relisez les élisions."],
}


@override_settings(WRITING_CORRECTOR="openai", OPENAI_API_KEY="sk-test", OPENAI_MODEL="modele-test")
class OpenAICorrectionTests(StudentClient):

    def fake(self, payload):
        """Faux OpenAI : la réponse arrive en morceaux de 7 caractères, comme un vrai flux."""
        client = MagicMock()
        client.responses.create.return_value = SimpleNamespace(output_text=json.dumps(payload), status="completed")
        body = json.dumps(payload, ensure_ascii=False)
        events = [SimpleNamespace(type="response.output_text.delta", delta=body[i:i + 7]) for i in range(0, len(body), 7)]
        client.responses.stream.return_value.__enter__.return_value = iter(events)
        return patch("pedagogy.correction.openai.OpenAI", return_value=client), client

    def test_correction_is_asked_with_a_strict_schema_and_reordered(self):
        patcher, client = self.fake(OPENAI_CORRECTION)
        with patcher:
            response = self.correct()
        self.assertEqual(response.status_code, 200, response.data)
        self.assertFalse(response.data["demo"])
        self.assertEqual([c["id"] for c in response.data["criteria"]], ["consigne", "organisation", "lexique", "grammaire"])
        self.assertEqual(response.data["criteria"][0]["label"], "Respect de la consigne")
        self.assertEqual((response.data["score"], response.data["level"]), (8, "B1"))
        call = client.responses.stream.call_args.kwargs
        self.assertEqual(call["model"], "modele-test")
        self.assertFalse(call["store"])
        self.assertEqual(call["reasoning"], {"effort": "low"})
        self.assertEqual(call["text"]["format"]["type"], "json_schema")
        self.assertTrue(call["text"]["format"]["strict"])
        self.assertIn(f"<texte>\n{TEXT}\n</texte>", call["input"])
        self.assertIn(self.subject.prompt, call["input"])
        self.assertEqual(WritingCorrection.objects.get().provider, "openai")
        self.assertIn("« d’abord, ensuite »", response.data["feedback"])
        self.assertNotIn("comment", response.data["criteria"][0])

    def test_score_arrives_before_the_details(self):
        patcher, _ = self.fake(OPENAI_CORRECTION)
        with patcher:
            response = self.correct()
        partials = [event["partial"] for event in response.events if "partial" in event]
        first_scored = next(p for p in partials if "score" in p)
        self.assertEqual((first_scored["score"], first_scored["level"]), (8, "B1"))
        self.assertEqual([c["level"] for c in first_scored["criteria"]], ["B2", "B2", "B1", "A2"])
        self.assertNotIn("errors", first_scored)
        self.assertNotIn("improved", next(p for p in partials if "goal" in p))
        self.assertTrue(response.events[-1]["done"])
        self.assertEqual(WritingCorrection.objects.get().status, "done")

    def test_off_topic_text_is_a1_whatever_its_language(self):
        reason = "La consigne demandait d’inviter vos voisins ; vous écrivez à un ami au sujet de votre installation."
        patcher, _ = self.fake({**OPENAI_CORRECTION, "level": "B2", "off_topic": True, "off_topic_reason": reason})
        with patcher:
            response = self.correct()
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual((response.data["level"], response.data["score"]), ("A1", 3))
        self.assertTrue(response.data["off_topic"])
        self.assertEqual(response.data["off_topic_reason"], reason)
        self.assertEqual([c["level"] for c in response.data["criteria"]], ["B2", "B2", "B1", "A2"])  # le détail reste visible
        page = self.client_for(self.student).get(f"/api/v1/tasks/writing/corrections/{response.data['id']}/")
        self.assertEqual(page.data["nclc"], "3 ou moins")

    def test_score_stays_in_the_official_band_of_the_level(self):
        patcher, _ = self.fake({**OPENAI_CORRECTION, "level": "B1", "score": 17})
        with patcher:
            response = self.correct()
        self.assertEqual((response.data["level"], response.data["score"]), ("B1", 9))

    def test_overall_level_stays_between_the_criteria(self):
        all_c1 = [{"id": key, "level": "C1"} for key in ("consigne", "organisation", "lexique", "grammaire")]
        patcher, _ = self.fake({**OPENAI_CORRECTION, "levels": all_c1, "level": "B2", "score": 13})
        with patcher:
            response = self.correct()
        self.assertEqual((response.data["level"], response.data["score"]), ("C1", 14))

    def test_incomplete_answer_is_refused(self):
        patcher, _ = self.fake({**OPENAI_CORRECTION, "levels": OPENAI_CORRECTION["levels"][:3]})
        with patcher:
            self.assertEqual(self.correct().status_code, 502)
        self.assertFalse(WritingCorrection.objects.exists())

    def test_openai_failure_is_reported_without_counting(self):
        patcher, client = self.fake(OPENAI_CORRECTION)
        client.responses.stream.side_effect = openai.APIConnectionError(request=httpx.Request("POST", "https://api.openai.com"))
        with patcher:
            response = self.correct()
        self.assertEqual(response.status_code, 503)
        self.assertIn("ne répond pas", response.data["detail"])
        self.assertFalse(WritingCorrection.objects.exists())

    @override_settings(OPENAI_API_KEY="")
    def test_missing_key_is_reported(self):
        self.assertEqual(self.post().status_code, 503)
        self.assertFalse(WritingCorrection.objects.exists())

    def test_model_answer_is_written_for_the_subject(self):
        patcher, client = self.fake({"text": "Chers voisins, je vous invite samedi."})
        with patcher:
            response = self.answer()
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual((response.data["demo"], response.data["text"]), (False, "Chers voisins, je vous invite samedi."))
        self.assertIn(self.subject.prompt, client.responses.create.call_args.kwargs["input"])

    def test_students_are_told_who_receives_their_text(self):
        self.assertEqual(APIClient().get("/api/v1/tasks/writing/").data["corrector"], "OpenAI")


class PrepareAnswersTests(TestCase):
    def test_command_writes_each_missing_answer_once(self):
        subjects = TaskSubject.objects.filter(task_set__skill="writing", task_set__is_active=True)
        call_command("preparer_propositions", stdout=StringIO())
        self.assertEqual(ModelAnswer.objects.filter(provider="demo").count(), subjects.count())
        out = StringIO()
        call_command("preparer_propositions", stdout=out)
        self.assertIn("déjà prêtes", out.getvalue())


class CorrectionPageTests(StudentClient):
    def test_official_tcf_bands(self):
        self.assertEqual([level(n) for n in (0, 3, 4, 5, 6, 9, 10, 13, 14, 15, 16, 18, 20)], ["A1", "A1", "A2", "A2", "B1", "B1", "B2", "B2", "C1", "C1", "C2", "C2", "C2"])
        self.assertEqual((in_band("B1", 17), in_band("B2", 4), in_band("C1", 15), in_band("C2", 20)), (9, 10, 15, 18))
        self.assertEqual((coherent("B2", ["C1", "C1"]), coherent("C2", ["B1", "B2"]), coherent("B2", ["B1", "C1"])), ("C1", "B2", "B2"))

    def test_score_is_converted_with_the_ircc_scale(self):
        self.assertEqual([nclc(n) for n in (3, 4, 6, 9, 10, 11, 12, 15, 16, 20)], ["3 ou moins", "4", "5", "6", "7", "7", "8", "9", "10+", "10+"])

    def test_page_shows_the_correction_and_the_following_subject(self):
        client = self.client_for(self.student)
        correction_id = self.correct(client=client).data["id"]
        page = client.get(f"/api/v1/tasks/writing/corrections/{correction_id}/")
        self.assertEqual(page.status_code, 200, page.data)
        self.assertEqual(page.data["text"], TEXT)
        self.assertEqual(page.data["nclc"], nclc(page.data["result"]["score"]))
        self.assertEqual((page.data["nclc_goal"], page.data["remaining"]), (10, 9))
        self.assertEqual(page.data["subject"]["id"], self.subject.pk)
        siblings = list(TaskSubject.objects.filter(task_set=self.subject.task_set).order_by("task_number", "position"))
        following = siblings[siblings.index(self.subject) + 1]
        self.assertEqual(page.data["next"], {"id": following.pk, "title": following.title, "task_number": following.task_number, "task_slug": f"tache-{following.task_number}"})

    def test_last_subject_has_no_following_one(self):
        last = TaskSubject.objects.filter(task_set=self.subject.task_set).order_by("task_number", "position").last()
        client = self.client_for(self.student)
        correction_id = self.correct(subject=last, client=client).data["id"]
        self.assertIsNone(client.get(f"/api/v1/tasks/writing/corrections/{correction_id}/").data["next"])

    def test_only_its_author_can_read_a_correction(self):
        correction_id = self.correct().data["id"]
        other = User.objects.create_user(username="autre", email="autre@example.test")
        self.assertEqual(self.client_for(other).get(f"/api/v1/tasks/writing/corrections/{correction_id}/").status_code, 404)


class CorrectionStreamTests(StudentClient):
    def test_a_correction_is_streamed_only_once(self):
        client = self.client_for(self.student)
        correction_id = self.post(client=client).data["id"]
        self.assertEqual(client.get(f"/api/v1/tasks/writing/corrections/{correction_id}/").data["status"], "pending")
        first, events = self.stream(correction_id, client)
        self.assertEqual(first.status_code, 200)
        self.assertTrue(events[-1]["done"])
        again, _ = self.stream(correction_id, client)
        self.assertEqual(again.status_code, 409)

    def test_failed_correction_is_not_counted(self):
        client = self.client_for(self.student)
        correction_id = self.post(client=client).data["id"]
        with patch.dict("pedagogy.correction.PROVIDERS", {"demo": {"correct": lambda subject, text: iter([{"score": 40}])}}):
            _, events = self.stream(correction_id, client)
        self.assertEqual(events[-1]["status"], 502)
        self.assertFalse(WritingCorrection.objects.exists())

    def test_others_cannot_start_a_correction(self):
        correction_id = self.post().data["id"]
        other = User.objects.create_user(username="autre", email="autre@example.test")
        response, _ = self.stream(correction_id, self.client_for(other))
        self.assertEqual(response.status_code, 404)
