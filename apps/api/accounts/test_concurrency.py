"""Courses de compte sur deux connexions PostgreSQL réelles."""

from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from unittest import skipUnless

from django.contrib.auth import get_user_model
from django.db import connection, connections, close_old_connections, IntegrityError
from django.test import TransactionTestCase, override_settings
from rest_framework.test import APIClient

from .models import EmailVerification, StudentProfile


@skipUnless(
    connection.vendor == "postgresql", "Courses comptes réservées à PostgreSQL."
)
@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class AccountConcurrencyTests(TransactionTestCase):
    def parallel(self, function):
        barrier = Barrier(2)

        def call(index):
            close_old_connections()
            try:
                barrier.wait(timeout=10)
                return function(index)
            finally:
                connections.close_all()

        with ThreadPoolExecutor(max_workers=2) as pool:
            return list(pool.map(call, [0, 1]))

    def test_same_link_cannot_be_consumed_twice(self):
        user = get_user_model().objects.create_user(username="token-course")
        StudentProfile.objects.create(user=user)
        token = EmailVerification.issue(user)
        responses = self.parallel(
            lambda _: (
                APIClient()
                .post("/api/v1/auth/verify/", {"token": token}, format="json")
                .status_code
            )
        )
        self.assertEqual(sorted(responses), [200, 400])
        self.assertEqual(EmailVerification.objects.count(), 0)
        self.assertIsNotNone(StudentProfile.objects.get(user=user).email_verified_at)

    def test_email_case_race_keeps_one_account(self):
        User = get_user_model()

        def create(index):
            try:
                User.objects.create_user(
                    username=f"race-{index}",
                    email=["Race@example.test", "RACE@example.test"][index],
                )
                return "created"
            except IntegrityError:
                return "duplicate"

        self.assertEqual(sorted(self.parallel(create)), ["created", "duplicate"])
        self.assertEqual(User.objects.count(), 1)
