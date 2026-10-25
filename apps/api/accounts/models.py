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
