"""Paiement des formules Premium avec Stripe Checkout : carte de crédit, en dollars américains.

1. L’étudiant choisit une formule : le serveur ouvre une page de paiement Stripe (CheckoutView).
2. Stripe confirme le paiement au webhook (WebhookView) ; au retour sur le site, la page vérifie aussi la séance
   (CheckoutStatusView), au cas où le webhook arriverait après. Les deux passent par `activate`, qui ne compte
   chaque paiement qu’une fois.
3. Le Premium démarre aussitôt, ou prolonge celui en cours ; la formule achetée donne ses essais d’oral.

Aucun numéro de carte ne passe par Fluentia : tout est saisi sur la page de Stripe.
Les moyens de paiement proposés (cartes de crédit) se choisissent dans le tableau de bord Stripe :
Paramètres → Moyens de paiement ; l’API ne les impose plus.
"""

import hashlib
import hmac
import json
import logging
import time
from datetime import timedelta

import httpx
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from drf_spectacular.utils import OpenApiTypes, extend_schema
from rest_framework import serializers
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Payment, Subscription
from .views import SecureView

logger = logging.getLogger(__name__)
STRIPE_API = "https://api.stripe.com/v1"
CURRENCY = "usd"
# Prix en cents (USD) de chaque formule.
PRICES = {
    Subscription.Plan.TWO_WEEKS: 1299,
    Subscription.Plan.ONE_MONTH: 2299,
    Subscription.Plan.TWO_MONTHS: 3799,
}
NAMES = {
    Subscription.Plan.TWO_WEEKS: "2 semaines",
    Subscription.Plan.ONE_MONTH: "1 mois",
    Subscription.Plan.TWO_MONTHS: "2 mois",
}
SIGNATURE_TOLERANCE = 300  # secondes acceptées entre l’envoi par Stripe et la réception


class PaymentUnavailable(Exception):
    pass


def offers():
    return [{
        "plan": plan, "name": NAMES[plan], "amount": PRICES[plan], "currency": CURRENCY,
        "days": Subscription.DAYS[plan], "speaking_attempts": Subscription.SPEAKING_ATTEMPTS[plan],
    } for plan in PRICES]


def stripe(method, path, data=None):
    if not settings.STRIPE_SECRET_KEY:
        raise PaymentUnavailable("Le paiement en ligne n’est pas encore configuré.")
    try:
        response = httpx.request(method, f"{STRIPE_API}/{path}", data=data, auth=(settings.STRIPE_SECRET_KEY, ""), timeout=20)
    except httpx.HTTPError as error:
        logger.warning("Stripe injoignable : %s", error)
        raise PaymentUnavailable("Le service de paiement ne répond pas. Réessayez dans un instant.")
    if response.status_code >= 400:
        logger.warning("Stripe a refusé la demande (%s) : %s", response.status_code, response.text[:300])
        raise PaymentUnavailable("Le paiement n’a pas pu être préparé. Réessayez dans un instant.")
    return response.json()


def open_checkout(user, plan):
    """Ouvre une page de paiement Stripe pour cette formule et note le paiement en attente."""
    origin = settings.PUBLIC_WEB_ORIGIN
    session = stripe("POST", "checkout/sessions", {
        "mode": "payment",
        "locale": "fr",
        "customer_email": user.email,
        "client_reference_id": str(user.pk),
        "metadata[plan]": plan,
        "metadata[user_id]": str(user.pk),
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": CURRENCY,
        "line_items[0][price_data][unit_amount]": str(PRICES[plan]),
        "line_items[0][price_data][product_data][name]": f"Fluentia Premium · {NAMES[plan]}",
        "line_items[0][price_data][product_data][description]":
            f"{Subscription.DAYS[plan]} jours d’accès Premium et {Subscription.SPEAKING_ATTEMPTS[plan]} essais d’oral avec l’examinateur IA.",
        "success_url": f"{origin}/etudiant/compte?paiement={{CHECKOUT_SESSION_ID}}#abonnement",
        "cancel_url": f"{origin}/etudiant/compte?paiement=annule#abonnement",
    })
    Payment.objects.create(user=user, email=user.email, plan=plan, amount=PRICES[plan], currency=CURRENCY, stripe_session=session["id"])
    return session["url"]


