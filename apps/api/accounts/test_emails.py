"""Courriels transactionnels : contenu, déclencheurs et parcours « mot de passe oublié »."""

import re
from datetime import datetime, timedelta, timezone as dt_timezone
from unittest.mock import patch
from io import StringIO
from urllib.parse import parse_qs, urlparse

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from . import emails
from .models import StudentProfile, Subscription

User = get_user_model()
PASSWORD = "Mot-de-passe-solide-2026"
NEW_PASSWORD = "Nouveau-mot-de-passe-2026"


@override_settings(PUBLIC_WEB_ORIGIN="https://fluentia.example")
class EmailTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user("awa", "awa@example.test", PASSWORD)
        StudentProfile.objects.create(user=self.user, display_name="Awa")

    def client_with_csrf(self, **headers):
        client = APIClient(enforce_csrf_checks=True, **headers)
        client.csrf = client.get("/api/v1/auth/csrf/").data["csrf_token"]
        return client

    def post(self, client, path, data):
        return client.post(f"/api/v1/auth/{path}", data, format="json", HTTP_X_CSRFTOKEN=client.csrf)

    def link_in(self, message):
        return re.search(r"https://fluentia\.example/\S+", message.body).group(0)


class LayoutTests(EmailTests):
    def test_every_email_has_html_and_text_with_the_same_structure(self):
        for kind in emails.SUBJECTS:
            subject, text, html = emails.render(kind, self.user, url="https://fluentia.example/x", when="6 novembre 2026 à 14 h 05", device="Chrome sur Windows", until="6 décembre 2026", days=3)
            self.assertTrue(subject)
            self.assertIn("Bonjour Awa,", text)
            self.assertIn("Bonjour Awa,", html)
            self.assertIn("L’équipe Fluentia", html)
            self.assertIn("https://fluentia.example/branding/", html)  # logo en adresse absolue
            self.assertIn("awa@example.test", html)
            self.assertNotIn("{%", html + text)

    def test_names_are_escaped_in_html(self):
        self.user.student_profile.display_name = "<b>Awa</b>"
        _, _, html = emails.render("welcome", self.user, url="https://fluentia.example/etudiant")
        self.assertIn("&lt;b&gt;Awa&lt;/b&gt;", html)

    def test_dates_are_in_french_and_local_time(self):
        moment = datetime(2026, 11, 6, 19, 5, tzinfo=dt_timezone.utc)
        self.assertEqual(emails.day_and_time(moment), "6 novembre 2026 à 14 h 05")

    def test_device_label_stays_generic(self):
        agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0 Safari/537.36"
        self.assertEqual(emails.device_label(agent), "Chrome sur Windows")
        self.assertEqual(emails.device_label(""), "Navigateur inconnu sur système inconnu")


class RegistrationEmailTests(EmailTests):
    def test_registration_sends_a_verification_email_with_html(self):
        client = self.client_with_csrf()
        self.post(client, "register/", {"email": "nouveau@example.test", "password": PASSWORD, "display_name": "Lina"})
        message = mail.outbox[-1]
        self.assertEqual(message.subject, "Confirmez votre adresse e-mail Fluentia")
        self.assertEqual(len(message.alternatives), 1)
        self.assertIn("https://fluentia.example/etudiant/verifier#token=", message.body)
        self.assertIn("24 heures", message.alternatives[0][0])

    def test_verification_then_welcome(self):
        client = self.client_with_csrf()
        self.post(client, "register/", {"email": "nouveau@example.test", "password": PASSWORD, "display_name": "Lina"})
        token = parse_qs(urlparse(self.link_in(mail.outbox[-1])).fragment)["token"][0]
        with self.captureOnCommitCallbacks(execute=True):
            response = self.post(client, "verify/", {"token": token})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(mail.outbox[-1].subject, "Bienvenue sur Fluentia")
        self.assertIn("https://fluentia.example/etudiant", mail.outbox[-1].body)


