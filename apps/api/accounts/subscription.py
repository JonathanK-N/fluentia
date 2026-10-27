"""Abonnement Premium : jours restants, pause et reprise, sans paiement en ligne."""

import math
from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import Subscription

MAX_PAUSE_DAYS = 365


def _locked(user):
    Subscription.objects.get_or_create(user=user)
    return Subscription.objects.select_for_update().get(user=user)


def _resume(sub, now):
    sub.premium_until = now + sub.paused_remaining
    sub.paused_at = sub.paused_remaining = sub.resume_on = None
    sub.save()


def current(user):
    """Abonnement à jour : une pause arrivée à échéance reprend automatiquement."""
    with transaction.atomic():
        sub = _locked(user)
        now = timezone.now()
        if sub.paused and sub.resume_on <= timezone.localdate(now):
            _resume(sub, now)
        return sub


def payload(sub):
    now = timezone.now()
    state = sub.state(now)
    if state == "paused":
        remaining = sub.paused_remaining
    elif state == "premium":
        remaining = sub.premium_until - now
    else:
        remaining = timedelta(0)
    return {
        "status": state,
        "premium_until": sub.premium_until if state in ("premium", "expired") else None,
        "days_remaining": math.ceil(remaining.total_seconds() / 86400),
        "resume_on": sub.resume_on,
    }


def pause(user, resume_on):
    with transaction.atomic():
        sub = _locked(user)
        now = timezone.now()
        today = timezone.localdate(now)
        if sub.state(now) != "premium":
            raise ValidationError({"detail": "Seul un abonnement Premium actif peut être suspendu."})
        if not today < resume_on <= today + timedelta(days=MAX_PAUSE_DAYS):
            raise ValidationError({"resume_on": f"Choisissez une date de reprise dans les {MAX_PAUSE_DAYS} prochains jours."})
        sub.paused_remaining = sub.premium_until - now
        sub.paused_at = now
        sub.resume_on = resume_on
        sub.save()
        return sub


def resume(user):
    with transaction.atomic():
        sub = _locked(user)
        if not sub.paused:
            raise ValidationError({"detail": "Cet abonnement n’est pas en pause."})
        _resume(sub, timezone.now())
        return sub
