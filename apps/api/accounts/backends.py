"""Connexion par adresse e-mail, y compris dans l’administration Django."""

from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend


class EmailBackend(ModelBackend):
    """Accepte l’adresse e-mail à la place du nom d’utilisateur technique (« student-… »)."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username and "@" in username:
            account = get_user_model().objects.filter(email__iexact=username.strip()).first()
            if account:
                username = account.username
        return super().authenticate(request, username=username, password=password, **kwargs)