class PasswordResetTests(EmailTests):
    def ask(self, email="awa@example.test"):
        return self.post(self.client_with_csrf(), "password/forgot/", {"email": email})

    def reset_payload(self):
        fragment = urlparse(self.link_in(mail.outbox[-1])).fragment
        values = parse_qs(fragment)
        return {"uid": values["uid"][0], "token": values["token"][0], "password": NEW_PASSWORD}

    def test_unknown_address_gets_the_same_answer_and_no_email(self):
        known, unknown = self.ask(), self.ask("personne@example.test")
        self.assertEqual(known.status_code, 202)
        self.assertEqual(known.data, unknown.data)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "Réinitialisez votre mot de passe Fluentia")
        self.assertIn("60 minutes", mail.outbox[0].body)

    def test_reset_changes_the_password_and_alerts_the_student(self):
        self.ask()
        response = self.post(self.client_with_csrf(), "password/reset/", self.reset_payload())
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(NEW_PASSWORD))
        self.assertEqual(mail.outbox[-1].subject, "Votre mot de passe Fluentia a été modifié")

    def test_link_works_only_once(self):
        self.ask()
        payload = self.reset_payload()
        self.assertEqual(self.post(self.client_with_csrf(), "password/reset/", payload).status_code, 200)
        again = self.post(self.client_with_csrf(), "password/reset/", {**payload, "password": "Encore-un-autre-2026"})
        self.assertEqual(again.status_code, 400)

    def test_link_expires_after_one_hour(self):
        self.ask()
        payload = self.reset_payload()
        later = datetime.now() + timedelta(minutes=61)
        with patch.object(default_token_generator, "_now", return_value=later):
            self.assertEqual(self.post(self.client_with_csrf(), "password/reset/", payload).status_code, 400)

    def test_weak_password_is_refused(self):
        self.ask()
        response = self.post(self.client_with_csrf(), "password/reset/", {**self.reset_payload(), "password": "court"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)

    def test_reset_marks_the_address_as_verified(self):
        self.ask()
        self.post(self.client_with_csrf(), "password/reset/", self.reset_payload())
        self.assertIsNotNone(StudentProfile.objects.get(user=self.user).email_verified_at)


class NewDeviceTests(EmailTests):
    def login(self, client):
        return self.post(client, "login/", {"email": "awa@example.test", "password": PASSWORD})

    def test_first_ever_login_sends_no_alert(self):
        self.login(self.client_with_csrf())
        self.assertEqual(mail.outbox, [])

    def test_login_from_a_new_browser_sends_one_alert(self):
        self.user.last_login = timezone.now() - timedelta(days=3)
        self.user.save(update_fields=["last_login"])
        client = self.client_with_csrf(HTTP_USER_AGENT="Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1")
        self.login(client)
        self.assertEqual(mail.outbox[-1].subject, "Nouvelle connexion à votre compte Fluentia")
        self.assertIn("Safari sur iPhone", mail.outbox[-1].body)
        client.csrf = client.get("/api/v1/auth/csrf/").data["csrf_token"]
        self.login(client)  # même navigateur : cookie reconnu
        self.assertEqual(len(mail.outbox), 1)


class PremiumEmailTests(EmailTests):
    def test_activation_and_extension_are_announced(self):
        with self.captureOnCommitCallbacks(execute=True):
            subscription = Subscription.objects.create(user=self.user, premium_until=timezone.now() + timedelta(days=30))
        self.assertEqual(mail.outbox[-1].subject, "Votre accès Premium Fluentia est activé")
        with self.captureOnCommitCallbacks(execute=True):
            subscription.save()  # aucune nouvelle date : pas de nouveau courriel
        self.assertEqual(len(mail.outbox), 1)

    def test_reminder_is_sent_once_per_period(self):
        Subscription.objects.create(user=self.user, premium_until=timezone.now() + timedelta(days=3))
        mail.outbox.clear()
        call_command("send_premium_reminders", stdout=StringIO())
        call_command("send_premium_reminders", stdout=StringIO())
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "Votre accès Premium Fluentia se termine bientôt")
        self.assertIn("dans 3 jours", mail.outbox[0].body)

    def test_no_reminder_far_from_the_end(self):
        Subscription.objects.create(user=self.user, premium_until=timezone.now() + timedelta(days=20))
        mail.outbox.clear()
        call_command("send_premium_reminders", stdout=StringIO())
        self.assertEqual(mail.outbox, [])


class WelcomeBroadcastTests(EmailTests):
    def setUp(self):
        super().setUp()
        User.objects.create_user("lina", "lina@example.test", PASSWORD)
        User.objects.create_user("inactif", "inactif@example.test", PASSWORD, is_active=False)

    def test_command_sends_to_every_active_account(self):
        out = StringIO()
        call_command("send_welcome", "--all", stdout=out)
        self.assertEqual(sorted(m.to[0] for m in mail.outbox), ["awa@example.test", "lina@example.test"])
        self.assertIn("2 courriel(s)", out.getvalue())

    def test_dry_run_sends_nothing(self):
        out = StringIO()
        call_command("send_welcome", "--all", "--dry-run", stdout=out)
        self.assertEqual(mail.outbox, [])
        self.assertIn("2 destinataire(s)", out.getvalue())

    def test_one_address_only(self):
        call_command("send_welcome", "--email", "LINA@example.test", stdout=StringIO())
        self.assertEqual([m.to[0] for m in mail.outbox], ["lina@example.test"])

    def test_admin_action(self):
        admin = User.objects.create_superuser("chef", "chef@example.test", PASSWORD)
        client = APIClient()
        client.force_login(admin)
        ids = list(User.objects.values_list("pk", flat=True))
        response = client.post("/admin/auth/user/", {"action": "send_welcome", "_selected_action": ids}, follow=True)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(sorted(m.to[0] for m in mail.outbox), ["awa@example.test", "chef@example.test", "lina@example.test"])
