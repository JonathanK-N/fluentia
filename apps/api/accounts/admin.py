"""Attribution manuelle du Premium tant que le paiement en ligne n’est pas branché."""

from django.contrib import admin
from django.contrib.admin.forms import AdminAuthenticationForm

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
