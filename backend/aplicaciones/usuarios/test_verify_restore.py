import json
from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase


class VerifyRestoreCommandTests(TestCase):
    def test_verifica_tablas_migraciones_restricciones_y_usuario(self):
        User = get_user_model()
        User.objects.create_user(
            email="respaldo@example.com",
            password="Clave-segura-2026",
            nombre="Respaldo",
        )
        output = StringIO()

        call_command(
            "verify_restore",
            expect_user_email="respaldo@example.com",
            json=True,
            stdout=output,
        )

        result = json.loads(output.getvalue())
        self.assertEqual(result["status"], "ok")
        self.assertGreater(result["managed_tables"], 0)
        self.assertGreater(result["applied_migrations"], 0)
        self.assertEqual(
            result["expected_user_email"],
            "respaldo@example.com",
        )
        self.assertEqual(result["model_counts"]["usuarios.usuario"], 1)

    def test_falla_si_no_existe_el_usuario_esperado(self):
        with self.assertRaises(CommandError):
            call_command(
                "verify_restore",
                expect_user_email="ausente@example.com",
            )
