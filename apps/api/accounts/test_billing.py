"""Paiement Stripe : page de paiement, webhook signé, activation unique et prolongation du Premium."""

import hashlib
import hmac
import json
import time
from datetime import timedelta
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Payment, Subscription

User = get_user_model()
SECRET = "whsec_test_fluentia"


def stripe_reply(data):
    reply = MagicMock(status_code=200)
    reply.json.return_value = data
    return reply


def signed(event, secret=SECRET, stamp=None):
    payload = json.dumps(event).encode()
    stamp = str(stamp or int(time.time()))
    signature = hmac.new(secret.encode(), f"{stamp}.".encode() + payload, hashlib.sha256).hexdigest()
    return payload, f"t={stamp},v1={signature}"


def paid(session_id, amount=2299, currency="usd"):
    return {"id": session_id, "payment_status": "paid", "amount_total": amount, "currency": currency}


@override_settings(STRIPE_SECRET_KEY="sk_test_fluentia", STRIPE_WEBHOOK_SECRET=SECRET, PUBLIC_WEB_ORIGIN="https://fluentia.test")
class BillingTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="acheteur", email="acheteur@example.test", password="Mot-de-passe-solide-42")
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def checkout(self, plan="1_mois", session_id="cs_test_1"):
        with patch("accounts.billing.httpx.request", return_value=stripe_reply({"id": session_id, "url": "https://checkout.stripe.com/c/pay/x"})) as call:
            response = self.client.post("/api/v1/auth/billing/checkout/", {"plan": plan}, format="json")
        return response, call

    def webhook(self, event, **kwargs):
        payload, header = signed(event, **kwargs)
        return APIClient().post("/api/v1/auth/billing/webhook/", payload, content_type="application/json", HTTP_STRIPE_SIGNATURE=header)

    def completed(self, session):
        return {"type": "checkout.session.completed", "data": {"object": session}}

    def test_the_three_plans_are_sold_in_us_dollars(self):
        offers = APIClient().get("/api/v1/auth/billing/offers/").data["offers"]
        self.assertEqual([(o["plan"], o["amount"], o["currency"]) for o in offers],
                         [("2_semaines", 1299, "usd"), ("1_mois", 2299, "usd"), ("2_mois", 3799, "usd")])

    def test_checkout_opens_a_stripe_card_payment_for_the_chosen_plan(self):
        response, call = self.checkout("2_semaines")
        self.assertEqual(response.data["url"], "https://checkout.stripe.com/c/pay/x")
        sent = call.call_args.kwargs["data"]
        self.assertEqual((sent["line_items[0][price_data][unit_amount]"], sent["line_items[0][price_data][currency]"]), ("1299", "usd"))
        self.assertEqual((sent["payment_method_types[0]"], sent["customer_email"]), ("card", "acheteur@example.test"))
        self.assertTrue(sent["success_url"].startswith("https://fluentia.test/etudiant/compte?paiement={CHECKOUT_SESSION_ID}"))
        self.assertEqual(Payment.objects.get().status, Payment.Status.PENDING)

    @override_settings(STRIPE_SECRET_KEY="")
    def test_without_a_stripe_key_the_payment_is_unavailable(self):
        self.assertEqual(self.client.post("/api/v1/auth/billing/checkout/", {"plan": "1_mois"}, format="json").status_code, 503)

    def test_a_signed_payment_activates_premium_once(self):
        self.checkout("1_mois")
        self.assertEqual(self.webhook(self.completed(paid("cs_test_1")), secret="whsec_faux").status_code, 400)
        self.assertEqual(self.webhook(self.completed(paid("cs_test_1")), stamp=int(time.time()) - 3600).status_code, 400)
        self.assertEqual(self.webhook(self.completed(paid("cs_test_1"))).status_code, 200)
        sub = Subscription.objects.get(user=self.user)
        self.assertEqual(sub.plan, "1_mois")
        self.assertAlmostEqual((sub.premium_until - timezone.now()).total_seconds(), 30 * 86400, delta=60)
        first_end = sub.premium_until
        self.webhook(self.completed(paid("cs_test_1")))  # Stripe renvoie parfois deux fois le même événement
        self.assertEqual(Subscription.objects.get(user=self.user).premium_until, first_end)
        self.assertEqual(Payment.objects.get().status, Payment.Status.PAID)

    def test_a_new_plan_is_added_after_the_premium_in_progress(self):
        Subscription.objects.create(user=self.user, plan="1_mois", premium_until=timezone.now() + timedelta(days=10))
        self.checkout("2_semaines", session_id="cs_test_2")
        self.webhook(self.completed(paid("cs_test_2", amount=1299)))
        sub = Subscription.objects.get(user=self.user)
        self.assertEqual(sub.plan, "2_semaines")
        self.assertAlmostEqual((sub.premium_until - timezone.now()).total_seconds(), 24 * 86400, delta=60)

    def test_a_wrong_amount_or_an_unpaid_session_activates_nothing(self):
        self.checkout("2_mois", session_id="cs_test_3")
        self.webhook(self.completed(paid("cs_test_3", amount=100)))
        self.webhook(self.completed({**paid("cs_test_3", amount=3799), "payment_status": "unpaid"}))
        self.assertFalse(Subscription.objects.filter(user=self.user).exists())

    def test_returning_from_stripe_activates_premium_even_before_the_webhook(self):
        self.checkout("1_mois", session_id="cs_test_4")
        with patch("accounts.billing.httpx.request", return_value=stripe_reply(paid("cs_test_4"))):
            response = self.client.get("/api/v1/auth/billing/checkout/cs_test_4/")
        self.assertEqual(response.data["status"], "paid")
        self.assertEqual(Subscription.objects.get(user=self.user).state(), "premium")
        other = User.objects.create_user(username="autre", email="autre@example.test")
        stranger = APIClient()
        stranger.force_authenticate(other)
        self.assertEqual(stranger.get("/api/v1/auth/billing/checkout/cs_test_4/").status_code, 404)
