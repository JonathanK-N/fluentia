"""Refuse les comptes privilégiés fictifs hors d'une base locale explicitement jetable."""

import os
from pathlib import Path


def require_disposable(settings):
    if os.getenv("FLUENTIA_E2E") != "1" or not settings.DEBUG:
        raise SystemExit("Recette interdite sans FLUENTIA_E2E=1 et DEBUG explicites.")
    database = settings.DATABASES["default"]
    engine = database["ENGINE"]
    if engine.endswith("postgresql"):
        allowed = database["NAME"] == "fluentia_e2e" and database.get("HOST") in [
            "localhost",
            "127.0.0.1",
        ]
    elif engine.endswith("sqlite3"):
        path = Path(database["NAME"]).resolve()
        allowed = ".venv" in path.parts and path.name.endswith("-e2e.sqlite3")
    else:
        allowed = False
    if not allowed:
        raise SystemExit(
            "Base refusée : PostgreSQL local fluentia_e2e ou SQLite .venv/*-e2e.sqlite3 uniquement."
        )
