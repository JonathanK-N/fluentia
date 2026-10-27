"""Attribution manuelle du Premium tant que le paiement en ligne n’est pas branché."""

from django.contrib import admin

from .models import Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ["user", "premium_until", "resume_on", "updated_at"]
    search_fields = ["user__email"]
    readonly_fields = ["paused_at", "paused_remaining", "resume_on", "updated_at"]
    autocomplete_fields = ["user"]
