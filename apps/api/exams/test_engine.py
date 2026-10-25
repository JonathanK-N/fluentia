"""Recette métier, confidentialité et contraintes du lot 01."""
import uuid
from datetime import timedelta
from io import StringIO
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.exceptions import ValidationError as ModelValidationError
from django.core.management import call_command
from django.db import IntegrityError, transaction
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient
from .models import Exam, Question, Choice, Attempt, Answer
from .services import create_attempt, save_answer, submit_attempt
from .views import StartThrottle


def exam_fixture(author, reviewer, *, published=True, count=1):
    exam = Exam.objects.create(slug="test-" + uuid.uuid4().hex, title="Lecture originale de test", skill="reading", duration_seconds=120)
    for position in range(1, count + 1):
        question = Question.objects.create(exam=exam, position=position, statement="Quand ouvre le musée ?", reading_passage="Le musée ouvre mardi matin.", explanation="Le jour est indiqué dans le texte.", author=author, reviewer=reviewer, reviewed_at=timezone.now(), validation_status="validated")
        for index, label in enumerate(["Mardi matin", "Lundi soir", "Vendredi midi", "Dimanche matin"], 1):
            Choice.objects.create(question=question, position=index, label=label, is_correct=index == 1)
    if published:
        exam.is_published = True
        exam.save()
    return exam


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class EngineAcceptanceTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = get_user_model().objects.create_user(username="apprenant", password="mot-de-passe-test")
        self.other = get_user_model().objects.create_user(username="relecteur", password="mot-de-passe-test")
        self.exam = exam_fixture(self.user, self.other)
        self.question = self.exam.questions.get()
        self.correct = self.question.choices.get(is_correct=True)
        self.wrong = self.question.choices.get(position=2)
        self.attempt = create_attempt(user=self.user, exam=self.exam)
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.base = f"/api/v1/attempts/{self.attempt.pk}/"

    def save(self, choice=None):
        return self.client.put(self.base + "answers/", {"question_id": str(self.question.pk), "choice_id": str((choice or self.correct).pk)}, format="json")

    def expire(self):
        now = timezone.now()
        Attempt.objects.filter(pk=self.attempt.pk).update(started_at=now-timedelta(minutes=3), expires_at=now-timedelta(seconds=1))

    def test_exact_deadline_submit_persists_expiry_without_score(self):
        with patch("exams.services.timezone.now", return_value=self.attempt.expires_at):
            response = self.client.post(self.base + "submit/")
        self.assertEqual(response.status_code, 400)
        self.attempt.refresh_from_db()
        self.assertEqual(self.attempt.status, "expired")
        self.assertIsNone(self.attempt.correct_count)
        self.assertIsNone(self.attempt.submitted_at)
        self.assertEqual(self.client.get(self.base + "results/").status_code, 409)

    def test_save_at_deadline_is_rejected_and_persisted(self):
        with patch("exams.services.timezone.now", return_value=self.attempt.expires_at):
            self.assertEqual(self.save().status_code, 400)
        self.attempt.refresh_from_db()
        self.assertEqual(self.attempt.status, "expired")
        self.assertFalse(self.attempt.answers.exists())

    def test_save_just_before_deadline_is_accepted(self):
        with patch("exams.services.timezone.now", return_value=self.attempt.expires_at-timedelta(microseconds=1)):
            self.assertEqual(self.save().status_code, 200)

    def test_validation_cannot_extend_save_deadline(self):
        before = self.attempt.expires_at-timedelta(microseconds=1)
        with patch("exams.services.timezone.now", side_effect=[before, self.attempt.expires_at]):
            with self.assertRaises(ValidationError):
                save_answer(attempt_id=self.attempt.pk, user=self.user, question_id=self.question.pk, choice_id=self.correct.pk)
        self.attempt.refresh_from_db()
        self.assertEqual(self.attempt.status, "expired")
        self.assertFalse(self.attempt.answers.exists())

    def test_grading_cannot_extend_submit_deadline(self):
        before = self.attempt.expires_at-timedelta(microseconds=1)
        with patch("exams.services.timezone.now", side_effect=[before, before, self.attempt.expires_at, self.attempt.expires_at]):
            with self.assertRaises(ValidationError):
                submit_attempt(attempt_id=self.attempt.pk, user=self.user)
        self.attempt.refresh_from_db()
        self.assertEqual(self.attempt.status, "expired")

    def test_read_refreshes_expiry_and_does_not_expose_questions(self):
        self.expire()
        response = self.client.get(self.base)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "expired")
        self.assertNotIn("questions", response.data)
        self.attempt.refresh_from_db()
        self.assertEqual(self.attempt.status, "expired")

    def test_result_is_stable_when_submit_is_repeated_after_deadline(self):
        self.assertEqual(self.save().status_code, 200)
        first = self.client.post(self.base + "submit/")
        with patch("exams.services.timezone.now", return_value=self.attempt.expires_at+timedelta(days=1)):
            again = self.client.post(self.base + "submit/")
        self.assertEqual(first.data, again.data)
        self.assertEqual(first.data["correct_count"], 1)
        self.assertFalse(first.data["official"])
        self.assertEqual(self.save(self.wrong).status_code, 400)

    def test_unanswered_submission_is_zero_not_an_official_level(self):
        response = self.client.post(self.base + "submit/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["percentage"], 0)
        details = self.client.get(self.base + "results/").data["details"]
        self.assertIsNone(details[0]["selected_choice_id"])
        self.assertEqual(details[0]["correct_choice_id"], str(self.correct.pk))

    def test_resume_returns_only_own_saved_choices_without_solution(self):
        self.save()
        response = self.client.get(self.base)
        self.assertEqual(str(response.data["answers"][0]["choice_id"]), str(self.correct.pk))
        keys = response.data["questions"][0].keys()
        self.assertNotIn("explanation", keys)
        self.assertEqual(set(response.data["questions"][0]["choices"][0]), {"id", "label", "position"})

    def test_every_private_route_isolated_and_missing_ids_are_404(self):
        self.client.force_authenticate(self.other)
        for base in [self.base, f"/api/v1/attempts/{uuid.uuid4()}/"]:
            self.assertEqual(self.client.get(base).status_code, 404)
            self.assertEqual(self.client.get(base + "results/").status_code, 404)
            self.assertEqual(self.client.post(base + "submit/").status_code, 404)
            self.assertEqual(self.client.put(base + "answers/", {"question_id": str(self.question.pk), "choice_id": str(self.correct.pk)}, format="json").status_code, 404)

    def test_anonymous_cannot_read_save_submit_or_get_results(self):
        self.client.force_authenticate(None)
        for suffix, method in [("", "get"), ("results/", "get"), ("answers/", "put"), ("submit/", "post")]:
            self.assertIn(getattr(self.client, method)(self.base + suffix).status_code, [401, 403])

    def test_malformed_and_unknown_fields_are_rejected(self):
        for data in [{"question_id": "invalide", "choice_id": str(self.correct.pk)}, {"question_id": str(self.question.pk)}, {"question_id": str(self.question.pk), "choice_id": str(self.correct.pk), "expires_at": "2099-01-01"}]:
            self.assertEqual(self.client.put(self.base + "answers/", data, format="json").status_code, 400)
        self.assertEqual(self.client.post(f"/api/v1/exams/{self.exam.pk}/attempts/", {"duration_seconds": 9999}, format="json").status_code, 400)

    def test_public_catalogue_hides_drafts_and_all_solutions(self):
        draft = exam_fixture(self.user, self.other, published=False)
        public = APIClient()
        self.assertEqual(public.get(f"/api/v1/exams/{draft.pk}/").status_code, 404)
        self.assertEqual(public.post(f"/api/v1/exams/{draft.pk}/attempts/").status_code, 403)
        response = public.get("/api/v1/exams/?limit=99999")
        self.assertEqual(response.data["count"], 1)
        self.assertFalse(response.data["results"][0]["official"])
        self.assertNotIn("questions", public.get(f"/api/v1/exams/{self.exam.pk}/").data)

    def test_real_session_requires_csrf_for_writes(self):
        client = APIClient(enforce_csrf_checks=True)
        self.assertTrue(client.login(username="apprenant", password="mot-de-passe-test"))
        route = f"/api/v1/exams/{self.exam.pk}/attempts/"
        self.assertEqual(client.post(route).status_code, 403)
        client.get("/admin/login/")
        token = client.cookies["csrftoken"].value
        self.assertEqual(client.post(route, HTTP_X_CSRFTOKEN=token).status_code, 201)

    def test_start_throttle_returns_429(self):
        cache.clear()
        with patch.object(StartThrottle, "rate", "1/minute"):
            route = f"/api/v1/exams/{self.exam.pk}/attempts/"
            self.assertEqual(self.client.post(route).status_code, 201)
            self.assertEqual(self.client.post(route).status_code, 429)

    def test_published_instances_and_raw_updates_are_frozen(self):
        self.question.statement = "Changement interdit"
        with self.assertRaises(ModelValidationError):
            self.question.save()
        for operation in [lambda: Choice.objects.filter(pk=self.correct.pk).update(label="Changement"), lambda: Question.objects.filter(pk=self.question.pk).update(explanation="Changement"), lambda: Exam.objects.filter(pk=self.exam.pk).update(duration_seconds=999)]:
            with self.assertRaises(IntegrityError), transaction.atomic():
                operation()

    def test_withdrawal_does_not_unfreeze_content_or_break_existing_attempt(self):
        self.exam.is_published = False
        self.exam.save()
        self.assertEqual(APIClient().get(f"/api/v1/exams/{self.exam.pk}/").status_code, 404)
        self.assertEqual(self.save().status_code, 200)
        self.assertEqual(self.client.post(self.base + "submit/").status_code, 200)
        with self.assertRaises(IntegrityError), transaction.atomic():
            Choice.objects.filter(pk=self.correct.pk).update(is_correct=False)
        self.exam.is_published = True
        self.exam.save()

    def test_database_rejects_cross_exam_answer(self):
        other_exam = exam_fixture(self.user, self.other)
        question = other_exam.questions.get()
        with self.assertRaises(IntegrityError), transaction.atomic():
            Answer.objects.bulk_create([Answer(attempt=self.attempt, question=question, choice=question.choices.first())])
        with self.assertRaises(IntegrityError), transaction.atomic():
            Answer.objects.bulk_create([Answer(attempt=self.attempt, question=self.question, choice=question.choices.first())])

    def test_publication_cannot_bypass_validation_via_update(self):
        draft = Exam.objects.create(slug="vide", title="Incomplet", skill="reading")
        draft.is_published = True
        with self.assertRaises(ModelValidationError):
            draft.save()
        with self.assertRaises(IntegrityError), transaction.atomic():
            Exam.objects.filter(pk=draft.pk).update(is_published=True, published_at=timezone.now())

    def test_publication_rejects_unreviewed_question_or_non_standard_simulation(self):
        draft = exam_fixture(self.user, self.other, published=False)
        Question.objects.filter(exam=draft).update(validation_status="draft", reviewer=None, reviewed_at=None)
        draft.is_published = True
        with self.assertRaises(ModelValidationError):
            draft.save()
        draft = exam_fixture(self.user, self.other, published=False)
        draft.mode = "simulation"
        draft.is_published = True
        with self.assertRaises(ModelValidationError):
            draft.save()

    def test_database_rejects_second_correct_choice_and_bad_duration(self):
        draft = exam_fixture(self.user, self.other, published=False)
        with self.assertRaises(IntegrityError), transaction.atomic():
            draft.questions.get().choices.filter(position=2).update(is_correct=True)
        with self.assertRaises(IntegrityError), transaction.atomic():
            Exam.objects.bulk_create([Exam(slug="bad", title="Invalide", skill="reading", duration_seconds=0)])

    def test_terminal_constraints_reject_missing_or_late_score(self):
        for changes in [{"status": "submitted"}, {"status": "submitted", "submitted_at": self.attempt.expires_at, "correct_count": 1, "question_count": 1}, {"status": "submitted", "submitted_at": timezone.now(), "correct_count": 1, "question_count": None}]:
            with self.assertRaises(IntegrityError), transaction.atomic():
                Attempt.objects.filter(pk=self.attempt.pk).update(**changes)

    def test_seed_is_idempotent_unpublished_and_does_not_invent_review(self):
        for _ in range(2):
            call_command("seed_original_tcf", stdout=StringIO())
        sample = Exam.objects.get(slug="lecture-originale-demo")
        self.assertFalse(sample.is_published)
        self.assertEqual(sample.questions.count(), 3)
        self.assertFalse(sample.questions.exclude(validation_status="draft", author=None, reviewer=None).exists())

    def test_admin_does_not_allow_editing_attempt_scores(self):
        self.user.is_staff = True
        self.user.is_superuser = True
        self.user.save()
        self.client.force_login(self.user)
        route = f"/admin/exams/attempt/{self.attempt.pk}/change/"
        self.assertEqual(self.client.get(route).status_code, 200)
        self.assertEqual(self.client.post(route, {"correct_count": 999}).status_code, 403)
