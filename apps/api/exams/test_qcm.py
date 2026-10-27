"""Recette du QCM pondéré : barème de 699 points et score à la soumission."""

from io import StringIO

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import StudentProfile
from .data import qcm_lecture as qcm
from .management.commands.seed_qcm_lecture import SLUG
from .models import Exam, Question

User = get_user_model()


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class WeightedQcmTests(TestCase):
    def setUp(self):
        cache.clear()
        User.objects.create_user(username="auteur", email="auteur@example.test")
        User.objects.create_user(username="relecteur", email="relecteur@example.test")
        call_command("seed_qcm_lecture", author="auteur@example.test", reviewer="relecteur", publish=True, stdout=StringIO())
        self.exam = Exam.objects.get(slug=SLUG)
        self.user = User.objects.create_user(username="eleve", email="eleve@example.test", password="Orbite!Lecture-7294")
        StudentProfile.objects.create(user=self.user, display_name="Alex", email_verified_at=timezone.now(), verified_email=self.user.email)
        self.client = APIClient(enforce_csrf_checks=True)
        self.client.force_login(self.user)

    def call(self, path, data=None, method="post"):
        csrf = self.client.get("/api/v1/auth/csrf/").data["csrf_token"]
        return getattr(self.client, method)("/api/v1/" + path, data or {}, format="json", HTTP_X_CSRFTOKEN=csrf)

    def test_scale_matches_the_document(self):
        questions = list(self.exam.questions.all())
        self.assertEqual(len(questions), 39)
        self.assertEqual(sum(q.points for q in questions), 699)
        self.assertEqual([(q.position, q.difficulty, q.points) for q in questions if q.position in (1, 5, 11, 20, 30, 39)],
                         [(1, "A1", 3), (5, "A2", 9), (11, "B1", 15), (20, "B2", 21), (30, "C1", 26), (39, "C2", 33)])
        listed = self.client.get("/api/v1/exams/?skill=reading").data["results"]
        self.assertEqual(next(e for e in listed if e["slug"] == SLUG)["total_points"], 699)

    def test_answer_key_matches_the_document(self):
        keys = "CABCBCDBCADBACDABCDBDACBADCBACADBCDBACD"
        for question in Question.objects.filter(exam=self.exam).prefetch_related("choices"):
            right = next(c for c in question.choices.all() if c.is_correct)
            self.assertEqual("ABCD"[right.position - 1], keys[question.position - 1], question.position)

    def test_score_adds_the_points_of_right_answers_only(self):
        attempt = self.call(f"exams/{self.exam.pk}/attempts/").data["id"]
        questions = {q["position"]: q for q in self.client.get(f"/api/v1/attempts/{attempt}/").data["questions"]}
        self.assertEqual(questions[39]["points"], 33)
        picks = {1: "C", 5: "B", 39: "D", 2: "B"}  # trois bonnes réponses (3 + 9 + 33), une erreur
        for position, letter in picks.items():
            choice = questions[position]["choices"]["ABCD".index(letter)]["id"]
            self.call(f"attempts/{attempt}/answers/", {"question_id": questions[position]["id"], "choice_id": choice}, method="put")
        result = self.call(f"attempts/{attempt}/submit/").data
        self.assertEqual((result["score"], result["max_score"], result["correct_count"]), (45, 699, 3))
        details = self.client.get(f"/api/v1/attempts/{attempt}/results/").data["details"]
        self.assertEqual(details[38]["points"], 33)
        self.assertTrue(details[0]["reading_passage"].startswith("Pharmacie du Parc"))

    def test_seed_is_idempotent(self):
        call_command("seed_qcm_lecture", author="auteur", reviewer="relecteur", stdout=StringIO())
        self.assertEqual(Exam.objects.filter(slug=SLUG).count(), 1)
        self.assertEqual(len(qcm.QUESTIONS), 39)
