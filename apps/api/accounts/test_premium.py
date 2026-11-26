"""Recette de l’abonnement Premium et des réglages d’entraînement."""

from datetime import timedelta
from types import SimpleNamespace

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from .models import StudentProfile, Subscription
from exams.models import Exam
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

    def test_editor_flag_follows_bank_access(self):
        self.assertFalse(self.client.get("/api/v1/auth/profile/").data["editor"])
        self.user.is_staff = self.user.is_superuser = True
        self.user.save()
        self.assertTrue(self.client.get("/api/v1/auth/profile/").data["editor"])

    def test_free_account_has_no_premium(self):
        self.assertEqual(self.subscription(), {
            "status": "free", "plan": None, "plan_label": None, "premium_until": None, "days_remaining": 0,
            "speaking_attempts_left": None, "speaking_attempts": None,
        })

    def test_each_plan_starts_today_with_its_length_and_oral_attempts(self):
        for plan, days, attempts in (("2_semaines", 14, 15), ("1_mois", 30, 25), ("2_mois", 60, 40)):
            Subscription.objects.filter(user=self.user).delete()
            Subscription.objects.create(user=self.user, plan=plan)  # date de fin laissée vide
            data = self.subscription()
            self.assertEqual((data["status"], data["days_remaining"], data["speaking_attempts_left"], data["speaking_attempts"]),
                             ("premium", days, attempts, attempts), plan)

    def test_a_renewal_gives_new_oral_attempts(self):
        from pedagogy.models import SpeakingSession
        sub = Subscription.objects.create(user=self.user, plan="2_semaines")
        SpeakingSession.objects.create(user=self.user, provider="demo", seconds=120)
        SpeakingSession.objects.create(user=self.user, provider="demo", seconds=120, status=SpeakingSession.Status.FAILED)
        # Dates nettes : la période a commencé il y a une heure, les séances il y a une minute.
        Subscription.objects.filter(pk=sub.pk).update(period_start=timezone.now() - timedelta(hours=1))
        SpeakingSession.objects.update(started_at=timezone.now() - timedelta(minutes=1))
        sub.refresh_from_db()
        self.assertEqual(self.subscription()["speaking_attempts_left"], 14)  # une séance échouée ne compte pas
        sub.plan = "1_mois"
        sub.premium_until = None
        sub.save()
        self.assertEqual(self.subscription()["speaking_attempts_left"], 25)

    def test_changing_plan_without_touching_the_date_restarts_it_with_its_length(self):
        sub = Subscription.objects.create(user=self.user, plan="2_semaines")
        sub.plan = "2_mois"
        sub.save()  # date de fin inchangée dans le formulaire
        self.assertEqual(self.subscription()["days_remaining"], 60)
        chosen = timezone.now() + timedelta(days=5, hours=1)
        sub.plan, sub.premium_until = "1_mois", chosen
        sub.save()  # date choisie à la main : elle est respectée
        self.assertEqual(self.subscription()["days_remaining"], 6)

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
        missed = self.call(path, {"question_id": str(question.pk), "choice_id": str(wrong.pk)}, "put").data
        self.assertIs(missed["correct"], False)
        self.assertNotIn("correct_choice_id", missed)  # la bonne réponse n’est jamais révélée
        self.assertIs(self.call(path, {"question_id": str(question.pk), "choice_id": str(right.pk)}, "put").data["correct"], True)
        StudentProfile.objects.filter(user=self.user).update(live_correction=False)
        self.assertIsNone(self.call(path, {"question_id": str(question.pk), "choice_id": str(right.pk)}, "put").data["correct"])

    def test_simulation_follows_the_same_setting(self):
        answer = SimpleNamespace(attempt=SimpleNamespace(exam=SimpleNamespace(mode=Exam.Mode.SIMULATION)), choice=SimpleNamespace(is_correct=False))
        self.assertIs(live_verdict(answer, self.user), False)
        StudentProfile.objects.filter(user=self.user).update(live_correction=False)
        self.assertIsNone(live_verdict(answer, self.user))
