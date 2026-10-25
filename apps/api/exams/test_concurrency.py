"""Courses réelles sur connexions PostgreSQL distinctes, sans faux verrou SQLite."""

from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from threading import Barrier, Event
from unittest import skipUnless
from django.contrib.auth import get_user_model
from django.db import (
    connection,
    connections,
    close_old_connections,
    transaction,
    IntegrityError,
)
from django.db.models import F
from django.test import TransactionTestCase, override_settings
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from .models import Attempt, Choice, Exam
from .services import create_attempt, save_answer, submit_attempt
from .test_engine import exam_fixture


@skipUnless(
    connection.vendor == "postgresql",
    "Les verrous concurrents sont vérifiés sur PostgreSQL en CI.",
)
@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class ConcurrentEngineTests(TransactionTestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="lecteur-concurrent")
        self.reviewer = get_user_model().objects.create_user(
            username="relecteur-concurrent"
        )
        self.exam = exam_fixture(self.user, self.reviewer)
        self.question = self.exam.questions.get()
        self.correct = self.question.choices.get(is_correct=True)
        self.wrong = self.question.choices.get(position=2)
        self.attempt = create_attempt(user=self.user, exam=self.exam)

    def call(self, function, *, barrier=None, started=None):
        close_old_connections()
        try:
            if barrier:
                barrier.wait(timeout=10)

            def observe(execute, sql, params, many, context):
                if started and sql.lstrip().upper().startswith("UPDATE"):
                    started.set()
                return execute(sql, params, many, context)

            with connection.execute_wrapper(observe):
                function()
            return "ok"
        except (ValidationError, IntegrityError):
            return "rejected"
        finally:
            connections.close_all()

    def submit(self):
        return submit_attempt(attempt_id=self.attempt.pk, user=self.user)

    def save(self, choice):
        return save_answer(
            attempt_id=self.attempt.pk,
            user=self.user,
            question_id=self.question.pk,
            choice_id=choice.pk,
        )

    def race(self, first, second):
        barrier = Barrier(2)
        with ThreadPoolExecutor(max_workers=2) as pool:
            futures = [
                pool.submit(self.call, fn, barrier=barrier) for fn in [first, second]
            ]
            return [future.result(timeout=30) for future in futures]

    def test_two_submissions_are_idempotent(self):
        self.save(self.correct)
        self.assertEqual(self.race(self.submit, self.submit), ["ok", "ok"])
        self.attempt.refresh_from_db()
        self.assertEqual(
            (
                self.attempt.status,
                self.attempt.correct_count,
                self.attempt.question_count,
            ),
            ("submitted", 1, 1),
        )

    def test_save_and_submit_have_one_consistent_serial_order(self):
        outcomes = self.race(lambda: self.save(self.correct), self.submit)
        self.assertEqual(outcomes[1], "ok")
        self.attempt.refresh_from_db()
        self.assertEqual(self.attempt.status, "submitted")
        self.assertEqual(
            self.attempt.correct_count,
            self.attempt.answers.filter(choice__is_correct=True).count(),
        )
        with self.assertRaises(ValidationError):
            self.save(self.wrong)

    def test_two_saves_keep_one_answer(self):
        self.assertEqual(
            self.race(lambda: self.save(self.correct), lambda: self.save(self.wrong)),
            ["ok", "ok"],
        )
        self.assertEqual(self.attempt.answers.count(), 1)

    def test_waiting_submit_checks_deadline_after_lock_acquisition(self):
        now = timezone.now()
        Attempt.objects.filter(pk=self.attempt.pk).update(
            started_at=now - timedelta(minutes=3), expires_at=now + timedelta(minutes=1)
        )
        started = Event()
        with ThreadPoolExecutor(max_workers=1) as pool:
            with transaction.atomic():
                Attempt.objects.filter(pk=self.attempt.pk).update(
                    lock_version=F("lock_version") + 1
                )
                future = pool.submit(self.call, self.submit, started=started)
                self.assertTrue(started.wait(timeout=10))
                self.assertFalse(future.done())
                Attempt.objects.filter(pk=self.attempt.pk).update(
                    expires_at=now - timedelta(seconds=1)
                )
            self.assertEqual(future.result(timeout=30), "rejected")
        self.attempt.refresh_from_db()
        self.assertEqual(self.attempt.status, "expired")
        self.assertIsNone(self.attempt.correct_count)

    def test_publication_serializes_with_choice_mutation(self):
        draft = exam_fixture(self.user, self.reviewer, published=False)
        correct = draft.questions.get().choices.get(is_correct=True)
        started = Event()
        with ThreadPoolExecutor(max_workers=1) as pool:
            with transaction.atomic():
                exam = Exam.objects.select_for_update().get(pk=draft.pk)
                future = pool.submit(
                    self.call,
                    lambda: Choice.objects.filter(pk=correct.pk).update(
                        is_correct=False
                    ),
                    started=started,
                )
                self.assertTrue(started.wait(timeout=10))
                self.assertFalse(future.done())
                exam.is_published = True
                exam.save()
            self.assertEqual(future.result(timeout=30), "rejected")
        correct.refresh_from_db()
        self.assertTrue(correct.is_correct)
