from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from aplicaciones.clientas.models import Clienta
from aplicaciones.caja.models import Caja, GastoCaja, MovimientoCaja
from aplicaciones.cobros.models import Cobro
from aplicaciones.turnos.models import Turno


Usuario = get_user_model()


class CajaApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.propietaria = Usuario.objects.create_user(email="luz@example.com", password="Clave-segura-123")
        self.otra_propietaria = Usuario.objects.create_user(email="ana@example.com", password="Clave-segura-123")
        self.clienta = Clienta.objects.create(propietaria=self.propietaria, nombre="Ana", apellido="García")
        self.client.force_authenticate(self.propietaria)

    def abrir_caja(self, **overrides):
        payload = {"saldo_inicial": "100.00", **overrides}
        response = self.client.post("/api/cajas/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        return response

    def crear_cobro(self, importe, metodo_pago="efectivo", estado=Cobro.Estado.REGISTRADO):
        inicio = timezone.now() - timedelta(hours=1)
        turno = Turno.objects.create(
            propietaria=self.propietaria,
            clienta=self.clienta,
            inicio=inicio,
            fin=inicio + timedelta(minutes=60),
            estado=Turno.Estado.REALIZADO,
            duracion_total_minutos=60,
            precio_estimado=importe,
        )
        cobro = Cobro.objects.create(
            propietaria=self.propietaria,
            turno=turno,
            caja=Caja.objects.filter(propietaria=self.propietaria, estado=Caja.Estado.ABIERTA).first(),
            importe=importe,
            clienta_nombre_historica=str(self.clienta),
            metodo_pago=metodo_pago,
            estado=estado,
        )
        return cobro

    def test_requiere_autenticacion_y_abre_una_sola_caja(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get("/api/cajas/").status_code, 401)
        self.assertEqual(self.client.post("/api/cajas/", {"saldo_inicial": "0.00"}, format="json").status_code, 401)

        self.client.force_authenticate(self.propietaria)
        primera = self.abrir_caja(estado="cerrada", saldo_contado="1.00")
        self.assertEqual(primera.data["estado"], Caja.Estado.ABIERTA)
        self.assertEqual(Caja.objects.get(pk=primera.data["id"]).saldo_inicial, Decimal("100.00"))
        duplicada = self.client.post("/api/cajas/", {"saldo_inicial": "0.00"}, format="json")
        self.assertEqual(duplicada.status_code, 400)
        self.assertEqual(len(Caja.objects.filter(propietaria=self.propietaria)), 1)

    def test_valida_saldo_inicial_y_lista_global_con_filtros_opcionales(self):
        negativo = self.client.post("/api/cajas/", {"saldo_inicial": "-1.00"}, format="json")
        self.assertEqual(negativo.status_code, 400)
        self.assertIn("saldo_inicial", negativo.data)

        caja = self.abrir_caja().data
        self.client.post(f"/api/cajas/{caja['id']}/cerrar/", {"saldo_contado": "100.00"}, format="json")
        segunda = self.abrir_caja(saldo_inicial="20.00").data
        Caja.objects.filter(pk=caja["id"]).update(abierta_en=timezone.now() - timedelta(days=1))

        listado = self.client.get("/api/cajas/")
        self.assertEqual([item["id"] for item in listado.data], [segunda["id"], caja["id"]])
        self.assertEqual(len(self.client.get("/api/cajas/", {"estado": "cerrada"}).data), 1)
        self.assertEqual(len(self.client.get("/api/cajas/", {"fecha": timezone.localdate().isoformat()}).data), 1)

    def test_aislamiento_y_404_para_cajas_ajenas(self):
        caja_ajena = Caja.objects.create(propietaria=self.otra_propietaria, saldo_inicial="20.00")
        self.assertEqual(self.client.get(f"/api/cajas/{caja_ajena.id}/").status_code, 404)
        self.assertEqual(
            self.client.post(f"/api/cajas/{caja_ajena.id}/cerrar/", {"saldo_contado": "20.00"}, format="json").status_code,
            404,
        )
        self.assertEqual(self.client.get("/api/cajas/").data, [])

    def test_resumen_calcula_efectivo_y_no_efectivo_sin_mezclarlos(self):
        caja = self.abrir_caja().data
        self.crear_cobro("50.00", "efectivo")
        self.crear_cobro("30.00", "transferencia")
        self.crear_cobro("20.00", "tarjeta")
        cobro_anulado = self.crear_cobro("90.00", "efectivo", estado=Cobro.Estado.ANULADO)
        Cobro.objects.filter(pk=cobro_anulado.pk).update(
            anulado_en=timezone.now(), motivo_anulacion="Error", anulado_por=self.propietaria
        )
        gasto = self.client.post(
            f"/api/cajas/{caja['id']}/gastos/",
            {"concepto": "Insumos", "importe": "15.00", "metodo_pago": "efectivo"},
            format="json",
        )
        self.assertEqual(gasto.status_code, 201)
        transferencia = self.client.post(
            f"/api/cajas/{caja['id']}/gastos/",
            {"concepto": "Curso", "importe": "40.00", "metodo_pago": "transferencia"},
            format="json",
        )
        self.assertEqual(transferencia.status_code, 201)
        self.assertEqual(self.client.post(f"/api/cajas/{caja['id']}/aportes/", {"importe": "10.00", "motivo": "Cambio"}, format="json").status_code, 201)
        self.assertEqual(self.client.post(f"/api/cajas/{caja['id']}/retiros/", {"importe": "5.00", "motivo": "Retiro personal"}, format="json").status_code, 201)

        detalle = self.client.get(f"/api/cajas/{caja['id']}/").data
        self.assertEqual(detalle["resumen"]["cobros_por_metodo"]["efectivo"], "50.00")
        self.assertEqual(detalle["resumen"]["total_cobros"], "100.00")
        self.assertEqual(detalle["resumen"]["gastos_por_metodo"]["transferencia"], "40.00")
        self.assertEqual(detalle["resumen"]["saldo_teorico"], "140.00")

    def test_resumen_no_mezcla_cobros_de_cajas_de_distintas_propietarias(self):
        caja = self.abrir_caja().data
        self.crear_cobro("50.00", "efectivo")

        clienta_ajena = Clienta.objects.create(propietaria=self.otra_propietaria, nombre="Bea")
        inicio = timezone.now() - timedelta(hours=1)
        turno_ajeno = Turno.objects.create(
            propietaria=self.otra_propietaria,
            clienta=clienta_ajena,
            inicio=inicio,
            fin=inicio + timedelta(minutes=60),
            estado=Turno.Estado.REALIZADO,
            duracion_total_minutos=60,
            precio_estimado="80.00",
        )
        caja_ajena = Caja.objects.create(propietaria=self.otra_propietaria, saldo_inicial="0.00")
        Cobro.objects.create(
            propietaria=self.otra_propietaria,
            turno=turno_ajeno,
            caja=caja_ajena,
            importe="80.00",
            clienta_nombre_historica="Bea",
            metodo_pago=Cobro.MetodoPago.EFECTIVO,
        )

        detalle = self.client.get(f"/api/cajas/{caja['id']}/").data
        self.assertEqual(detalle["resumen"]["total_cobros"], "50.00")
        self.assertEqual(detalle["resumen"]["saldo_teorico"], "150.00")

    def test_gastos_se_anulan_con_motivo_y_no_modifican_caja_cerrada(self):
        caja = self.abrir_caja().data
        creado = self.client.post(
            f"/api/cajas/{caja['id']}/gastos/",
            {"concepto": "Alcohol", "importe": "12.00", "metodo_pago": "efectivo"},
            format="json",
        )
        self.assertEqual(creado.status_code, 201)
        gasto_id = creado.data["id"]
        self.assertEqual(self.client.post(f"/api/cajas/{caja['id']}/gastos/{gasto_id}/anular/", {}, format="json").status_code, 400)
        anulado = self.client.post(
            f"/api/cajas/{caja['id']}/gastos/{gasto_id}/anular/",
            {"motivo": "Duplicado"},
            format="json",
        )
        self.assertEqual(anulado.status_code, 200)
        self.assertEqual(anulado.data["estado"], GastoCaja.Estado.ANULADO)
        self.assertEqual(self.client.post(f"/api/cajas/{caja['id']}/gastos/{gasto_id}/anular/", {"motivo": "Otra vez"}, format="json").status_code, 400)

        self.assertEqual(self.client.post(f"/api/cajas/{caja['id']}/cerrar/", {"saldo_contado": "100.00"}, format="json").status_code, 200)
        bloqueado = self.client.post(
            f"/api/cajas/{caja['id']}/gastos/",
            {"concepto": "Tardío", "importe": "1.00", "metodo_pago": "efectivo"},
            format="json",
        )
        self.assertEqual(bloqueado.status_code, 400)

    def test_movimientos_solo_en_caja_abierta_y_se_anulan_con_motivo(self):
        caja = self.abrir_caja().data
        aporte = self.client.post(
            f"/api/cajas/{caja['id']}/aportes/", {"importe": "30.00", "motivo": "Fondo de cambio"}, format="json"
        )
        retiro = self.client.post(
            f"/api/cajas/{caja['id']}/retiros/", {"importe": "10.00", "motivo": "Retiro"}, format="json"
        )
        self.assertEqual(aporte.status_code, 201)
        self.assertEqual(retiro.status_code, 201)
        self.assertEqual(aporte.data["tipo"], MovimientoCaja.Tipo.APORTE)
        self.assertEqual(
            self.client.post(f"/api/cajas/{caja['id']}/movimientos/{retiro.data['id']}/anular/", {}, format="json").status_code,
            400,
        )
        anulado = self.client.post(
            f"/api/cajas/{caja['id']}/movimientos/{retiro.data['id']}/anular/", {"motivo": "No se retiró"}, format="json"
        )
        self.assertEqual(anulado.status_code, 200)
        self.assertEqual(anulado.data["estado"], MovimientoCaja.Estado.ANULADO)

        self.assertEqual(self.client.post(f"/api/cajas/{caja['id']}/cerrar/", {"saldo_contado": "130.00"}, format="json").status_code, 200)
        self.assertEqual(
            self.client.post(f"/api/cajas/{caja['id']}/retiros/", {"importe": "1.00", "motivo": "Tarde"}, format="json").status_code,
            400,
        )

    def test_cierre_exige_observacion_con_diferencia_y_congela_resumen(self):
        caja = self.abrir_caja().data
        cobro = self.crear_cobro("50.00", "efectivo")
        sin_observacion = self.client.post(f"/api/cajas/{caja['id']}/cerrar/", {"saldo_contado": "120.00"}, format="json")
        self.assertEqual(sin_observacion.status_code, 400)
        cerrado = self.client.post(
            f"/api/cajas/{caja['id']}/cerrar/",
            {"saldo_contado": "120.00", "observacion_cierre": "Faltante de cambio"},
            format="json",
        )
        self.assertEqual(cerrado.status_code, 200)
        self.assertEqual(cerrado.data["estado"], Caja.Estado.CERRADA)
        self.assertEqual(cerrado.data["saldo_teorico_cierre"], "150.00")
        self.assertEqual(cerrado.data["diferencia"], "-30.00")
        self.assertEqual(cerrado.data["resumen"]["saldo_teorico"], "150.00")

        Cobro.objects.filter(pk=cobro.pk).update(
            estado=Cobro.Estado.ANULADO,
            anulado_en=timezone.now(),
            motivo_anulacion="Corrección posterior",
            anulado_por=self.propietaria,
        )
        self.assertEqual(self.client.get(f"/api/cajas/{caja['id']}/").data["resumen"]["saldo_teorico"], "150.00")
        self.assertEqual(self.client.post(f"/api/cajas/{caja['id']}/cerrar/", {"saldo_contado": "150.00"}, format="json").status_code, 400)

    def test_cierre_sin_diferencia_y_metodos_no_permiten_edicion_o_borrado(self):
        caja = self.abrir_caja().data
        cierre = self.client.post(f"/api/cajas/{caja['id']}/cerrar/", {"saldo_contado": "100.00"}, format="json")
        self.assertEqual(cierre.status_code, 200)
        self.assertEqual(cierre.data["diferencia"], "0.00")
        self.assertEqual(self.client.patch(f"/api/cajas/{caja['id']}/", {"saldo_inicial": "0.00"}, format="json").status_code, 405)
        self.assertEqual(self.client.put(f"/api/cajas/{caja['id']}/", {}, format="json").status_code, 405)
        self.assertEqual(self.client.delete(f"/api/cajas/{caja['id']}/").status_code, 405)
