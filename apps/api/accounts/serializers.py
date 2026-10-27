from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(
        write_only=True, max_length=128, trim_whitespace=False
    )
    display_name = serializers.CharField(max_length=80)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(
        write_only=True, max_length=128, trim_whitespace=False
    )


class VerifySerializer(serializers.Serializer):
    token = serializers.RegexField(r"^[A-Za-z0-9_-]{43}$", write_only=True)


class ProfileSerializer(serializers.Serializer):
    display_name = serializers.CharField(max_length=80, required=False)
    live_correction = serializers.BooleanField(required=False)
    answer_sound = serializers.BooleanField(required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError({"detail": "Aucune modification transmise."})
        return attrs


class PreferencesSerializer(serializers.Serializer):
    live_correction = serializers.BooleanField(read_only=True)
    answer_sound = serializers.BooleanField(read_only=True)


class SubscriptionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["free", "premium", "expired"], read_only=True)
    premium_until = serializers.DateTimeField(read_only=True, allow_null=True)
    days_remaining = serializers.IntegerField(read_only=True)


class AccountSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField(read_only=True)
    display_name = serializers.CharField(read_only=True)
    email_verified = serializers.BooleanField(read_only=True)
    preferences = PreferencesSerializer(read_only=True)
    subscription = SubscriptionSerializer(read_only=True)


class MessageSerializer(serializers.Serializer):
    detail = serializers.CharField(read_only=True)


class CsrfSerializer(serializers.Serializer):
    csrf_token = serializers.CharField(read_only=True)


def check_password(password, user):
    try:
        validate_password(password, user=user)
    except DjangoValidationError as exc:
        raise serializers.ValidationError({"password": exc.messages}) from exc
