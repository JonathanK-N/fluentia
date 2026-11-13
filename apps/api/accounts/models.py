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

    class Plan(models.TextChoices):
        TWO_WEEKS = "2_semaines", "2 semaines — 15 essais d’oral"
        ONE_MONTH = "1_mois", "1 mois — 25 essais d’oral"
        TWO_MONTHS = "2_mois", "2 mois — 40 essais d’oral"

    # Durée de chaque formule et nombre de tâches d’oral (1, 2 ou 3) qu’elle donne pour toute la période.
    DAYS = {Plan.TWO_WEEKS: 14, Plan.ONE_MONTH: 30, Plan.TWO_MONTHS: 60}
    SPEAKING_ATTEMPTS = {Plan.TWO_WEEKS: 15, Plan.ONE_MONTH: 25, Plan.TWO_MONTHS: 40}

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="subscription"
    )
    plan = models.CharField("formule", max_length=12, choices=Plan.choices, default=Plan.ONE_MONTH)
    premium_until = models.DateTimeField(
        null=True, blank=True,
        help_text="Laisser vide puis enregistrer pour démarrer la formule aujourd’hui (date calculée selon la durée). "
                  "Changer la formule ou repousser la date démarre une nouvelle période : les essais d’oral repartent à zéro. "
                  "Pour retirer le Premium, mettre une date passée.",
    )
    # Début de la période en cours : les essais d’oral sont comptés à partir de cette date.
    period_start = models.DateTimeField("début de la période", null=True, blank=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    # Date de fin pour laquelle le rappel d’expiration a déjà été envoyé : un seul rappel par période.
    reminder_sent_for = models.DateTimeField(null=True, blank=True, editable=False)

    def __str__(self):
        return f"Abonnement de {self.user}"

    def speaking_attempts(self):
        return self.SPEAKING_ATTEMPTS[self.plan]

    def period_started(self):
        """Début de la période en cours ; pour un ancien abonnement sans date, la durée de la formule avant la fin."""
        if self.period_start:
            return self.period_start
        return self.premium_until - timedelta(days=self.DAYS[self.plan]) if self.premium_until else timezone.now()

    def save(self, *args, **kwargs):
        before = Subscription.objects.filter(pk=self.pk).values("premium_until", "plan").first() if self.pk else None
        previous = before["premium_until"] if before else None
        now = timezone.now()
        # Date de fin laissée vide : la formule démarre aujourd’hui (pour retirer le Premium, mettre une date passée).
        if self.premium_until is None:
            self.premium_until = now + timedelta(days=self.DAYS[self.plan])
        # Nouvelle période (activation, renouvellement, autre formule) : les essais repartent à zéro.
        if self.premium_until and self.premium_until > now and (
            before is None or self.premium_until != previous or self.plan != before["plan"]
        ):
            self.period_start = now
        super().save(*args, **kwargs)
        # Activation ou prolongation dans le futur : l’étudiant est prévenu, une fois l’enregistrement validé.
        if self.premium_until and self.premium_until > timezone.now() and self.premium_until != previous:
            from django.db import transaction
            from . import emails

            until, user = self.premium_until, self.user
            transaction.on_commit(lambda: emails.send(
                "premium_activated", user, url=emails.link("/etudiant"), until=emails.day(until),
            ))

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
