from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from aplicaciones.clientas.models import Clienta
from aplicaciones.servicios.models import Servicio
from aplicaciones.turnos.models import Turno
from aplicaciones.cobros.models import Cobro
from aplicaciones.caja.models import Caja


class SeedDemoCommandTests(TestCase):
    password = "Demo-Segura-2026"

    def test_crea_demo_aislada_y_no_toca_usuarios_reales(self):
        User = get_user_model()
        real = User.objects.create_user(
            email="persona.real@example.com",
            password="Clave-real-2026",
            nombre="Persona",
            apellido="Real",
        )
        Clienta.objects.create(
            propietaria=real,
            nombre="Clienta",
            apellido="Real",
            telefono="3874555000",
        )

        call_command("seed_demo", password=self.password)

        demo = User.objects.get(email="demo.auranails@example.com")
        self.assertTrue(demo.check_password(self.password))
        self.assertEqual(Clienta.objects.filter(propietaria=demo).count(), 10)
        self.assertEqual(Servicio.objects.filter(propietaria=demo).count(), 7)
        self.assertEqual(Turno.objects.filter(propietaria=demo).count(), 10)
        self.assertEqual(Cobro.objects.filter(propietaria=demo).count(), 3)
        self.assertEqual(Caja.objects.filter(propietaria=demo).count(), 2)
        self.assertEqual(
            Caja.objects.filter(propietaria=demo, estado=Caja.Estado.ABIERTA).count(),
            1,
        )

        self.assertTrue(User.objects.filter(pk=real.pk).exists())
        self.assertEqual(Clienta.objects.filter(propietaria=real).count(), 1)

    def test_segunda_ejecucion_exige_reset_y_reset_no_duplica(self):
        User = get_user_model()
        call_command("seed_demo", password=self.password)
        demo = User.objects.get(email="demo.auranails@example.com")
        conteos_iniciales = (
            Clienta.objects.filter(propietaria=demo).count(),
            Servicio.objects.filter(propietaria=demo).count(),
            Turno.objects.filter(propietaria=demo).count(),
            Cobro.objects.filter(propietaria=demo).count(),
            Caja.objects.filter(propietaria=demo).count(),
        )

        with self.assertRaises(CommandError):
            call_command("seed_demo", password=self.password)

        call_command("seed_demo", password=self.password, reset=True)
        demo.refresh_from_db()
        conteos_finales = (
            Clienta.objects.filter(propietaria=demo).count(),
            Servicio.objects.filter(propietaria=demo).count(),
            Turno.objects.filter(propietaria=demo).count(),
            Cobro.objects.filter(propietaria=demo).count(),
            Caja.objects.filter(propietaria=demo).count(),
        )
        self.assertEqual(conteos_finales, conteos_iniciales)
