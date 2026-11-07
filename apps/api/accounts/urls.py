from django.urls import path
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
]
