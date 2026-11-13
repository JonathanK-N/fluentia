"""Abonnement Premium : valable jusqu’à sa date de fin, sans pause ni paiement en ligne.

Chaque formule donne un nombre d’essais d’oral (une tâche 1, 2 ou 3 = un essai) pour toute sa période :
2 semaines → 15, 1 mois → 25, 2 mois → 40. Une séance échouée avant de commencer ne compte pas."""

import math

from django.utils import timezone

from .models import Subscription


def is_premium(user):
    sub = Subscription.objects.filter(user=user).first()
    return bool(sub) and sub.state() == "premium"


def speaking_allowance(user):
    """Essais d’oral de la période Premium en cours : (restants, total), ou None sans Premium actif."""
    sub = Subscription.objects.filter(user=user).first()
    if not sub or sub.state() != "premium":
        return None
    from pedagogy.models import SpeakingSession

    used = (
        SpeakingSession.objects.filter(user=user, started_at__gte=sub.period_started())
        .exclude(status=SpeakingSession.Status.FAILED)
        .count()
    )
    total = sub.speaking_attempts()
    return max(0, total - used), total


def payload(user):
    sub = Subscription.objects.filter(user=user).first()
    now = timezone.now()
    state = sub.state(now) if sub else "free"
    remaining = (sub.premium_until - now).total_seconds() if state == "premium" else 0
    allowance = speaking_allowance(user) if state == "premium" else None
    return {
        "status": state,
        "plan": sub.plan if sub else None,
        "plan_label": sub.get_plan_display() if sub else None,
        "premium_until": sub.premium_until if sub else None,
        "days_remaining": math.ceil(remaining / 86400),
        "speaking_attempts_left": allowance[0] if allowance else None,
        "speaking_attempts": allowance[1] if allowance else None,
    }
