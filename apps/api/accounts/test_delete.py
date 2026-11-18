"""Droit à l’effacement : l’étudiant supprime son compte et ses données en confirmant son mot de passe."""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import StudentProfile
from pedagogy.models import WritingCorrection

User = get_user_model()


class DeleteAccountTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="eleve-efface", email="efface@example.test", password="Mot-de-passe-solide-42")
        StudentProfile.objects.create(user=self.user, display_name="Awa")
        WritingCorrection.objects.create(user=self.user, text="Bonjour", provider="demo")
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def delete(self, password):
        return self.client.post("/api/v1/auth/account/delete/", {"password": password}, format="json")

    def test_the_password_is_required_and_everything_goes_with_the_account(self):
        self.assertEqual(self.delete("mauvais").status_code, 400)
        self.assertTrue(User.objects.filter(pk=self.user.pk).exists())
        response = self.delete("Mot-de-passe-solide-42")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(pk=self.user.pk).exists())
        self.assertFalse(StudentProfile.objects.filter(user_id=self.user.pk).exists())
        self.assertFalse(WritingCorrection.objects.filter(user_id=self.user.pk).exists())

    def test_an_editorial_account_is_deleted_from_the_admin_only(self):
        self.user.is_staff = True
        self.user.save()
        self.assertEqual(self.delete("Mot-de-passe-solide-42").status_code, 403)
        self.assertTrue(User.objects.filter(pk=self.user.pk).exists())

    def test_anonymous_visitors_cannot_delete_anything(self):
        self.assertIn(APIClient().post("/api/v1/auth/account/delete/", {"password": "x"}, format="json").status_code, (401, 403))
