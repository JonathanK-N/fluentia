"""Sessions même origine, CSRF obligatoire y compris avant authentification."""

import hashlib
import secrets
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
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
from . import emails
from . import subscription as premium
from .serializers import (
    AccountSerializer,
    CsrfSerializer,
    LoginSerializer,
    MessageSerializer,
    PasswordForgotSerializer,
    PasswordResetSerializer,
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
        "subscription": premium.payload(user),
        # Accès à l’espace éditorial : même règle que l’API de la banque.
        "editor": user.is_active and user.is_staff and user.has_perm("pedagogy.view_bankitem"),
    }


def verification_mail(user):
    token = EmailVerification.issue(user)
    # L'origine vient de la configuration, jamais de Host ou d'une entrée cliente.
    url = emails.link("/etudiant/verifier#" + urlencode({"token": token}))
    emails.send("verify", user, required=True, url=url)


DEVICE_COOKIE = "fluentia_device"
DEVICE_SALT = "fluentia.known-device"


def known_accounts(request):
    """Comptes déjà connectés depuis ce navigateur (cookie signé, sans donnée personnelle en clair)."""
    value = request.get_signed_cookie(DEVICE_COOKIE, default="", salt=DEVICE_SALT)
    return [item for item in value.split(",") if item.isdigit()][-20:]


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
        returning = user.last_login is not None
        known = known_accounts(request)
        login(request, user)
        response = Response(account(user))
        if str(user.pk) not in known:
            # Alerte seulement pour un compte déjà utilisé ailleurs : pas à la toute première connexion.
            if returning:
                emails.send(
                    "new_device", user, url=emails.link("/etudiant/mot-de-passe"),
                    when=emails.day_and_time(timezone.now()), device=emails.device_label(request.META.get("HTTP_USER_AGENT")),
                )
            response.set_signed_cookie(
                DEVICE_COOKIE, ",".join([*known, str(user.pk)]), salt=DEVICE_SALT, max_age=2 * 365 * 86400,
                httponly=True, secure=settings.SESSION_COOKIE_SECURE, samesite="Lax",
            )
        return response


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
            user = User.objects.get(pk=ticket.user_id)
            transaction.on_commit(lambda: emails.send("welcome", user, url=emails.link("/etudiant")))
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


RESET_SENT = "Si un compte est associé à cette adresse, un lien de réinitialisation vient d’être envoyé."
RESET_INVALID = "Ce lien est invalide ou a expiré. Demandez un nouveau lien de réinitialisation."


class PasswordForgotView(SecureView):
    permission_classes = [AllowAny]

    @extend_schema(request=PasswordForgotSerializer, responses={202: MessageSerializer})
    def post(self, request):
        data = PasswordForgotSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        user = User.objects.filter(email__iexact=data.validated_data["email"].strip(), is_active=True).first()
        if user is not None and user.has_usable_password():
            # Jeton Django : lié au mot de passe actuel et à la dernière connexion, donc à usage unique.
            url = emails.link("/etudiant/mot-de-passe#" + urlencode({
                "uid": urlsafe_base64_encode(force_bytes(user.pk)), "token": default_token_generator.make_token(user),
            }))
            emails.send("password_reset", user, url=url)
        # Même réponse que le compte existe ou non : pas d’énumération des adresses.
        return Response({"detail": RESET_SENT}, status=202)


class PasswordResetView(SecureView):
    permission_classes = [AllowAny]

    @extend_schema(request=PasswordResetSerializer, responses=MessageSerializer)
    def post(self, request):
        data = PasswordResetSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        try:
            pk = force_str(urlsafe_base64_decode(data.validated_data["uid"]))
            user = User.objects.get(pk=pk, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise ValidationError({"detail": RESET_INVALID})
        if not default_token_generator.check_token(user, data.validated_data["token"]):
            raise ValidationError({"detail": RESET_INVALID})
        check_password(data.validated_data["password"], user)
        with transaction.atomic():
            # Le nouveau hachage invalide le lien et les sessions ouvertes ailleurs.
            user.set_password(data.validated_data["password"])
            user.save(update_fields=["password"])
            # Recevoir le lien prouve la possession de l’adresse.
            profile, _ = StudentProfile.objects.get_or_create(user=user)
            if not profile.email_verified_at:
                StudentProfile.objects.filter(pk=profile.pk).update(
                    email_verified_at=timezone.now(), verified_email=user.email.strip().lower()
                )
        emails.send("password_changed", user, url=emails.link("/etudiant/mot-de-passe"), when=emails.day_and_time(timezone.now()))
        return Response({"detail": "Mot de passe modifié. Vous pouvez vous connecter avec le nouveau mot de passe."})
