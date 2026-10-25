"""Recette HTTP des comptes : session, CSRF, identité et vérification."""

import hashlib
import re
from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from .models import EmailVerification, StudentProfile
from exams.test_engine import exam_fixture

User = get_user_model()
PASSWORD = "Orbite!Lecture-7294"


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"],
)
class AccountTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient(enforce_csrf_checks=True)
        self.payload = {
            "email": "Etudiant@example.test",
            "password": PASSWORD,
            "display_name": "Alex",
        }

    def request(self, path, data=None, method="post", client=None):
        client = client or self.client
        csrf = client.get("/api/v1/auth/csrf/").data["csrf_token"]
        return getattr(client, method)(
            "/api/v1/auth/" + path + "/",
            data or {},
            format="json",
            HTTP_X_CSRFTOKEN=csrf,
        )

    def register(self):
        self.assertEqual(self.request("register", self.payload).status_code, 202)
        return User.objects.get(email="etudiant@example.test")

    def token(self):
        return re.search(r"token=([\w-]+)", mail.outbox[-1].body).group(1)

    def signin(self):
        return self.request(
            "login", {"email": self.payload["email"], "password": PASSWORD}
        )

    def test_registration_hashes_password_and_never_returns_verification_secret(self):
        user = self.register()
        self.assertTrue(user.check_password(PASSWORD))
        self.assertNotEqual(user.password, PASSWORD)
        self.assertIsNone(user.student_profile.email_verified_at)
        token = self.token()
        self.assertEqual(
            EmailVerification.objects.get(user=user).digest,
            hashlib.sha256(token.encode()).hexdigest(),
        )
        self.assertNotIn(token, str(self.request("register", self.payload).data))
        self.assertEqual(len(mail.outbox), 1)

    def test_csrf_required_even_anonymous_registration_login_verification(self):
        for path in ["register", "login", "verify"]:
            self.assertEqual(
                self.client.post(f"/api/v1/auth/{path}/", self.payload).status_code, 403
            )

    def test_weak_password_rejected_without_account(self):
        for password in ["123456789012", "password", "short"]:
            self.assertEqual(
                self.request(
                    "register", {**self.payload, "password": password}
                ).status_code,
                400,
            )
        self.assertEqual(User.objects.count(), 0)

    def test_case_insensitive_email_unique_database_and_api(self):
        self.register()
        self.assertEqual(
            self.request(
                "register", {**self.payload, "email": "ETUDIANT@example.test"}
            ).status_code,
            202,
        )
        self.assertEqual(User.objects.count(), 1)
        with self.assertRaises(IntegrityError), transaction.atomic():
            User.objects.create_user(
                username="duplicate", email="ETUDIANT@example.test"
            )

    def test_verify_expires_and_is_single_use(self):
        user = self.register()
        token = self.token()
        self.assertEqual(self.request("verify", {"token": token}).status_code, 200)
        self.assertEqual(self.request("verify", {"token": token}).status_code, 400)
        self.assertIsNotNone(StudentProfile.objects.get(user=user).email_verified_at)
        self.assertEqual(EmailVerification.objects.count(), 0)

    def test_expired_and_invalid_links_do_not_verify(self):
        self.register()
        EmailVerification.objects.update(
            expires_at=timezone.now() - timedelta(seconds=1)
        )
        self.assertEqual(
            self.request("verify", {"token": self.token()}).status_code, 400
        )
        self.assertEqual(self.request("verify", {"token": "x" * 43}).status_code, 400)
        self.assertIsNone(StudentProfile.objects.get().email_verified_at)

    def test_session_rotation_profile_and_logout(self):
        self.register()
        session = self.client.session
        session["probe"] = True
        session.save()
        self.client.cookies["sessionid"] = session.session_key
        before = session.session_key
        response = self.signin()
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(before, self.client.cookies["sessionid"].value)
        self.assertTrue(self.client.cookies["sessionid"]["httponly"])
        self.assertEqual(self.client.cookies["sessionid"]["expires"], "")
        self.assertEqual(self.client.cookies["sessionid"]["samesite"], "Lax")
        self.assertEqual(
            self.request(
                "profile", {"display_name": "Alexandra", "is_staff": True}, "patch"
            ).data["display_name"],
            "Alexandra",
        )
        self.assertFalse(User.objects.get().is_staff)
        self.assertEqual(self.request("logout").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/auth/profile/").status_code, 403)

    def test_wrong_and_inactive_credentials_generic(self):
        user = self.register()
        wrong = self.request("login", {"email": user.email, "password": "wrong"})
        absent = self.request(
            "login", {"email": "absent@example.test", "password": "wrong"}
        )
        self.assertEqual(wrong.data, absent.data)
        user.is_active = False
        user.save()
        self.assertEqual(self.signin().status_code, 400)

    def test_unverified_cannot_start_then_verified_can(self):
        user = self.register()
        reviewer = User.objects.create_user(username="reviewer-test-only")
        exam = exam_fixture(user, reviewer)
        self.signin()
        csrf = self.client.get("/api/v1/auth/csrf/").data["csrf_token"]
        url = f"/api/v1/exams/{exam.pk}/attempts/"
        self.assertEqual(
            self.client.post(url, {}, HTTP_X_CSRFTOKEN=csrf).status_code, 403
        )
        self.request("verify", {"token": self.token()})
        self.assertEqual(
            self.client.post(url, {}, HTTP_X_CSRFTOKEN=csrf).status_code, 201
        )

    def test_resend_rotates_with_cooldown(self):
        self.register()
        old = self.token()
        self.signin()
        self.request("verification/resend")
        self.assertEqual(len(mail.outbox), 1)
        EmailVerification.objects.update(
            created_at=timezone.now() - timedelta(seconds=61)
        )
        self.request("verification/resend")
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual(self.request("verify", {"token": old}).status_code, 400)
        self.assertEqual(
            self.request("verify", {"token": self.token()}).status_code, 200
        )

    def test_foreign_profile_never_returned_and_private_attempt_list(self):
        user = self.register()
        other = User.objects.create_user(username="other", email="other@example.test")
        StudentProfile.objects.create(user=other, display_name="Confidentiel")
        self.signin()
        self.assertEqual(
            self.client.get(f"/api/v1/auth/profile/?user={other.pk}").data["id"],
            user.pk,
        )
        self.assertEqual(self.client.get("/api/v1/attempts/").data["count"], 0)
        stranger = APIClient()
        self.assertEqual(stranger.get("/api/v1/attempts/").status_code, 403)

    def test_mail_failure_rolls_back_registration(self):
        with patch(
            "accounts.views.send_mail", side_effect=RuntimeError("mail indisponible")
        ):
            with self.assertRaises(RuntimeError):
                self.register()
        self.assertEqual(User.objects.count(), 0)

    def test_account_responses_not_cached(self):
        self.assertIn(
            "no-store", self.client.get("/api/v1/auth/csrf/")["Cache-Control"]
        )

    def test_foreign_origin_rejected_with_valid_csrf(self):
        csrf = self.client.get("/api/v1/auth/csrf/").data["csrf_token"]
        response = self.client.post(
            "/api/v1/auth/register/",
            self.payload,
            format="json",
            HTTP_X_CSRFTOKEN=csrf,
            HTTP_ORIGIN="https://foreign.example.test",
        )
        self.assertEqual(response.status_code, 403)

    def test_rate_limit_on_anonymous_auth(self):
        from .views import AuthAnonThrottle

        with patch.object(AuthAnonThrottle, "rate", "1/hour"):
            self.assertEqual(
                self.request(
                    "login", {"email": "missing@example.test", "password": PASSWORD}
                ).status_code,
                400,
            )
            self.assertEqual(
                self.request(
                    "login", {"email": "missing@example.test", "password": PASSWORD}
                ).status_code,
                429,
            )
