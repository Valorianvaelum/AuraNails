from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from aplicaciones.clientas.models import Clienta
from aplicaciones.cobros.models import Cobro
from aplicaciones.servicios.models import Servicio
from aplicaciones.turnos.models import Turno, TurnoServicio


Usuario = get_user_model()


class CobrosApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.propietaria = Usuario.objects.create_user(email="luz@example.com", password="Clave-segura-123")
        self.otra_propietaria = Usuario.objects.create_user(email="ana@example.com", password="Clave-segura-123")
        self.clienta = Clienta.objects.create(propietaria=self.propietaria, nombre="Ana", apellido="García")
        self.servicio = Servicio.objects.create(
            propietaria=self.propietaria,
            nombre="Kapping",
            duracion_minutos=60,
            precio=Decimal("150.00"),
        )
        self.client.force_authenticate(self.propietaria)

    def crear_turno(self, estado=Turno.Estado.REALIZADO, precio="150.00", clienta=None, propietaria=None):
        propietaria = propietaria or self.propietaria
        clienta = clienta or self.clienta
        inicio = timezone.now() - timedelta(hours=2)
        turno = Turno.objects.create(
            propietaria=propietaria,
            clienta=clienta,
            inicio=inicio,
            fin=inicio + timedelta(minutes=60),
            estado=estado,
            duracion_total_minutos=60,
            precio_estimado=precio,
        )
        if propietaria == self.propietaria:
            TurnoServicio.objects.create(
                turno=turno,
                servicio=self.servicio,
                nombre_servicio="Kapping histórico",
                duracion_minutos=60,
                precio="150.00",
            )
        return turno

    @staticmethod
    def payload(turno, **overrides):
        return {"turno_id": turno.id, "metodo_pago": "efectivo", **overrides}

    def crear_cobro(self, turno, **overrides):
        response = self.client.post("/api/cobros/", self.payload(turno, **overrides), format="json")
        self.assertEqual(response.status_code, 201)
        return response

    def test_crea_cobro_desde_turno_realizado_y_copia_snapshot(self):
        turno = self.crear_turno()
        response = self.crear_cobro(turno, importe="1.00", estado="anulado")

        cobro = Cobro.objects.get(pk=response.data["id"])
        self.assertEqual(cobro.propietaria, self.propietaria)
        self.assertEqual(cobro.turno, turno)
        self.assertEqual(cobro.importe, Decimal("150.00"))
        self.assertEqual(cobro.clienta_nombre_historica, "Ana García")
        self.assertEqual(cobro.estado, Cobro.Estado.REGISTRADO)
        self.assertEqual(response.data["servicios"][0]["nombre"], "Kapping histórico")
        self.assertTrue(response.data["puede_anularse"])

    def test_rechaza_turnos_no_realizados_e_importe_historico_invalido(self):
        for estado in (
            Turno.Estado.PENDIENTE,
            Turno.Estado.CONFIRMADO,
            Turno.Estado.REPROGRAMADO,
            Turno.Estado.CANCELADO,
            Turno.Estado.NO_VINO,
        ):
            response = self.client.post("/api/cobros/", self.payload(self.crear_turno(estado=estado)), format="json")
            self.assertEqual(response.status_code, 400)
            self.assertIn("turno_id", response.data)

        invalido = self.client.post("/api/cobros/", self.payload(self.crear_turno(precio="0.00")), format="json")
        self.assertEqual(invalido.status_code, 400)
        self.assertIn("turno_id", invalido.data)

    def test_requiere_autenticacion_y_oculta_turnos_ajenos(self):
        turno = self.crear_turno()
        self.client.force_authenticate(None)
        self.assertEqual(self.client.post("/api/cobros/", self.payload(turno), format="json").status_code, 401)

        clienta_ajena = Clienta.objects.create(propietaria=self.otra_propietaria, nombre="Bea")
        turno_ajeno = self.crear_turno(clienta=clienta_ajena, propietaria=self.otra_propietaria)
        self.client.force_authenticate(self.propietaria)
        self.assertEqual(self.client.post("/api/cobros/", self.payload(turno_ajeno), format="json").status_code, 404)

    def test_bloquea_duplicados_y_permite_nuevo_cobro_despues_de_anular(self):
        turno = self.crear_turno()
        primero = self.crear_cobro(turno).data
        duplicado = self.client.post("/api/cobros/", self.payload(turno), format="json")
        self.assertEqual(duplicado.status_code, 400)
        self.assertIn("turno_id", duplicado.data)

        sin_motivo = self.client.post(f"/api/cobros/{primero['id']}/anular/", {}, format="json")
        self.assertEqual(sin_motivo.status_code, 400)
        anulado = self.client.post(
            f"/api/cobros/{primero['id']}/anular/",
            {"motivo": "La clienta eligió otro medio."},
            format="json",
        )
        self.assertEqual(anulado.status_code, 200)
        self.assertEqual(anulado.data["estado"], Cobro.Estado.ANULADO)
        self.assertFalse(anulado.data["puede_anularse"])
        self.assertIsNotNone(anulado.data["anulado_en"])

        doble_anulacion = self.client.post(f"/api/cobros/{primero['id']}/anular/", {"motivo": "Reintento"}, format="json")
        self.assertEqual(doble_anulacion.status_code, 400)
        self.assertEqual(self.crear_cobro(turno).status_code, 201)

    def test_constraint_impide_dos_cobros_registrados_para_un_turno(self):
        turno = self.crear_turno()
        Cobro.objects.create(
            propietaria=self.propietaria,
            turno=turno,
            importe="150.00",
            clienta_nombre_historica="Ana García",
            metodo_pago=Cobro.MetodoPago.EFECTIVO,
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Cobro.objects.create(
                    propietaria=self.propietaria,
                    turno=turno,
                    importe="150.00",
                    clienta_nombre_historica="Ana García",
                    metodo_pago=Cobro.MetodoPago.TARJETA,
                )

    def test_valida_metodos_de_pago_y_detalle_para_otro(self):
        turno = self.crear_turno()
        invalido = self.client.post("/api/cobros/", self.payload(turno, metodo_pago="criptomoneda"), format="json")
        self.assertEqual(invalido.status_code, 400)
        self.assertIn("metodo_pago", invalido.data)

        sin_detalle = self.client.post("/api/cobros/", self.payload(turno, metodo_pago="otro"), format="json")
        self.assertEqual(sin_detalle.status_code, 400)
        self.assertIn("detalle_metodo", sin_detalle.data)

        turno_transferencia = self.crear_turno()
        self.assertEqual(self.crear_cobro(turno_transferencia, metodo_pago="transferencia").status_code, 201)
        turno_otro = self.crear_turno()
        self.assertEqual(self.crear_cobro(turno_otro, metodo_pago="otro", detalle_metodo="Billetera virtual").status_code, 201)

    def test_lista_global_filtros_y_aislamiento(self):
        primero = self.crear_cobro(self.crear_turno())
        segunda_clienta = Clienta.objects.create(propietaria=self.propietaria, nombre="Belén")
        segundo = self.crear_cobro(self.crear_turno(clienta=segunda_clienta), metodo_pago="tarjeta")
        Cobro.objects.filter(pk=primero.data["id"]).update(creado_en=timezone.now() - timedelta(days=1))

        clienta_ajena = Clienta.objects.create(propietaria=self.otra_propietaria, nombre="Ajena")
        turno_ajeno = self.crear_turno(clienta=clienta_ajena, propietaria=self.otra_propietaria)
        Cobro.objects.create(
            propietaria=self.otra_propietaria,
            turno=turno_ajeno,
            importe="80.00",
            clienta_nombre_historica="Ajena",
            metodo_pago=Cobro.MetodoPago.EFECTIVO,
        )

        listado = self.client.get("/api/cobros/")
        self.assertEqual([cobro["id"] for cobro in listado.data], [segundo.data["id"], primero.data["id"]])
        self.assertEqual(len(self.client.get("/api/cobros/", {"search": "anA"}).data), 1)
        self.assertEqual(len(self.client.get("/api/cobros/", {"metodo_pago": "tarjeta"}).data), 1)
        self.assertEqual(len(self.client.get("/api/cobros/", {"estado": "registrado", "search": "bel"}).data), 1)
        self.assertEqual(len(self.client.get("/api/cobros/", {"fecha": timezone.localdate().isoformat()}).data), 1)

    def test_detalle_anulacion_y_recursos_ajenos(self):
        cobro = self.crear_cobro(self.crear_turno()).data
        detalle = self.client.get(f"/api/cobros/{cobro['id']}/")
        self.assertEqual(detalle.status_code, 200)
        self.assertEqual(detalle.data["turno"]["duracion_total_minutos"], 60)
        self.assertEqual(detalle.data["importe"], "150.00")

        clienta_ajena = Clienta.objects.create(propietaria=self.otra_propietaria, nombre="Bea")
        cobro_ajeno = Cobro.objects.create(
            propietaria=self.otra_propietaria,
            turno=self.crear_turno(clienta=clienta_ajena, propietaria=self.otra_propietaria),
            importe="80.00",
            clienta_nombre_historica="Bea",
            metodo_pago=Cobro.MetodoPago.EFECTIVO,
        )
        self.assertEqual(self.client.get(f"/api/cobros/{cobro_ajeno.id}/").status_code, 404)
        self.assertEqual(self.client.post(f"/api/cobros/{cobro_ajeno.id}/anular/", {"motivo": "No corresponde"}, format="json").status_code, 404)

    def test_no_expone_edicion_generica_ni_eliminacion(self):
        cobro = self.crear_cobro(self.crear_turno()).data
        self.assertEqual(self.client.patch(f"/api/cobros/{cobro['id']}/", {"importe": "1.00"}, format="json").status_code, 405)
        self.assertEqual(self.client.put(f"/api/cobros/{cobro['id']}/", {}, format="json").status_code, 405)
        self.assertEqual(self.client.delete(f"/api/cobros/{cobro['id']}/").status_code, 405)
