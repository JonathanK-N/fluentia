"""Abonnement Premium : valable jusqu’à sa date de fin, sans pause ni paiement en ligne."""

import math

from django.utils import timezone

from .models import Subscription


def payload(user):
    sub = Subscription.objects.filter(user=user).first()
    now = timezone.now()
    state = sub.state(now) if sub else "free"
    remaining = (sub.premium_until - now).total_seconds() if state == "premium" else 0
    return {
        "status": state,
        "premium_until": sub.premium_until if sub else None,
        "days_remaining": math.ceil(remaining / 86400),
    }
