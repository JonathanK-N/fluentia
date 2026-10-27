"""Profil non destructif et preuve de possession du courriel."""

import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class StudentProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_profile",
    )
    display_name = models.CharField(max_length=80, blank=True)
    email_verified_at = models.DateTimeField(null=True, blank=True, editable=False)
    verified_email = models.EmailField(blank=True, editable=False)
    # Réglages d’entraînement : sans effet en simulation, où rien n’est révélé avant la fin.
    live_correction = models.BooleanField(default=True)
    answer_sound = models.BooleanField(default=True)


class Subscription(models.Model):
    """Accès Premium attribué par l’administration, valable jusqu’à sa date de fin."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="subscription"
    )
    premium_until = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Abonnement de {self.user}"

    def state(self, now=None):
        if self.premium_until is None:
            return "free"
        return "premium" if self.premium_until > (now or timezone.now()) else "expired"


class EmailVerification(models.Model):
    email = models.EmailField(default="")
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    digest = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField()

    @classmethod
    def issue(cls, user):
        token = secrets.token_urlsafe(32)
        now = timezone.now()
        cls.objects.update_or_create(
            user=user,
            defaults={
                "digest": hashlib.sha256(token.encode()).hexdigest(),
                "created_at": now,
                "email": user.email.strip().lower(),
                "expires_at": now + timedelta(hours=24),
            },
        )
        return token
