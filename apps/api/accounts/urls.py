from django.urls import path
from . import billing
from .views import (
    CsrfView,
    RegisterView,
    LoginView,
    LogoutView,
    ProfileView,
    VerifyView,
    ResendView,
    PasswordForgotView,
    PasswordResetView,
    DeleteAccountView,
)

urlpatterns = [
    path("csrf/", CsrfView.as_view()),
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("profile/", ProfileView.as_view()),
    path("verify/", VerifyView.as_view()),
    path("verification/resend/", ResendView.as_view()),
    path("password/forgot/", PasswordForgotView.as_view()),
    path("password/reset/", PasswordResetView.as_view()),
    path("account/delete/", DeleteAccountView.as_view()),
    path("billing/offers/", billing.OffersView.as_view()),
    path("billing/checkout/", billing.CheckoutView.as_view()),
    path("billing/checkout/<str:session_id>/", billing.CheckoutStatusView.as_view()),
    path("billing/webhook/", billing.WebhookView.as_view()),
]
