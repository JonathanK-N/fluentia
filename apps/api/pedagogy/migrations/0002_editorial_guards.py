"""Gel des médias, des versions approuvées et du journal éditorial."""

from django.db import migrations


def install(apps, schema_editor):
    vendor = schema_editor.connection.vendor
    fields = [
        f.column
        for f in apps.get_model("pedagogy", "BankItem")._meta.concrete_fields
        if f.name != "state"
    ]
    distinct = "IS DISTINCT FROM" if vendor == "postgresql" else "IS NOT"
    changed = " OR ".join(f"NEW.{field} {distinct} OLD.{field}" for field in fields)
    guards = [
        (
            "bank_frozen",
            "pedagogy_bankitem",
            "UPDATE",
            f"OLD.state IN ('approved','published') AND (NEW.state <> 'published' OR OLD.state <> 'approved' OR {changed})",
        ),
        (
            "bank_frozen_delete",
            "pedagogy_bankitem",
            "DELETE",
            "OLD.state IN ('approved','published')",
        ),
    ]
    for prefix, table in [
        ("media", "pedagogy_mediaasset"),
        ("event", "pedagogy_editorialevent"),
        ("publication", "pedagogy_publisheditem"),
    ]:
        for operation in ["UPDATE", "DELETE"]:
            guards.append(
                (f"{prefix}_immutable_{operation.lower()}", table, operation, "TRUE")
            )
    for name, table, operation, condition in guards:
        if vendor == "sqlite":
            schema_editor.execute(
                f"CREATE TRIGGER {name} BEFORE {operation} ON {table} FOR EACH ROW WHEN ({condition}) BEGIN SELECT RAISE(ABORT, 'Version editoriale immuable'); END;"
            )
        elif vendor == "postgresql":
            returned = "OLD" if operation == "DELETE" else "NEW"
            schema_editor.execute(
                f"CREATE FUNCTION {name}_fn() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF ({condition}) THEN RAISE EXCEPTION 'Version editoriale immuable' USING ERRCODE = '23514'; END IF; RETURN {returned}; END; $$;"
            )
            schema_editor.execute(
                f"CREATE TRIGGER {name} BEFORE {operation} ON {table} FOR EACH ROW EXECUTE FUNCTION {name}_fn();"
            )
        else:
            raise RuntimeError("SQLite ou PostgreSQL requis.")


def uninstall(apps, schema_editor):
    tables = {
        "bank_frozen": "pedagogy_bankitem",
        "bank_frozen_delete": "pedagogy_bankitem",
    }
    for prefix, table in [
        ("media", "pedagogy_mediaasset"),
        ("event", "pedagogy_editorialevent"),
        ("publication", "pedagogy_publisheditem"),
    ]:
        for operation in ["update", "delete"]:
            tables[f"{prefix}_immutable_{operation}"] = table
    for name, table in tables.items():
        if schema_editor.connection.vendor == "sqlite":
            schema_editor.execute(f"DROP TRIGGER IF EXISTS {name}")
        else:
            schema_editor.execute(f"DROP TRIGGER IF EXISTS {name} ON {table}")
            schema_editor.execute(f"DROP FUNCTION IF EXISTS {name}_fn()")


class Migration(migrations.Migration):
    dependencies = [("pedagogy", "0001_initial")]
    operations = [migrations.RunPython(install, uninstall)]
