from __future__ import annotations

import json

from django.apps import apps
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.db.migrations.recorder import MigrationRecorder


class Command(BaseCommand):
    help = (
        "Verifica que una base restaurada contenga todas las tablas administradas, "
        "migraciones aplicadas y restricciones consistentes."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--expect-user-email",
            help="Exige que exista una cuenta con este correo en la base restaurada.",
        )
        parser.add_argument(
            "--json",
            action="store_true",
            help="Devuelve el resultado como JSON para automatización.",
        )

    def handle(self, *args, **options):
        managed_models = sorted(
            (
                model
                for model in apps.get_models()
                if model._meta.managed and not model._meta.proxy
            ),
            key=lambda model: model._meta.label_lower,
        )
        expected_tables = {model._meta.db_table for model in managed_models}
        existing_tables = set(connection.introspection.table_names())
        missing_tables = sorted(expected_tables - existing_tables)

        if missing_tables:
            raise CommandError(
                "La restauración no contiene todas las tablas esperadas: "
                + ", ".join(missing_tables)
            )

        migration_count = MigrationRecorder(connection).migration_qs.count()
        if migration_count == 0:
            raise CommandError(
                "La tabla de migraciones existe, pero no registra migraciones aplicadas."
            )

        try:
            connection.check_constraints()
        except Exception as exc:  # pragma: no cover - depende del motor de base
            raise CommandError(
                f"La base restaurada contiene restricciones inválidas: {exc}"
            ) from exc

        expected_email = options.get("expect_user_email")
        if expected_email:
            User = get_user_model()
            if not User.objects.filter(email__iexact=expected_email).exists():
                raise CommandError(
                    "No se encontró la cuenta esperada en la restauración: "
                    f"{expected_email}"
                )

        model_counts = {
            model._meta.label_lower: model._default_manager.count()
            for model in managed_models
        }
        result = {
            "status": "ok",
            "database_vendor": connection.vendor,
            "managed_tables": len(expected_tables),
            "applied_migrations": migration_count,
            "expected_user_email": expected_email,
            "model_counts": model_counts,
        }

        if options["json"]:
            self.stdout.write(json.dumps(result, ensure_ascii=False, sort_keys=True))
            return

        self.stdout.write(self.style.SUCCESS("Restauración verificada correctamente."))
        self.stdout.write(f"Motor: {connection.vendor}")
        self.stdout.write(f"Tablas administradas: {len(expected_tables)}")
        self.stdout.write(f"Migraciones aplicadas: {migration_count}")
        if expected_email:
            self.stdout.write(f"Cuenta esperada encontrada: {expected_email}")
