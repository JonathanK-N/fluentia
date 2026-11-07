"""Envoie le courriel de bienvenue à tous les comptes actifs, ou à des adresses précises."""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from accounts import emails


class Command(BaseCommand):
    help = "Envoie le courriel de bienvenue Fluentia (tous les comptes actifs, ou --email)."

    def add_arguments(self, parser):
        parser.add_argument("--email", action="append", default=[], help="Adresse ciblée (répétable).")
        parser.add_argument("--all", action="store_true", help="Tous les comptes actifs ayant une adresse.")
        parser.add_argument("--dry-run", action="store_true", help="Affiche les destinataires sans rien envoyer.")

    def handle(self, *args, email, all, dry_run, **options):
        if not email and not all:
            raise CommandError("Précisez --all ou au moins une --email.")
        users = get_user_model().objects.filter(is_active=True).exclude(email="").select_related("student_profile")
        if email:
            users = users.filter(email__in=[address.strip().lower() for address in email])
        users = list(users.order_by("pk"))
        if dry_run:
            for user in users:
                self.stdout.write(user.email)
            self.stdout.write(f"{len(users)} destinataire(s), rien n’a été envoyé.")
            return
        sent, failed = emails.send_welcome_to(users)
        self.stdout.write(f"{sent} courriel(s) de bienvenue envoyé(s).")
        for address in failed:
            self.stderr.write(f"Échec : {address}")
