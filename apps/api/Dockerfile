FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PRIVATE_MEDIA_ROOT=/var/lib/fluentia/private-media
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
# Fichiers statiques de l'administration, servis ensuite par WhiteNoise.
# La clé fournie ici ne sert qu'à la construction et n'est jamais utilisée à l'exécution.
RUN DJANGO_SECRET_KEY=build-only-collectstatic DJANGO_DEBUG=0 python manage.py collectstatic --noinput \
    && mkdir -p "$PRIVATE_MEDIA_ROOT"
EXPOSE 8000
CMD ["sh", "bin/start.sh"]
