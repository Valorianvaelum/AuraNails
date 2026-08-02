from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from aplicaciones.caja.models import Caja
from aplicaciones.clientas.models import Clienta
from aplicaciones.cobros.models import Cobro
from aplicaciones.servicios.models import Servicio
from aplicaciones.turnos.models import Turno


Usuario = get_user_model()


class FlujoOperativoIntegralTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.propietaria = Usuario.objects.create_user(
            email="operadora@example.com",
            password="Clave-segura-123",
            nombre="Operadora",
        )
        self.client.force_authenticate(self.propietaria)

    def test_clienta_turno_cobro_y_cierre_de_caja(self):
        clienta_response = self.client.post(
            "/api/clientas/",
            {
                "nombre": "Ana",
                "apellido": "Pérez",
                "telefono": "+54 387 555 1234",
                "email": "ANA@EXAMPLE.COM",
            },
            format="json",
        )
        self.assertEqual(clienta_response.status_code, 201)
        clienta_id = clienta_response.data["id"]

        servicio_response = self.client.post(
            "/api/servicios/",
            {
                "nombre": "Kapping integral",
                "duracion_minutos": 60,
                "precio": "12000.00",
            },
            format="json",
        )
        self.assertEqual(servicio_response.status_code, 201)
        servicio_id = servicio_response.data["id"]

        caja_response = self.client.post(
            "/api/cajas/",
            {"saldo_inicial": "5000.00", "observacion_apertura": "Inicio de jornada"},
            format="json",
        )
        self.assertEqual(caja_response.status_code, 201)
        caja_id = caja_response.data["id"]

        inicio_futuro = timezone.now() + timedelta(days=1)
        turno_response = self.client.post(
            "/api/turnos/",
            {
                "clienta_id": clienta_id,
                "inicio": inicio_futuro.isoformat(),
                "servicios_ids": [servicio_id],
                "notas": "Primera visita",
            },
            format="json",
        )
        self.assertEqual(turno_response.status_code, 201)
        turno_id = turno_response.data["id"]
        self.assertEqual(turno_response.data["precio_estimado"], "12000.00")
        self.assertEqual(turno_response.data["duracion_total_minutos"], 60)

        confirmar = self.client.post(f"/api/turnos/{turno_id}/confirmar/")
        self.assertEqual(confirmar.status_code, 200)
        self.assertEqual(confirmar.data["estado"], Turno.Estado.CONFIRMADO)

        inicio_pasado = timezone.now() - timedelta(hours=2)
        Turno.objects.filter(pk=turno_id).update(
            inicio=inicio_pasado,
            fin=inicio_pasado + timedelta(minutes=60),
        )

        realizar = self.client.post(f"/api/turnos/{turno_id}/realizar/")
        self.assertEqual(realizar.status_code, 200)
        self.assertEqual(realizar.data["estado"], Turno.Estado.REALIZADO)
        self.assertTrue(realizar.data["puede_registrar_cobro"])

        cobro_response = self.client.post(
            "/api/cobros/",
            {"turno_id": turno_id, "metodo_pago": Cobro.MetodoPago.EFECTIVO},
            format="json",
        )
        self.assertEqual(cobro_response.status_code, 201)
        self.assertEqual(cobro_response.data["importe"], "12000.00")
        self.assertEqual(cobro_response.data["caja_id"], caja_id)
        self.assertEqual(cobro_response.data["clienta_nombre_historica"], "Ana Pérez")

        turno_cobrado = self.client.get(f"/api/turnos/{turno_id}/")
        self.assertEqual(turno_cobrado.status_code, 200)
        self.assertFalse(turno_cobrado.data["puede_registrar_cobro"])
        self.assertEqual(turno_cobrado.data["cobro_activo"]["id"], cobro_response.data["id"])

        caja_abierta = self.client.get(f"/api/cajas/{caja_id}/")
        self.assertEqual(caja_abierta.status_code, 200)
        self.assertEqual(caja_abierta.data["resumen"]["total_cobros"], "12000.00")
        self.assertEqual(caja_abierta.data["resumen"]["saldo_teorico"], "17000.00")

        cierre = self.client.post(
            f"/api/cajas/{caja_id}/cerrar/",
            {"saldo_contado": "17000.00"},
            format="json",
        )
        self.assertEqual(cierre.status_code, 200)
        self.assertEqual(cierre.data["estado"], Caja.Estado.CERRADA)
        self.assertEqual(cierre.data["diferencia"], "0.00")
        self.assertEqual(cierre.data["resumen"]["saldo_teorico"], "17000.00")

        gasto_tardio = self.client.post(
            f"/api/cajas/{caja_id}/gastos/",
            {"concepto": "Operación tardía", "importe": "100.00", "metodo_pago": "efectivo"},
            format="json",
        )
        self.assertEqual(gasto_tardio.status_code, 400)

        clienta = Clienta.objects.get(pk=clienta_id)
        servicio = Servicio.objects.get(pk=servicio_id)
        turno = Turno.objects.get(pk=turno_id)
        cobro = Cobro.objects.get(pk=cobro_response.data["id"])
        caja = Caja.objects.get(pk=caja_id)

        self.assertEqual(clienta.email, "ana@example.com")
        self.assertEqual(servicio.precio, Decimal("12000.00"))
        self.assertEqual(turno.estado, Turno.Estado.REALIZADO)
        self.assertEqual(cobro.estado, Cobro.Estado.REGISTRADO)
        self.assertEqual(cobro.caja, caja)
        self.assertEqual(caja.estado, Caja.Estado.CERRADA)
        self.assertEqual(caja.saldo_teorico_cierre, Decimal("17000.00"))
