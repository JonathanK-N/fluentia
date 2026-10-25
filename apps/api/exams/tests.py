"""Tests d’autorisation, d’intégrité et de correction des tentatives."""

from datetime import timedelta
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APIClient
from .models import Exam, Question, Choice, Attempt
from accounts.models import StudentProfile


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class ExamEngineTests(TestCase):
    def setUp(self):
        cache.clear()
        User = get_user_model()
        self.user = User.objects.create_user(
            username="testlearner", password="strong-test-password"
        )
        self.other = User.objects.create_user(
            username="otherlearner", password="strong-test-password"
        )
        StudentProfile.objects.create(user=self.user, email_verified_at=timezone.now())
        self.exam = Exam.objects.create(
            slug="demo-original",
            title="Français pratique",
            skill="reading",
            duration_seconds=120,
            is_published=False,
        )
        self.question = Question.objects.create(
            exam=self.exam,
            position=1,
            statement="Quelle heure ?",
            reading_passage="Le musée ferme à 18 h.",
            explanation="L'heure est annoncée.",
            validation_status="validated",
            author=self.user,
            reviewer=self.other,
            reviewed_at=timezone.now(),
        )
        self.correct = Choice.objects.create(
            question=self.question, position=1, label="18 h", is_correct=True
        )
        self.wrong = Choice.objects.create(
            question=self.question, position=2, label="17 h"
        )
        Choice.objects.create(question=self.question, position=3, label="16 h")
        Choice.objects.create(question=self.question, position=4, label="15 h")
        self.exam.is_published = True
        self.exam.save()
        self.client = APIClient()

    def start(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(f"/api/v1/exams/{self.exam.id}/attempts/")
        self.assertEqual(response.status_code, 201)
        return response.data["id"]

    def test_public_catalog_does_not_leak_answers(self):
        r = self.client.get("/api/v1/exams/")
        self.assertEqual(r.status_code, 200)
        self.assertNotIn("is_correct", str(r.data))

    def test_start_requires_login(self):
        r = self.client.post(f"/api/v1/exams/{self.exam.id}/attempts/")
        self.assertIn(r.status_code, [401, 403])

    def test_save_submit_and_no_early_results(self):
        aid = self.start()
        self.assertEqual(
            self.client.get(f"/api/v1/attempts/{aid}/results/").status_code, 409
        )
        self.assertEqual(
            self.client.put(
                f"/api/v1/attempts/{aid}/answers/",
                {
                    "question_id": str(self.question.id),
                    "choice_id": str(self.correct.id),
                },
                format="json",
            ).status_code,
            200,
        )
        result = self.client.post(f"/api/v1/attempts/{aid}/submit/")
        self.assertEqual(result.data["correct_count"], 1)
        self.assertEqual(
            self.client.post(f"/api/v1/attempts/{aid}/submit/").data["correct_count"], 1
        )
        self.assertEqual(
            self.client.put(
                f"/api/v1/attempts/{aid}/answers/",
                {"question_id": str(self.question.id), "choice_id": str(self.wrong.id)},
                format="json",
            ).status_code,
            400,
        )
        self.assertEqual(
            self.client.get(f"/api/v1/attempts/{aid}/results/").status_code, 200
        )

    def test_foreign_attempt_forbidden(self):
        aid = self.start()
        self.client.force_authenticate(user=self.other)
        self.assertEqual(self.client.get(f"/api/v1/attempts/{aid}/").status_code, 404)
        self.assertEqual(
            self.client.post(f"/api/v1/attempts/{aid}/submit/").status_code, 404
        )

    def test_reject_choice_from_another_question(self):
        aid = self.start()
        other_exam = Exam.objects.create(
            slug="autre-examen", title="Autre version", skill="reading"
        )
        second = Question.objects.create(
            exam=other_exam, position=1, statement="Autre question"
        )
        other_choice = Choice.objects.create(
            question=second, position=1, label="Option", is_correct=True
        )
        r = self.client.put(
            f"/api/v1/attempts/{aid}/answers/",
            {"question_id": str(self.question.id), "choice_id": str(other_choice.id)},
            format="json",
        )
        self.assertEqual(r.status_code, 400)

    def test_expired_cannot_submit(self):
        aid = self.start()
        Attempt.objects.filter(pk=aid).update(
            started_at=timezone.now() - timedelta(seconds=121),
            expires_at=timezone.now() - timedelta(seconds=1),
        )
        self.assertEqual(
            self.client.post(f"/api/v1/attempts/{aid}/submit/").status_code, 400
        )
