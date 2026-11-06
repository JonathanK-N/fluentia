"""Configuration Gunicorn pour la production (Railway, Docker)."""
import os

# Sur Railway, « :: » écoute en IPv6 et IPv4 : requis par le réseau privé (*.railway.internal).
# Ailleurs (Docker, CI), 0.0.0.0 reste compatible avec les hôtes sans IPv6.
host = os.getenv("GUNICORN_HOST") or ("[::]" if os.getenv("RAILWAY_ENVIRONMENT_NAME") else "0.0.0.0")
bind = f"{host}:{os.getenv('PORT', '8000')}"
# Fils d'exécution : la correction de Rédaction est diffusée en continu et peut durer plus d'une minute.
worker_class = "gthread"
workers = int(os.getenv("WEB_CONCURRENCY", "2"))
threads = int(os.getenv("GUNICORN_THREADS", "4"))
timeout = int(os.getenv("GUNICORN_TIMEOUT", "180"))
graceful_timeout = 30
keepalive = 5
# Recyclage régulier des processus pour contenir la mémoire (imports d'archives volumineuses).
max_requests = 1000
max_requests_jitter = 100
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("GUNICORN_LOG_LEVEL", "info")
forwarded_allow_ips = "*"
