from rest_framework.permissions import BasePermission
from .models import StudentProfile


class VerifiedEmail(BasePermission):
    message = "Vérifiez votre adresse e-mail avant de commencer un exercice."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and StudentProfile.objects.filter(
                user=request.user, email_verified_at__isnull=False
            ).exists()
        )
