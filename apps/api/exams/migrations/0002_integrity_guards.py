"""Garde-fous SQL : versions publiées immuables et réponses cohérentes.

Les validations Python améliorent les messages ; ces triggers couvrent aussi
update(), bulk_create() et les écritures SQL directes sur SQLite/PostgreSQL.
"""
from django.db import migrations


def definitions(vendor):
    distinct = "IS DISTINCT FROM" if vendor == "postgresql" else "IS NOT"
    frozen_columns = ["id", "slug", "version", "title", "skill", "mode", "description", "duration_seconds", "published_at", "created_at"]
    changed = " OR ".join(f"NEW.{column} {distinct} OLD.{column}" for column in frozen_columns)
    invalid_question = """EXISTS (
      SELECT 1 FROM exams_question q WHERE q.exam_id = NEW.id AND (
        q.validation_status <> 'validated' OR q.author_id IS NULL OR q.reviewer_id IS NULL
        OR q.author_id = q.reviewer_id OR q.reviewed_at IS NULL
        OR length(trim(q.statement)) = 0 OR length(trim(q.explanation)) = 0
        OR (NEW.skill = 'reading' AND length(trim(q.reading_passage)) = 0)
        OR ((q.origin = 'licensed' OR NEW.skill = 'listening') AND length(trim(q.source_reference)) = 0)
        OR (NEW.skill = 'listening' AND length(trim(q.audio_key)) = 0)
        OR (SELECT count(*) FROM exams_choice c WHERE c.question_id = q.id) <> 4
        OR (SELECT count(*) FROM exams_choice c WHERE c.question_id = q.id AND c.is_correct = TRUE) <> 1
        OR EXISTS (SELECT 1 FROM exams_choice c WHERE c.question_id = q.id AND length(trim(c.label)) = 0)
      ))"""
    invalid_publication = f"""NEW.is_published = TRUE AND (
      NOT EXISTS (SELECT 1 FROM exams_question q WHERE q.exam_id = NEW.id)
      OR {invalid_question}
      OR (NEW.mode = 'simulation' AND (
        (SELECT count(*) FROM exams_question q WHERE q.exam_id = NEW.id) <> 39
        OR NEW.duration_seconds <> CASE WHEN NEW.skill = 'reading' THEN 3600 ELSE 2100 END
      )))"""
    question_guard = lambda side: f"EXISTS (SELECT 1 FROM exams_exam e WHERE e.id = {side}.exam_id AND e.published_at IS NOT NULL)"
    choice_guard = lambda side: f"EXISTS (SELECT 1 FROM exams_question q JOIN exams_exam e ON e.id = q.exam_id WHERE q.id = {side}.question_id AND e.published_at IS NOT NULL)"
    answer_guard = """NOT EXISTS (SELECT 1 FROM exams_attempt a
      JOIN exams_question q ON q.exam_id = a.exam_id
      JOIN exams_choice c ON c.question_id = q.id
      WHERE a.id = NEW.attempt_id AND q.id = NEW.question_id AND c.id = NEW.choice_id)"""
    entries = [
        ("freeze_exam", "exams_exam", "UPDATE", f"OLD.published_at IS NOT NULL AND ({changed})"),
        ("publish_exam_insert", "exams_exam", "INSERT", invalid_publication),
        ("publish_exam_update", "exams_exam", "UPDATE", invalid_publication),
    ]
    for label, table, guard in [("question", "exams_question", question_guard), ("choice", "exams_choice", choice_guard)]:
        for event in ["INSERT", "UPDATE", "DELETE"]:
            sides = ["NEW"] if event == "INSERT" else ["OLD"] if event == "DELETE" else ["OLD", "NEW"]
            entries.append((f"freeze_{label}_{event.lower()}", table, event, " OR ".join(guard(side) for side in sides)))
    entries.extend((f"answer_links_{event.lower()}", "exams_answer", event, answer_guard) for event in ["INSERT", "UPDATE"])
    return entries


def install(apps, schema_editor):
    vendor = schema_editor.connection.vendor
    if vendor not in ["sqlite", "postgresql"]:
        raise RuntimeError("Le moteur du lot 01 requiert SQLite ou PostgreSQL.")
    for name, table, event, condition in definitions(vendor):
        if vendor == "sqlite":
            schema_editor.execute(f"CREATE TRIGGER {name} BEFORE {event} ON {table} FOR EACH ROW WHEN ({condition}) BEGIN SELECT RAISE(ABORT, 'Integrite du moteur examens'); END;")
        else:
            returned = "OLD" if event == "DELETE" else "NEW"
            sides = ["NEW"] if event == "INSERT" else ["OLD"] if event == "DELETE" else ["OLD", "NEW"]
            locks = ""
            if table == "exams_question":
                ids = ", ".join(f"{side}.exam_id" for side in sides)
                locks = f"PERFORM 1 FROM exams_exam WHERE id IN ({ids}) ORDER BY id FOR UPDATE;"
            elif table == "exams_choice":
                ids = ", ".join(f"{side}.question_id" for side in sides)
                locks = f"PERFORM 1 FROM exams_question WHERE id IN ({ids}) ORDER BY id FOR UPDATE; PERFORM 1 FROM exams_exam WHERE id IN (SELECT exam_id FROM exams_question WHERE id IN ({ids})) ORDER BY id FOR UPDATE;"
            schema_editor.execute(f"CREATE FUNCTION {name}_fn() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN {locks} IF ({condition}) THEN RAISE EXCEPTION 'Integrite du moteur examens' USING ERRCODE = '23514'; END IF; RETURN {returned}; END; $$;")
            schema_editor.execute(f"CREATE TRIGGER {name} BEFORE {event} ON {table} FOR EACH ROW EXECUTE FUNCTION {name}_fn();")


def uninstall(apps, schema_editor):
    vendor = schema_editor.connection.vendor
    for name, table, event, condition in reversed(definitions(vendor)):
        if vendor == "sqlite":
            schema_editor.execute(f"DROP TRIGGER IF EXISTS {name}")
        elif vendor == "postgresql":
            schema_editor.execute(f"DROP TRIGGER IF EXISTS {name} ON {table}")
            schema_editor.execute(f"DROP FUNCTION IF EXISTS {name}_fn()")


class Migration(migrations.Migration):
    dependencies = [("exams", "0001_initial")]
    operations = [migrations.RunPython(install, uninstall)]
