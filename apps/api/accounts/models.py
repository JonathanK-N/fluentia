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
    """Accès Premium attribué par l’administration ; le paiement en ligne n’est pas branché."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="subscription"
    )
    premium_until = models.DateTimeField(null=True, blank=True)
    paused_at = models.DateTimeField(null=True, blank=True, editable=False)
    paused_remaining = models.DurationField(null=True, blank=True, editable=False)
    resume_on = models.DateField(null=True, blank=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(paused_at__isnull=True, paused_remaining__isnull=True, resume_on__isnull=True)
                    | models.Q(paused_at__isnull=False, paused_remaining__gt=timedelta(0), resume_on__isnull=False)
                ),
                name="subscription_pause_complete",
            )
        ]

    def __str__(self):
        return f"Abonnement de {self.user}"

    @property
    def paused(self):
        return self.paused_at is not None

    def state(self, now=None):
        now = now or timezone.now()
        if self.paused:
            return "paused"
        if self.premium_until is None:
            return "free"
        return "premium" if self.premium_until > now else "expired"


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
