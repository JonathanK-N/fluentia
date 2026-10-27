"""Sessions même origine, CSRF obligatoire y compris avant authentification."""

import hashlib
import secrets
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.core.mail import send_mail
from django.db import IntegrityError, transaction
from django.db.models import F
from django.middleware.csrf import get_token
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView

from .models import EmailVerification, StudentProfile
from . import subscription as premium
from .serializers import (
    AccountSerializer,
    CsrfSerializer,
    LoginSerializer,
    MessageSerializer,
    PauseSerializer,
    ProfileSerializer,
    RegisterSerializer,
    VerifySerializer,
    check_password,
)

User = get_user_model()
GENERIC = (
    "Si cette adresse peut être inscrite, un message de vérification a été préparé."
)


class AuthAnonThrottle(AnonRateThrottle):
    scope = "account_anon"
    rate = getattr(settings, "ACCOUNT_ANON_RATE", "20/hour")


class AuthUserThrottle(UserRateThrottle):
    scope = "account_user"
    rate = "60/hour"


def account(user):
    profile, _ = StudentProfile.objects.get_or_create(user=user)
    return {
        "id": user.pk,
        "email": user.email,
        "display_name": profile.display_name,
        "email_verified": bool(
            profile.email_verified_at
            and user.email
            and profile.verified_email.lower() == user.email.strip().lower()
        ),
        "preferences": {
            "live_correction": profile.live_correction,
            "answer_sound": profile.answer_sound,
        },
        "subscription": premium.payload(premium.current(user)),
    }


def verification_mail(user):
    token = EmailVerification.issue(user)
    # L'origine vient de la configuration, jamais de Host ou d'une entrée cliente.
    url = (
        settings.PUBLIC_WEB_ORIGIN + "/etudiant/verifier#" + urlencode({"token": token})
    )
    send_mail(
        "Vérifiez votre adresse Fluentia",
        "Pour confirmer votre adresse sous 24 heures, ouvrez ce lien :\n" + url,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )


@method_decorator([never_cache, csrf_protect], name="dispatch")
class SecureView(APIView):
    throttle_classes = [AuthAnonThrottle, AuthUserThrottle]


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(SecureView):
    permission_classes = [AllowAny]
    throttle_classes = []

    @extend_schema(responses=CsrfSerializer)
    def get(self, request):
        return Response({"csrf_token": get_token(request)})


class RegisterView(SecureView):
    permission_classes = [AllowAny]

    @extend_schema(request=RegisterSerializer, responses={202: MessageSerializer})
    def post(self, request):
        data = RegisterSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        email = data.validated_data["email"].strip().lower()
        # Identifiant indépendant du courriel ; conservation du modèle auth actuel.
        user = User(username="student-" + secrets.token_hex(16), email=email)
        check_password(data.validated_data["password"], user)
        try:
            with transaction.atomic():
                if User.objects.filter(email__iexact=email).exists():
                    return Response({"detail": GENERIC}, status=202)
                user.set_password(data.validated_data["password"])
                user.save()
                StudentProfile.objects.create(
                    user=user, display_name=data.validated_data["display_name"]
                )
                verification_mail(user)
        except IntegrityError:
            # La contrainte fonctionnelle protège aussi deux inscriptions simultanées.
            return Response({"detail": GENERIC}, status=202)
        return Response({"detail": GENERIC}, status=status.HTTP_202_ACCEPTED)


class LoginView(SecureView):
    permission_classes = [AllowAny]

    @extend_schema(request=LoginSerializer, responses=AccountSerializer)
    def post(self, request):
        data = LoginSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        candidate = User.objects.filter(
            email__iexact=data.validated_data["email"].strip()
        ).first()
        user = authenticate(
            request,
            username=candidate.username
            if candidate
            else "missing-" + secrets.token_hex(16),
            password=data.validated_data["password"],
        )
        if user is None:
            raise ValidationError({"detail": "Adresse ou mot de passe incorrect."})
        login(request, user)
        return Response(account(user))


class LogoutView(SecureView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, responses=MessageSerializer)
    def post(self, request):
        logout(request)
        return Response({"detail": "Session fermée."})


class ProfileView(SecureView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=AccountSerializer)
    def get(self, request):
        return Response(account(request.user))

    @extend_schema(request=ProfileSerializer, responses=AccountSerializer)
    def patch(self, request):
        data = ProfileSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        profile, _ = StudentProfile.objects.get_or_create(user=request.user)
        for field, value in data.validated_data.items():
            setattr(profile, field, value)
        profile.save(update_fields=list(data.validated_data))
        return Response(account(request.user))


class PauseSubscriptionView(SecureView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=PauseSerializer, responses=AccountSerializer)
    def post(self, request):
        data = PauseSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        premium.pause(request.user, data.validated_data["resume_on"])
        return Response(account(request.user))


class ResumeSubscriptionView(SecureView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, responses=AccountSerializer)
    def post(self, request):
        premium.resume(request.user)
        return Response(account(request.user))


class VerifyView(SecureView):
    permission_classes = [AllowAny]

    @extend_schema(request=VerifySerializer, responses=MessageSerializer)
    def post(self, request):
        data = VerifySerializer(data=request.data)
        data.is_valid(raise_exception=True)
        digest = hashlib.sha256(data.validated_data["token"].encode()).hexdigest()
        with transaction.atomic():
            # Première opération = écriture : sérialisation SQLite et PostgreSQL.
            tickets = EmailVerification.objects.filter(
                digest=digest, expires_at__gt=timezone.now()
            )
            if tickets.update(digest=F("digest")) != 1:
                raise ValidationError({"detail": "Lien invalide ou expiré."})
            ticket = tickets.get()
            if (
                not ticket.email
                or not User.objects.filter(
                    pk=ticket.user_id, email__iexact=ticket.email
                ).exists()
            ):
                raise ValidationError({"detail": "Lien invalide ou expiré."})
            deleted, _ = EmailVerification.objects.filter(
                pk=ticket.pk, digest=digest, expires_at__gt=timezone.now()
            ).delete()
            if not deleted:
                raise ValidationError({"detail": "Lien invalide ou expiré."})
            StudentProfile.objects.filter(user_id=ticket.user_id).update(
                email_verified_at=timezone.now(), verified_email=ticket.email
            )
        return Response({"detail": "Adresse vérifiée. Vous pouvez vous connecter."})


class ResendView(SecureView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, responses=MessageSerializer)
    def post(self, request):
        with transaction.atomic():
            # Verrou du compte pour sérialiser les renouvellements du lien.
            user = User.objects.select_for_update().get(pk=request.user.pk)
            profile, _ = StudentProfile.objects.get_or_create(user=user)
            previous = EmailVerification.objects.filter(user=user).first()
            if not account(user)["email_verified"] and (
                previous is None
                or (timezone.now() - previous.created_at).total_seconds() >= 60
            ):
                verification_mail(user)
        return Response({"detail": "Si nécessaire, un nouveau message a été préparé."})
