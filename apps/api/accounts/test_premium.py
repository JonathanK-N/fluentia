"""Recette de l’abonnement Premium et des réglages d’entraînement."""

from datetime import timedelta
from types import SimpleNamespace

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from .models import StudentProfile, Subscription
from exams.models import Attempt, Exam
from exams.test_engine import exam_fixture
from exams.views import live_verdict

User = get_user_model()


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class PremiumTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username="premium", email="premium@example.test", password="Orbite!Lecture-7294")
        StudentProfile.objects.create(user=self.user, display_name="Alex", email_verified_at=timezone.now(), verified_email=self.user.email)
        self.client = APIClient(enforce_csrf_checks=True)
        self.client.force_login(self.user)

    def call(self, path, data=None, method="post"):
        csrf = self.client.get("/api/v1/auth/csrf/").data["csrf_token"]
        return getattr(self.client, method)("/api/v1/" + path, data or {}, format="json", HTTP_X_CSRFTOKEN=csrf)

    def grant(self, days):
        Subscription.objects.update_or_create(user=self.user, defaults={"premium_until": timezone.now() + timedelta(days=days, hours=1)})

    def subscription(self):
        return self.client.get("/api/v1/auth/profile/").data["subscription"]

    def test_free_account_has_no_premium(self):
        self.assertEqual(self.subscription(), {"status": "free", "premium_until": None, "days_remaining": 0})

    def test_pause_endpoints_do_not_exist(self):
        self.assertEqual(self.call("auth/subscription/pause/").status_code, 404)
        self.assertEqual(self.call("auth/subscription/resume/").status_code, 404)

    def test_premium_reports_remaining_days(self):
        self.grant(9)
        data = self.subscription()
        self.assertEqual((data["status"], data["days_remaining"]), ("premium", 10))
        self.assertIsNotNone(data["premium_until"])

    def test_expired_premium_is_reported_without_remaining_days(self):
        Subscription.objects.create(user=self.user, premium_until=timezone.now() - timedelta(days=1))
        self.assertEqual(self.subscription()["status"], "expired")
        self.assertEqual(self.subscription()["days_remaining"], 0)

    def test_preferences_are_partial_updates(self):
        response = self.call("auth/profile/", {"answer_sound": False}, method="patch")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["preferences"], {"live_correction": True, "answer_sound": False})
        self.assertEqual(response.data["display_name"], "Alex")
        self.assertEqual(self.call("auth/profile/", {}, method="patch").status_code, 400)

    def test_training_answer_returns_live_verdict_only_when_enabled(self):
        reviewer = User.objects.create_user(username="relecteur", password="Orbite!Lecture-7294")
        exam = exam_fixture(self.user, reviewer)
        attempt = self.call(f"exams/{exam.pk}/attempts/")
        self.assertEqual(attempt.status_code, 201, attempt.data)
        question = exam.questions.get()
        wrong = question.choices.get(is_correct=False, position=2)
        right = question.choices.get(is_correct=True)
        path = f"attempts/{attempt.data['id']}/answers/"
        self.assertIs(self.call(path, {"question_id": str(question.pk), "choice_id": str(wrong.pk)}, "put").data["correct"], False)
        self.assertIs(self.call(path, {"question_id": str(question.pk), "choice_id": str(right.pk)}, "put").data["correct"], True)
        StudentProfile.objects.filter(user=self.user).update(live_correction=False)
        self.assertIsNone(self.call(path, {"question_id": str(question.pk), "choice_id": str(right.pk)}, "put").data["correct"])

    def test_simulation_never_reveals_verdict(self):
        answer = SimpleNamespace(attempt=SimpleNamespace(exam=SimpleNamespace(mode=Exam.Mode.SIMULATION)), choice=SimpleNamespace(is_correct=True))
        self.assertIsNone(live_verdict(answer, self.user))
        self.assertTrue(Attempt.objects.model is Attempt)
