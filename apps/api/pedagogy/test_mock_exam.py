"""Examen TCF : les 4 épreuves dans l’ordre, aucune correction avant la fin, puis le bilan."""

from datetime import timedelta

from django.test import override_settings
from django.utils import timezone

from accounts.models import StudentProfile
from exams.models import Attempt, Choice, Exam, Question
from .models import MockExam, MockExamRun, SpeakingSession, TaskSubject, WritingCorrection
from .test_speaking import SpeakingClient

LONG_TEXT = " ".join(["Bonjour à tous, je vous invite samedi soir chez moi pour un repas entre voisins."] * 3)


def qcm(slug, skill, author, reviewer):
    exam = Exam.objects.create(slug=slug, title=f"Série {skill}", skill=skill, mode="training", duration_seconds=600, is_published=False)
    question = Question.objects.create(
        exam=exam, position=1, statement="Quelle heure ?", reading_passage="Le musée ferme à 18 h.", explanation="L’heure est annoncée.",
        validation_status="validated", author=author, reviewer=reviewer, reviewed_at=timezone.now(), points=21,
        **({"source_reference": "Enregistrement de test", "audio_key": "0" * 64} if skill == "listening" else {}),
    )
    right = Choice.objects.create(question=question, position=1, label="18 h", is_correct=True)
    for position, label in ((2, "17 h"), (3, "16 h"), (4, "15 h")):
        Choice.objects.create(question=question, position=position, label=label)
    exam.is_published = True
    exam.save()
    return exam, question, right


