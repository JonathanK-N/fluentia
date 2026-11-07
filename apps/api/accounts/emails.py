"""Courriels transactionnels de Fluentia : une structure commune, un gabarit par situation.

Chaque courriel part en deux versions, HTML et texte brut, rendues depuis templates/emails/<type>.
Les liens pointent toujours vers PUBLIC_WEB_ORIGIN, jamais vers l’hôte de la requête.
"""

import logging
from zoneinfo import ZoneInfo

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

SUBJECTS = {
    "verify": "Confirmez votre adresse e-mail Fluentia",
    "welcome": "Bienvenue sur Fluentia",
    "password_reset": "Réinitialisez votre mot de passe Fluentia",
    "password_changed": "Votre mot de passe Fluentia a été modifié",
    "new_device": "Nouvelle connexion à votre compte Fluentia",
    "premium_activated": "Votre accès Premium Fluentia est activé",
    "premium_expiring": "Votre accès Premium Fluentia se termine bientôt",
}

MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
LOGO_PATH = "/branding/02_Icons_PWA/icon-192x192.png"


def link(path):
    return settings.PUBLIC_WEB_ORIGIN + path


def local(moment):
    return moment.astimezone(ZoneInfo(settings.EMAIL_TIME_ZONE))


def day(moment):
    """« 6 novembre 2026 », à l’heure de l’étudiant."""
    moment = local(moment)
    return f"{moment.day} {MONTHS[moment.month - 1]} {moment.year}"


def day_and_time(moment):
    """« 6 novembre 2026 à 14 h 05 », à l’heure de l’étudiant."""
    moment = local(moment)
    return f"{day(moment)} à {moment.hour} h {moment.minute:02d}"


def first_name(user):
    profile = getattr(user, "student_profile", None)
    return (getattr(profile, "display_name", "") or "").strip()


def render(kind, user, **context):
    """Objet, texte brut et HTML d’un courriel, sans l’envoyer : sert aussi aux tests et aux aperçus."""
    values = {
        "subject": SUBJECTS[kind],
        "name": first_name(user),
        "email": user.email,
        "site": settings.PUBLIC_WEB_ORIGIN,
        "logo": link(LOGO_PATH),
        "support": settings.SUPPORT_EMAIL,
        **context,
    }
    return SUBJECTS[kind], render_to_string(f"emails/{kind}.txt", values).strip() + "\n", render_to_string(f"emails/{kind}.html", values)


def send(kind, user, *, required=False, **context):
    """Envoie le courriel. Un courriel « requis » (vérification) remonte l’erreur ; une alerte ne bloque jamais le parcours."""
    subject, text, html = render(kind, user, **context)
    message = EmailMultiAlternatives(subject, text, settings.DEFAULT_FROM_EMAIL, [user.email])
    message.attach_alternative(html, "text/html")
    try:
        message.send()
    except Exception:
        if required:
            raise
        logger.warning("Courriel « %s » non envoyé au compte %s", kind, user.pk, exc_info=True)


def device_label(user_agent):
    """Navigateur et système, sans détail identifiant : « Chrome sur Windows »."""
    agent = user_agent or ""
    browser = next((name for token, name in (
        ("Edg/", "Edge"), ("OPR/", "Opera"), ("Firefox/", "Firefox"), ("CriOS/", "Chrome"),
        ("Chrome/", "Chrome"), ("Safari/", "Safari"),
    ) if token in agent), "Navigateur inconnu")
    system = next((name for token, name in (
        ("Windows", "Windows"), ("iPhone", "iPhone"), ("iPad", "iPad"), ("Android", "Android"),
        ("Mac OS X", "macOS"), ("CrOS", "ChromeOS"), ("Linux", "Linux"),
    ) if token in agent), "système inconnu")
    return f"{browser} sur {system}"


def send_welcome_to(users):
    """Courriel de bienvenue à une liste de comptes ; renvoie (envoyés, adresses en échec). Un échec n’arrête pas l’envoi."""
    sent, failed = 0, []
    for user in users:
        if not user.email:
            continue
        try:
            send("welcome", user, required=True, url=link("/etudiant"))
            sent += 1
        except Exception:
            logger.warning("Bienvenue non envoyée au compte %s", user.pk, exc_info=True)
            failed.append(user.email)
    return sent, failed
