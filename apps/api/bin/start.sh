#!/bin/sh
# Démarrage de l'API en production : migrations (désactivables) puis Gunicorn.
set -e
if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  python manage.py migrate --noinput
fi
exec gunicorn config.wsgi:application --config gunicorn.conf.py
