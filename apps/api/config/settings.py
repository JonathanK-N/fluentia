"""Paramètres du backend Fluentia. Auteur : Jonathan Kakesa."""
import os
from decimal import Decimal
from pathlib import Path
import dj_database_url
BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "local-dev-only-change-in-production")
DEBUG = os.getenv("DJANGO_DEBUG", "0") == "1"
ALLOWED_HOSTS = [h.strip() for h in os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if h.strip()]
INSTALLED_APPS = ["django.contrib.admin", "django.contrib.auth", "django.contrib.contenttypes", "django.contrib.sessions", "django.contrib.messages", "django.contrib.staticfiles", "rest_framework", "drf_spectacular", "health", "exams"]
MIDDLEWARE = ["django.middleware.security.SecurityMiddleware", "django.contrib.sessions.middleware.SessionMiddleware", "django.middleware.common.CommonMiddleware", "django.middleware.csrf.CsrfViewMiddleware", "django.contrib.auth.middleware.AuthenticationMiddleware", "django.contrib.messages.middleware.MessageMiddleware", "django.middleware.clickjacking.XFrameOptionsMiddleware"]
ROOT_URLCONF = "config.urls"
TEMPLATES = [{"BACKEND": "django.template.backends.django.DjangoTemplates", "DIRS": [], "APP_DIRS": True, "OPTIONS": {"context_processors": ["django.template.context_processors.debug", "django.template.context_processors.request", "django.contrib.auth.context_processors.auth", "django.contrib.messages.context_processors.messages"]}}]
WSGI_APPLICATION = "config.wsgi.application"
DATABASES = {"default": dj_database_url.parse(os.getenv("DATABASE_URL") or f"sqlite:///{BASE_DIR / 'db.sqlite3'}", conn_max_age=60)}
LANGUAGE_CODE = "fr"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
REST_FRAMEWORK = {"DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"], "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema"}
SPECTACULAR_SETTINGS = {"TITLE": "Fluentia API", "VERSION": "0.1.0", "ENUM_NAME_OVERRIDES": {"SubscriptionStatusEnum": ["free", "premium", "expired"], "AttemptStatusEnum": "exams.models.Attempt.Status", "ExamSkillEnum": "exams.models.Exam.Skill", "SeriesSkillEnum": ["reading", "listening", "writing", "speaking"], "SeriesStatusEnum": ["draft", "review", "approved", "published"], "ExamModeEnum": "exams.models.Exam.Mode", "SpeakingModeEnum": ["practice", "simulation"]}}
INSTALLED_APPS += ["accounts"]
INSTALLED_APPS += ["pedagogy"]
PRIVATE_MEDIA_ROOT = Path(os.getenv("PRIVATE_MEDIA_ROOT", str(BASE_DIR / ".private-media")))
ACCOUNT_ANON_RATE = os.getenv("ACCOUNT_ANON_RATE", "20/hour")
# Correction des textes de Rédaction : « demo » ne sort jamais du serveur ; le vrai fournisseur se branche dans pedagogy/correction.py.
WRITING_CORRECTOR = os.getenv("WRITING_CORRECTOR", "demo")
WRITING_CORRECTION_DAILY_LIMIT = int(os.getenv("WRITING_CORRECTION_DAILY_LIMIT", "10"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "")
OPENAI_REASONING_EFFORT = os.getenv("OPENAI_REASONING_EFFORT", "low")
# Oral avec examinateur IA : « demo » ne contacte rien ; « openai » ouvre une session Realtime par clé éphémère.
SPEAKING_PROVIDER = os.getenv("SPEAKING_PROVIDER", "demo")
SPEAKING_DAILY_MINUTES = int(os.getenv("SPEAKING_DAILY_MINUTES", "15"))
# Plafond de dépense de l’oral pour tout le site, en dollars sur 24 h glissantes ; 0 = pas de plafond.
SPEAKING_DAILY_BUDGET_USD = Decimal(os.getenv("SPEAKING_DAILY_BUDGET_USD", "0"))
# 1 : Premium requis (sauf une tâche 1 offerte). 0 : oral ouvert à tous les comptes connectés, quota compris.
SPEAKING_REQUIRE_PREMIUM = os.getenv("SPEAKING_REQUIRE_PREMIUM", "1") == "1"
OPENAI_REALTIME_MODEL = os.getenv("OPENAI_REALTIME_MODEL", "gpt-realtime-2.1-mini")
OPENAI_REALTIME_VOICE = os.getenv("OPENAI_REALTIME_VOICE", "marin")
OPENAI_REALTIME_TRANSCRIPTION_MODEL = os.getenv("OPENAI_REALTIME_TRANSCRIPTION_MODEL", "gpt-live-transcribe")
AUTHENTICATION_BACKENDS = ["accounts.backends.EmailBackend"]
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 12}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
PUBLIC_WEB_ORIGIN = os.getenv("PUBLIC_WEB_ORIGIN", "http://127.0.0.1:3000").rstrip("/")
CSRF_TRUSTED_ORIGINS = [PUBLIC_WEB_ORIGIN]
# Aucun envoi externe par défaut ; adaptateur mémoire de développement.
EMAIL_BACKEND = os.getenv("DJANGO_EMAIL_BACKEND", "django.core.mail.backends.locmem.EmailBackend")
EMAIL_FILE_PATH = os.getenv("DJANGO_EMAIL_FILE_PATH", str(BASE_DIR / ".local-mail"))
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "Fluentia <no-reply@localhost>")
# Adresse de contact affichée dans les courriels, et fuseau des dates qui y figurent.
SUPPORT_EMAIL = os.getenv("SUPPORT_EMAIL", "contact@cognito-inc.ca")
EMAIL_TIME_ZONE = os.getenv("EMAIL_TIME_ZONE", "America/Toronto")
# Lien de réinitialisation du mot de passe : 60 minutes, à usage unique.
PASSWORD_RESET_TIMEOUT = 3600
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = 43200
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SECURE_REFERRER_POLICY = "same-origin"
MIDDLEWARE.insert(1, "accounts.middleware.PrivateApiMiddleware")

