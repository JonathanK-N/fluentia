"""Index non destructif sur auth_user : doublons existants = arrêt explicite."""

from django.db import migrations


def create_index(apps, schema_editor):
    User = apps.get_model("auth", "User")
    quote = schema_editor.quote_name
    table = quote(User._meta.db_table)
    schema_editor.execute(
        f"CREATE UNIQUE INDEX fluentia_account_email_ci ON {table} (LOWER(email)) WHERE email <> ''"
    )


def drop_index(apps, schema_editor):
    schema_editor.execute("DROP INDEX fluentia_account_email_ci")


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
        ("auth", "0012_alter_user_first_name_max_length"),
    ]
    operations = [migrations.RunPython(create_index, drop_index)]