def activate(session):
    """Séance Stripe payée : active ou prolonge le Premium, une seule fois par paiement. Renvoie le paiement."""
    if session.get("payment_status") != "paid":
        return None
    with transaction.atomic():
        payment = Payment.objects.select_for_update().select_related("user").filter(stripe_session=session.get("id")).first()
        if payment is None or payment.status == Payment.Status.PAID:
            return payment
        if session.get("amount_total") != payment.amount or session.get("currency") != payment.currency:
            logger.error("Montant Stripe inattendu pour %s", payment.stripe_session)
            return None
        payment.status, payment.paid_at = Payment.Status.PAID, timezone.now()
        payment.save(update_fields=["status", "paid_at"])
        if payment.user is not None:
            # Pas de get_or_create : sa première sauvegarde démarrerait déjà une formule, comptée deux fois ensuite.
            sub = Subscription.objects.select_for_update().filter(user=payment.user).first() or Subscription(user=payment.user)
            now = timezone.now()
            # Premium encore actif : la nouvelle formule s’ajoute à la fin de l’actuelle ; sinon elle démarre maintenant.
            start = sub.premium_until if sub.premium_until and sub.premium_until > now else now
            sub.plan = payment.plan
            sub.premium_until = start + timedelta(days=Subscription.DAYS[payment.plan])
            sub.save()
    return payment


def verified_event(payload, header):
    """Événement Stripe dont la signature (en-tête Stripe-Signature) correspond au secret du webhook."""
    secret = settings.STRIPE_WEBHOOK_SECRET
    if not secret or not header:
        return None
    parts = [item.split("=", 1) for item in header.split(",") if "=" in item]
    stamp = next((value for key, value in parts if key == "t"), "")
    signatures = [value for key, value in parts if key == "v1"]
    if not stamp.isdigit() or abs(time.time() - int(stamp)) > SIGNATURE_TOLERANCE:
        return None
    expected = hmac.new(secret.encode(), f"{stamp}.".encode() + payload, hashlib.sha256).hexdigest()
    if not any(hmac.compare_digest(expected, signature) for signature in signatures):
        return None
    return json.loads(payload)


class CheckoutSerializer(serializers.Serializer):
    plan = serializers.ChoiceField(choices=list(PRICES))


class OffersView(SecureView):
    permission_classes = [AllowAny]
    throttle_classes = []

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        return Response({"offers": offers(), "available": bool(settings.STRIPE_SECRET_KEY)})


class CheckoutView(SecureView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=CheckoutSerializer, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        body = CheckoutSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        try:
            url = open_checkout(request.user, body.validated_data["plan"])
        except PaymentUnavailable as error:
            return Response({"detail": str(error)}, status=503)
        return Response({"url": url})


class CheckoutStatusView(SecureView):
    """Retour de Stripe : vérifie la séance auprès de Stripe et active le Premium si le webhook n’est pas encore passé."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request, session_id):
        payment = Payment.objects.filter(stripe_session=session_id, user=request.user).first()
        if payment is None:
            return Response({"detail": "Paiement introuvable."}, status=404)
        if payment.status != Payment.Status.PAID:
            try:
                activate(stripe("GET", f"checkout/sessions/{session_id}"))
            except PaymentUnavailable as error:
                return Response({"detail": str(error)}, status=503)
            payment.refresh_from_db()
        return Response({"status": payment.status, "plan": payment.plan})


class WebhookView(SecureView):
    """Notifications signées de Stripe ; seule la confirmation d’un paiement réussi déclenche quelque chose."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []

    @extend_schema(request=None, responses={200: None})
    def post(self, request):
        event = verified_event(request.body, request.headers.get("Stripe-Signature", ""))
        if event is None:
            return Response({"detail": "Signature invalide."}, status=400)
        if event.get("type") in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
            activate(event["data"]["object"])
        return Response({"received": True})