# --- Fichiers statiques (administration Django) servis par WhiteNoise ---
STATIC_ROOT = BASE_DIR / "staticfiles"
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage" if not DEBUG else "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

# --- Hébergement derrière un proxy (Railway, Docker) ---
def env_list(name):
    return [item.strip() for item in os.getenv(name, "").split(",") if item.strip()]

# Domaines fournis automatiquement par Railway (public et réseau privé).
for railway_host in (os.getenv("RAILWAY_PUBLIC_DOMAIN"), os.getenv("RAILWAY_PRIVATE_DOMAIN")):
    if railway_host and railway_host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(railway_host)
if os.getenv("RAILWAY_ENVIRONMENT_NAME"):
    ALLOWED_HOSTS.append("healthcheck.railway.app")  # sonde de santé Railway
CSRF_TRUSTED_ORIGINS += [origin.rstrip("/") for origin in env_list("DJANGO_CSRF_TRUSTED_ORIGINS")]
# Le proxy Railway termine le TLS et transmet X-Forwarded-Proto (relayé par Next.js).
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
# Limitation de débit par client réel : derrière Railway + Next.js, REMOTE_ADDR est celui du service web.
# DJANGO_NUM_PROXIES=1 lit la dernière adresse de X-Forwarded-For, posée par le proxy Railway.
if os.getenv("DJANGO_NUM_PROXIES"):
    REST_FRAMEWORK["NUM_PROXIES"] = int(os.getenv("DJANGO_NUM_PROXIES"))

# --- Courriel transactionnel (vérification des adresses) ---
EMAIL_HOST = os.getenv("EMAIL_HOST", "localhost")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "1") == "1"
EMAIL_TIMEOUT = 15

# --- Journalisation sur la sortie standard (lisible dans Railway) ---
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": os.getenv("DJANGO_LOG_LEVEL", "INFO")},
}

if not DEBUG:
    if SECRET_KEY == "local-dev-only-change-in-production":
        raise RuntimeError("Configure DJANGO_SECRET_KEY for production")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = os.getenv("DJANGO_SECURE_SSL_REDIRECT", "1") == "1"
    # La sonde de santé interne arrive en HTTP : elle ne doit pas être redirigée.
    SECURE_REDIRECT_EXEMPT = [r"^api/v1/health/$"]
    SECURE_HSTS_SECONDS = int(os.getenv("DJANGO_HSTS_SECONDS", "0"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = False
    SECURE_CONTENT_TYPE_NOSNIFF = True
