"""Rappel avant la fin de l’accès Premium : à lancer une fois par jour (tâche planifiée Railway)."""

import math
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db.models import F, Q
from django.utils import timezone

from accounts import emails
from accounts.models import Subscription


class Command(BaseCommand):
    help = "Envoie un rappel unique aux comptes dont l’accès Premium se termine bientôt."

    def add_arguments(self, parser):
        parser.add_argument("--days", type=int, default=7, help="Rappel envoyé quand il reste au plus ce nombre de jours.")

    def handle(self, *args, days, **options):
        now = timezone.now()
        due = (
            Subscription.objects.select_related("user", "user__student_profile")
            .filter(premium_until__gt=now, premium_until__lte=now + timedelta(days=days), user__is_active=True)
            .filter(Q(reminder_sent_for__isnull=True) | ~Q(reminder_sent_for=F("premium_until")))
        )
        sent = 0
        for subscription in due:
            left = max(1, math.ceil((subscription.premium_until - now).total_seconds() / 86400))
            emails.send(
                "premium_expiring", subscription.user, url=emails.link("/etudiant/compte"),
                until=emails.day(subscription.premium_until), days=left,
            )
            # update() : ne relance pas save(), donc pas de courriel « activé » en retour.
            Subscription.objects.filter(pk=subscription.pk).update(reminder_sent_for=subscription.premium_until)
            sent += 1
        self.stdout.write(f"{sent} rappel(s) envoyé(s).")
