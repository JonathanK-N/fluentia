"""Attribution manuelle du Premium tant que le paiement en ligne n’est pas branché."""

from django.contrib import admin, messages
from django.contrib.admin.forms import AdminAuthenticationForm
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin

from . import emails
from .models import Subscription


class EmailLoginForm(AdminAuthenticationForm):
    """Même identifiant que sur le site : l’adresse e-mail."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["username"].label = "Adresse e-mail"


admin.site.login_form = EmailLoginForm


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ["user", "premium_until", "updated_at"]
    search_fields = ["user__email"]
    readonly_fields = ["updated_at"]
    autocomplete_fields = ["user"]


@admin.action(description="Envoyer le courriel de bienvenue")
def send_welcome(modeladmin, request, queryset):
    sent, failed = emails.send_welcome_to(queryset.filter(is_active=True).exclude(email="").select_related("student_profile"))
    modeladmin.message_user(request, f"{sent} courriel(s) de bienvenue envoyé(s).", messages.SUCCESS)
    if failed:
        modeladmin.message_user(request, "Échec pour : " + ", ".join(failed), messages.ERROR)


User = get_user_model()


class FluentiaUserAdmin(UserAdmin):
    actions = [*UserAdmin.actions, send_welcome]


if admin.site.is_registered(User):
    admin.site.unregister(User)
admin.site.register(User, FluentiaUserAdmin)