@override_settings(SPEAKING_REQUIRE_PREMIUM=False, SPEAKING_DAILY_MINUTES=30, WRITING_CORRECTOR="demo", SPEAKING_PROVIDER="demo")
class MockExamTests(SpeakingClient):
    def setUp(self):
        super().setUp()
        StudentProfile.objects.create(user=self.student, email_verified_at=timezone.now(), verified_email=self.student.email)
        reviewer = type(self.student).objects.create_user(username="relecteur", email="relecteur@example.test")
        self.listening, self.l_question, self.l_right = qcm("examen-ecoute", "listening", self.student, reviewer)
        self.reading, self.r_question, self.r_right = qcm("examen-lecture", "reading", self.student, reviewer)
        writing = TaskSubject.objects.filter(task_set__skill="writing", task_set__is_active=True)
        self.writing = [writing.filter(task_number=n).first() for n in (1, 2, 3)]
        self.exam = MockExam.objects.create(
            title="Examen TCF 1", is_published=True, listening=self.listening, reading=self.reading,
            writing_1=self.writing[0], writing_2=self.writing[1], writing_3=self.writing[2],
            speaking_1=self.task1, speaking_2=self.task2, speaking_3=self.task3,
        )
        self.client = self.client_for(self.student)

    def post(self, path, data=None):
        return self.client.post(f"/api/v1/{path}", data or {}, format="json", HTTP_X_CSRFTOKEN=self.client.csrf)

    def get(self, path):
        return self.client.get(f"/api/v1/{path}")

    def test_the_four_tests_in_order_then_a_bilan_with_every_correction(self):
        listed = self.get("mock-exams/").data
        self.assertEqual([(e["title"], e["run"]) for e in listed], [("Examen TCF 1", None)])
        self.assertEqual([p["key"] for p in listed[0]["parts"]], ["listening", "reading", "writing", "speaking"])

        started = self.post(f"mock-exams/{self.exam.pk}/runs/")
        self.assertEqual(started.status_code, 201)
        run_id = started.data["id"]
        self.assertEqual(self.post(f"mock-exams/{self.exam.pk}/runs/").data["id"], run_id)  # reprise, pas de doublon
        self.assertEqual(self.post(f"mock-exam-runs/{run_id}/qcm/reading/").status_code, 400)  # l’Écoute d’abord

        # 1. Écoute : aucune correction en direct ni de corrigé avant la fin de l’examen.
        attempt = self.post(f"mock-exam-runs/{run_id}/qcm/listening/").data["attempt_id"]
        saved = self.client.put(f"/api/v1/attempts/{attempt}/answers/", {"question_id": str(self.l_question.pk), "choice_id": str(self.l_right.pk)},
                                format="json", HTTP_X_CSRFTOKEN=self.client.csrf)
        self.assertIsNone(saved.data["correct"])
        self.post(f"attempts/{attempt}/submit/")
        self.assertEqual(self.get(f"attempts/{attempt}/results/").status_code, 409)

        # 2. Lecture : chrono écoulé sans envoi, notée avec ses réponses et l’examen continue.
        reading = self.post(f"mock-exam-runs/{run_id}/qcm/reading/").data["attempt_id"]
        self.assertEqual(self.get(f"attempts/{reading}/").data["mock_exam_run"], run_id)
        Attempt.objects.filter(pk=reading).update(started_at=timezone.now() - timedelta(seconds=700), expires_at=timezone.now() - timedelta(seconds=1))
        run = self.get(f"mock-exam-runs/{run_id}/").data
        self.assertEqual([s["status"] for s in run["steps"]], ["done", "done", "todo", "todo"])
        self.assertEqual(run["current"], "writing")
        self.assertEqual(Attempt.objects.get(pk=reading).status, Attempt.Status.SUBMITTED)

        # 3. Rédaction : un chrono pour les trois tâches ; un texte vide ou trop court n’est pas envoyé à l’IA.
        writing = self.post(f"mock-exam-runs/{run_id}/writing/").data
        self.assertEqual((len(writing["tasks"]), writing["minutes"]), (3, 60))
        self.assertIsNotNone(writing["deadline"])
        self.post(f"mock-exam-runs/{run_id}/writing/", {"texts": [LONG_TEXT, "", "Trop court."]})
        corrections = {c.subject_id: c for c in WritingCorrection.objects.filter(run_id=run_id)}
        self.assertEqual(corrections[self.writing[0].pk].status, WritingCorrection.Status.PENDING)
        self.assertEqual(corrections[self.writing[1].pk].result["score"], 0)
        self.assertEqual(self.get(f"tasks/writing/corrections/{corrections[self.writing[0].pk].pk}/").status_code, 409)

        # 4. Oral : la séance est rattachée à l’examen ; une tâche impossible peut être passée.
        self.assertEqual(self.post("speaking/sessions/", {"subject_id": self.task2.pk, "mode": "simulation", "run_id": run_id}).status_code, 403)
        opened = self.post("speaking/sessions/", {"subject_id": self.task1.pk, "mode": "simulation", "run_id": run_id})
        self.assertEqual(opened.status_code, 201, opened.data)
        self.finish(opened.data["id"], client=self.client)
        self.assertEqual(SpeakingSession.objects.get(pk=opened.data["id"]).run_id, run_id)
        self.assertEqual(self.get(f"speaking/sessions/{opened.data['id']}/").status_code, 409)
        self.post(f"mock-exam-runs/{run_id}/speaking/skip/", {"task": 2})
        done = self.post(f"mock-exam-runs/{run_id}/speaking/skip/", {"task": 3}).data
        self.assertIsNotNone(done["finished_at"])

        # Bilan : les corrections en attente sont listées, puis lancées depuis la page du bilan.
        bilan = done["bilan"]
        self.assertEqual(
            {(p["kind"], p["id"]) for p in bilan["pending"]},
            {("writing", corrections[self.writing[0].pk].pk), ("speaking", opened.data["id"])},
        )
        self.assertIsNone(bilan["overall"])
        self.assertEqual(bilan["listening"]["correct"], 1)
        self.assertEqual(self.get(f"attempts/{attempt}/results/").status_code, 200)
        for path in (f"tasks/writing/corrections/{corrections[self.writing[0].pk].pk}/stream/", f"speaking/sessions/{opened.data['id']}/correction/"):
            b"".join(self.post(path).streaming_content)  # la correction s’écrit au fil du flux
        bilan = self.get(f"mock-exam-runs/{run_id}/").data["bilan"]
        self.assertEqual(bilan["pending"], [])
        self.assertIn(bilan["overall"], ["A1", "A2", "B1", "B2", "C1", "C2"])
        self.assertEqual(len(bilan["writing"]["tasks"]), 3)
        self.assertIn("nclc", bilan["speaking"])
        listed = self.get("mock-exams/").data
        self.assertTrue(listed[0]["run"]["finished"])

    def test_an_incomplete_exam_is_neither_published_nor_listed(self):
        from django.core.exceptions import ValidationError
        draft = MockExam(title="Examen TCF 2", is_published=True, listening=self.listening)
        with self.assertRaises(ValidationError):
            draft.full_clean()
        MockExam.objects.create(title="Examen TCF 2", is_published=True, listening=self.listening)
        self.assertEqual([e["title"] for e in self.get("mock-exams/").data], ["Examen TCF 1"])

    def test_a_run_belongs_to_its_student(self):
        run = MockExamRun.objects.create(user=self.student, exam=self.exam)
        other = type(self.student).objects.create_user(username="autre-eleve", email="autre-eleve@example.test")
        self.assertEqual(self.client_for(other).get(f"/api/v1/mock-exam-runs/{run.pk}/").status_code, 404)
