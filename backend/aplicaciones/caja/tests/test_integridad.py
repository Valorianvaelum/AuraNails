from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.exceptions import ValidationError

from aplicaciones.caja.models import Caja
from aplicaciones.caja.services import abrir_caja


Usuario = get_user_model()


class IntegridadCajaTests(TestCase):
    def setUp(self):
        self.propietaria = Usuario.objects.create_user(
            email="integridad@example.com",
            password="Clave-segura-123",
        )

    def test_constraint_impide_dos_cajas_abiertas_para_la_misma_propietaria(self):
        Caja.objects.create(propietaria=self.propietaria, saldo_inicial="0.00")

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Caja.objects.create(propietaria=self.propietaria, saldo_inicial="10.00")

    def test_servicio_devuelve_error_funcional_si_ya_existe_caja_abierta(self):
        abrir_caja(propietaria=self.propietaria, saldo_inicial="0.00")

        with self.assertRaisesMessage(ValidationError, "Ya tenés una caja abierta."):
            abrir_caja(propietaria=self.propietaria, saldo_inicial="10.00")

        self.assertEqual(
            Caja.objects.filter(
                propietaria=self.propietaria,
                estado=Caja.Estado.ABIERTA,
            ).count(),
            1,
        )
