from datetime import datetime, time, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from aplicaciones.clientas.models import Clienta
from aplicaciones.cobros.models import Cobro
from aplicaciones.servicios.models import Servicio
from aplicaciones.turnos.models import Turno


Usuario = get_user_model()


class TurnosTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.usuario = Usuario.objects.create_user(email="propietaria@example.com", password="Clave-segura-123")
        self.otro_usuario = Usuario.objects.create_user(email="otra@example.com", password="Clave-segura-123")
        self.clienta = Clienta.objects.create(propietaria=self.usuario, nombre="Ana", telefono="111111111")
        self.servicio = Servicio.objects.create(
            propietaria=self.usuario,
            nombre="Kapping",
            duracion_minutos=60,
            precio="100.00",
        )
        self.client.force_authenticate(self.usuario)
        self.inicio = timezone.make_aware(
            datetime.combine(timezone.localdate() + timedelta(days=1), time(10))
        )

    def datos_turno(self, **overrides):
        return {
            "clienta_id": self.clienta.id,
            "inicio": self.inicio.isoformat(),
            "servicios_ids": [self.servicio.id],
            **overrides,
        }

    def crear_turno(self, **overrides):
        response = self.client.post("/api/turnos/", self.datos_turno(**overrides), format="json")
        self.assertEqual(response.status_code, 201)
        return response.data

    def crear_turno_pasado(self, propietaria=None, estado=Turno.Estado.PENDIENTE):
        inicio = timezone.now() - timedelta(hours=1)
        propietaria = propietaria or self.usuario
        clienta = self.clienta if propietaria == self.usuario else Clienta.objects.create(propietaria=propietaria, nombre="Bea")
        return Turno.objects.create(
            propietaria=propietaria,
            clienta=clienta,
            inicio=inicio,
            fin=inicio + timedelta(minutes=60),
            estado=estado,
            duracion_total_minutos=60,
            precio_estimado="100.00",
        )

    def test_crea_snapshot_y_calculos(self):
        turno = self.crear_turno()

        self.assertEqual(turno["duracion_total_minutos"], 60)
        self.assertEqual(turno["precio_estimado"], "100.00")
        self.servicio.precio = "200.00"
        self.servicio.save()

        detalle = self.client.get(f"/api/turnos/{turno['id']}/")
        self.assertEqual(detalle.data["servicios"][0]["precio"], "100.00")

    def test_requiere_autenticacion_y_aísla_recursos_ajenos(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.post("/api/turnos/", self.datos_turno(), format="json").status_code, 401)

        turno_ajeno = Turno.objects.create(
            propietaria=self.otro_usuario,
            clienta=Clienta.objects.create(propietaria=self.otro_usuario, nombre="Bea"),
            inicio=self.inicio,
            fin=self.inicio + timedelta(minutes=1),
            duracion_total_minutos=1,
            precio_estimado="1.00",
        )
        self.client.force_authenticate(self.usuario)
        self.assertEqual(self.client.get(f"/api/turnos/{turno_ajeno.id}/").status_code, 404)

    def test_valida_fecha_pasada_clienta_y_servicios_propios_activos(self):
        pasado = self.client.post(
            "/api/turnos/",
            self.datos_turno(inicio=(timezone.now() - timedelta(minutes=1)).isoformat()),
            format="json",
        )
        self.assertEqual(pasado.status_code, 400)
        self.assertIn("inicio", pasado.data)

        clienta_ajena = Clienta.objects.create(propietaria=self.otro_usuario, nombre="Bea")
        clienta_invalida = self.client.post(
            "/api/turnos/",
            self.datos_turno(clienta_id=clienta_ajena.id),
            format="json",
        )
        self.assertEqual(clienta_invalida.status_code, 400)
        self.assertIn("clienta_id", clienta_invalida.data)

        self.servicio.activo = False
        self.servicio.save()
        servicio_pausado = self.client.post("/api/turnos/", self.datos_turno(), format="json")
        self.assertEqual(servicio_pausado.status_code, 400)
        self.assertIn("servicios_ids", servicio_pausado.data)

    def test_rechaza_superposicion_permite_turnos_consecutivos_y_reutiliza_cancelados(self):
        primero = self.crear_turno()
        superpuesto = self.client.post(
            "/api/turnos/",
            self.datos_turno(inicio=(self.inicio + timedelta(minutes=30)).isoformat()),
            format="json",
        )
        self.assertEqual(superpuesto.status_code, 400)
        self.assertIn("inicio", superpuesto.data)

        consecutivo = self.client.post(
            "/api/turnos/",
            self.datos_turno(inicio=(self.inicio + timedelta(minutes=60)).isoformat()),
            format="json",
        )
        self.assertEqual(consecutivo.status_code, 201)

        self.assertEqual(self.client.post(f"/api/turnos/{primero['id']}/cancelar/").status_code, 200)
        self.assertEqual(self.client.post("/api/turnos/", self.datos_turno(), format="json").status_code, 201)

    def test_lista_por_fecha_estado_y_busqueda(self):
        primer_turno = self.crear_turno()
        self.client.post(f"/api/turnos/{primer_turno['id']}/confirmar/")
        segundo_turno = self.crear_turno(inicio=(self.inicio + timedelta(days=1)).isoformat())
        turno_pasado = self.crear_turno_pasado()
        turno_ajeno = self.crear_turno_pasado(propietaria=self.otro_usuario)

        listado_global = self.client.get("/api/turnos/")
        self.assertEqual(listado_global.status_code, 200)
        self.assertEqual(
            [turno["id"] for turno in listado_global.data],
            [primer_turno["id"], segundo_turno["id"], turno_pasado.id],
        )
        self.assertNotIn(turno_ajeno.id, [turno["id"] for turno in listado_global.data])

        fecha = self.inicio.date().isoformat()
        por_fecha = self.client.get("/api/turnos/", {"fecha": fecha})
        self.assertEqual(por_fecha.status_code, 200)
        self.assertEqual(len(por_fecha.data), 1)

        por_estado = self.client.get("/api/turnos/", {"estado": "confirmado"})
        self.assertEqual([turno["id"] for turno in por_estado.data], [primer_turno["id"]])

        por_busqueda = self.client.get("/api/turnos/", {"search": "aN"})
        self.assertEqual(len(por_busqueda.data), 3)

        combinados = self.client.get(
            "/api/turnos/",
            {"fecha": fecha, "estado": "confirmado", "search": "ana"},
        )
        self.assertEqual([turno["id"] for turno in combinados.data], [primer_turno["id"]])

        sin_coincidencias = self.client.get(
            "/api/turnos/",
            {"fecha": fecha, "estado": "cancelado", "search": "ana"},
        )
        self.assertEqual(list(sin_coincidencias.data), [])

    def test_transiciones_invalidas_bloquean_edicion_y_delete(self):
        turno = self.crear_turno()
        self.assertEqual(self.client.post(f"/api/turnos/{turno['id']}/realizar/").status_code, 400)
        self.assertEqual(self.client.post(f"/api/turnos/{turno['id']}/confirmar/").status_code, 200)
        self.assertEqual(self.client.post(f"/api/turnos/{turno['id']}/realizar/").status_code, 400)

        turno_pasado = self.crear_turno_pasado(estado=Turno.Estado.CONFIRMADO)
        self.assertEqual(self.client.post(f"/api/turnos/{turno_pasado.id}/realizar/").status_code, 200)
        self.assertEqual(self.client.patch(f"/api/turnos/{turno_pasado.id}/", {"notas": "x"}, format="json").status_code, 400)
        self.assertEqual(self.client.delete(f"/api/turnos/{turno['id']}/").status_code, 405)

    def test_no_vino_cierra_turno_y_bloquea_transiciones_posteriores(self):
        turno = self.crear_turno_pasado()

        response = self.client.post(f"/api/turnos/{turno.id}/no-vino/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["estado"], Turno.Estado.NO_VINO)
        self.assertEqual(response.data["estado_display"], "No vino")

        self.assertEqual(self.client.patch(f"/api/turnos/{turno.id}/", {"notas": "x"}, format="json").status_code, 400)
        self.assertEqual(self.client.post(f"/api/turnos/{turno.id}/reprogramar/", {"inicio": self.inicio.isoformat()}, format="json").status_code, 400)
        self.assertEqual(self.client.post(f"/api/turnos/{turno.id}/confirmar/").status_code, 400)
        self.assertEqual(self.client.post(f"/api/turnos/{turno.id}/cancelar/").status_code, 400)
        self.assertEqual(self.client.post(f"/api/turnos/{turno.id}/realizar/").status_code, 400)

    def test_no_vino_requiere_turno_iniciado_y_mantiene_aislamiento(self):
        turno_futuro = self.crear_turno()
        futuro = self.client.post(f"/api/turnos/{turno_futuro['id']}/no-vino/")
        self.assertEqual(futuro.status_code, 400)
        self.assertEqual(futuro.data["detail"], "No podés marcar como no vino un turno que todavía no comenzó.")

        turno_ajeno = self.crear_turno_pasado(propietaria=self.otro_usuario)
        self.assertEqual(self.client.post(f"/api/turnos/{turno_ajeno.id}/no-vino/").status_code, 404)

    def test_reprogramar_solo_cambia_horario_y_controla_superposicion(self):
        turno = self.crear_turno(notas="No modificar")
        otra_clienta = Clienta.objects.create(propietaria=self.usuario, nombre="Bea")
        otro_servicio = Servicio.objects.create(
            propietaria=self.usuario,
            nombre="Esmaltado",
            duracion_minutos=30,
            precio="50.00",
        )

        nueva_fecha = self.inicio + timedelta(hours=2)
        reprogramado = self.client.post(
            f"/api/turnos/{turno['id']}/reprogramar/",
            {
                "inicio": nueva_fecha.isoformat(),
                "clienta_id": otra_clienta.id,
                "servicios_ids": [otro_servicio.id],
                "notas": "No debería cambiar",
            },
            format="json",
        )
        self.assertEqual(reprogramado.status_code, 200)
        self.assertEqual(reprogramado.data["estado"], Turno.Estado.REPROGRAMADO)
        self.assertEqual(reprogramado.data["clienta"]["id"], self.clienta.id)
        self.assertEqual(reprogramado.data["servicios"][0]["servicio_id"], self.servicio.id)
        self.assertEqual(reprogramado.data["notas"], "No modificar")

        conflicto = self.client.post(
            "/api/turnos/",
            self.datos_turno(inicio=(nueva_fecha + timedelta(minutes=30)).isoformat()),
            format="json",
        )
        self.assertEqual(conflicto.status_code, 400)
        self.assertIn("inicio", conflicto.data)

    def test_detalle_expone_cobro_activo_solo_para_turno_realizado(self):
        turno = self.crear_turno_pasado(estado=Turno.Estado.REALIZADO)

        sin_cobro = self.client.get(f"/api/turnos/{turno.id}/")
        self.assertIsNone(sin_cobro.data["cobro_activo"])
        self.assertTrue(sin_cobro.data["puede_registrar_cobro"])

        cobro = Cobro.objects.create(
            propietaria=self.usuario,
            turno=turno,
            importe="100.00",
            clienta_nombre_historica="Ana",
            metodo_pago=Cobro.MetodoPago.EFECTIVO,
        )
        con_cobro = self.client.get(f"/api/turnos/{turno.id}/")
        self.assertEqual(con_cobro.data["cobro_activo"]["id"], cobro.id)
        self.assertFalse(con_cobro.data["puede_registrar_cobro"])

        cobro.estado = Cobro.Estado.ANULADO
        cobro.anulado_en = timezone.now()
        cobro.motivo_anulacion = "Error de carga"
        cobro.anulado_por = self.usuario
        cobro.save()
        luego_de_anular = self.client.get(f"/api/turnos/{turno.id}/")
        self.assertIsNone(luego_de_anular.data["cobro_activo"])
        self.assertTrue(luego_de_anular.data["puede_registrar_cobro"])

    def test_agenda_diaria_ordena_y_expone_snapshots_historicos(self):
        tarde = self.crear_turno(inicio=(self.inicio + timedelta(hours=2)).isoformat())
        manana = self.crear_turno()
        fuera_del_dia = self.crear_turno(inicio=(self.inicio + timedelta(days=1)).isoformat())

        response = self.client.get("/api/turnos/agenda/", {"fecha": self.inicio.date().isoformat()})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["modo"], "dia")
        self.assertEqual(
            [turno["id"] for turno in response.data["turnos"]],
            [manana["id"], tarde["id"]],
        )
        self.assertNotIn(fuera_del_dia["id"], [turno["id"] for turno in response.data["turnos"]])
        turno = response.data["turnos"][0]
        self.assertEqual(turno["duracion_total_minutos"], 60)
        self.assertEqual(turno["precio_estimado"], "100.00")
        self.assertEqual(turno["servicios"][0]["nombre"], "Kapping")
        self.assertEqual(turno["clienta"]["id"], self.clienta.id)
        self.assertEqual(turno["fin"], (self.inicio + timedelta(hours=1)).isoformat().replace("+00:00", "Z"))

    def test_agenda_semanal_usa_lunes_a_domingo_y_aisla_propietaria(self):
        lunes = timezone.localdate() + timedelta(days=14)
        lunes -= timedelta(days=lunes.weekday())
        inicio_lunes = timezone.make_aware(datetime.combine(lunes, time(10)))
        inicio_domingo = timezone.make_aware(datetime.combine(lunes + timedelta(days=6), time(16)))
        turno_lunes = self.crear_turno(inicio=inicio_lunes.isoformat())
        turno_domingo = self.crear_turno(inicio=inicio_domingo.isoformat())
        fuera = self.crear_turno(inicio=(inicio_domingo + timedelta(days=1)).isoformat())
        ajeno = Turno.objects.create(
            propietaria=self.otro_usuario,
            clienta=Clienta.objects.create(propietaria=self.otro_usuario, nombre="Bea"),
            inicio=inicio_lunes + timedelta(hours=1),
            fin=inicio_lunes + timedelta(hours=2),
            duracion_total_minutos=60,
            precio_estimado="100.00",
        )

        response = self.client.get("/api/turnos/agenda/", {"semana": (lunes + timedelta(days=3)).isoformat()})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["modo"], "semana")
        self.assertEqual(str(response.data["desde"]), lunes.isoformat())
        self.assertEqual(str(response.data["hasta"]), (lunes + timedelta(days=6)).isoformat())
        ids = [turno["id"] for turno in response.data["turnos"]]
        self.assertEqual(ids, [turno_lunes["id"], turno_domingo["id"]])
        self.assertNotIn(fuera["id"], ids)
        self.assertNotIn(ajeno.id, ids)

    def test_agenda_combina_filtros_y_no_expone_clienta_ajena(self):
        confirmado = self.crear_turno()
        self.client.post(f"/api/turnos/{confirmado['id']}/confirmar/")
        otra_clienta = Clienta.objects.create(propietaria=self.usuario, nombre="Beatriz")
        self.crear_turno(
            clienta_id=otra_clienta.id,
            inicio=(self.inicio + timedelta(hours=2)).isoformat(),
        )
        clienta_ajena = Clienta.objects.create(propietaria=self.otro_usuario, nombre="Clara")

        response = self.client.get(
            "/api/turnos/agenda/",
            {
                "fecha": self.inicio.date().isoformat(),
                "estado": "confirmado",
                "clienta_id": self.clienta.id,
                "search": "anA",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual([turno["id"] for turno in response.data["turnos"]], [confirmado["id"]])
        self.assertEqual(
            self.client.get(
                "/api/turnos/agenda/",
                {"fecha": self.inicio.date().isoformat(), "clienta_id": clienta_ajena.id},
            ).status_code,
            404,
        )

    def test_agenda_valida_fechas_y_requiere_autenticacion(self):
        self.assertEqual(self.client.get("/api/turnos/agenda/", {"fecha": "invalida"}).status_code, 400)
        self.assertEqual(
            self.client.get(
                "/api/turnos/agenda/",
                {"desde": "2026-06-10", "hasta": "2026-06-09"},
            ).status_code,
            400,
        )
        self.assertEqual(
            self.client.get(
                "/api/turnos/agenda/",
                {"desde": "2026-06-01", "hasta": "2026-06-08"},
            ).status_code,
            400,
        )
        self.client.force_authenticate(None)
        self.assertEqual(
            self.client.get("/api/turnos/agenda/", {"fecha": self.inicio.date().isoformat()}).status_code,
            401,
        )

    def test_agenda_permite_consultar_dias_pasados_y_rangos_validos(self):
        fecha_pasada = timezone.localdate() - timedelta(days=1)
        inicio_pasado = timezone.make_aware(datetime.combine(fecha_pasada, time(10)))
        turno_pasado = Turno.objects.create(
            propietaria=self.usuario,
            clienta=self.clienta,
            inicio=inicio_pasado,
            fin=inicio_pasado + timedelta(minutes=60),
            duracion_total_minutos=60,
            precio_estimado="100.00",
        )

        pasado = self.client.get("/api/turnos/agenda/", {"fecha": fecha_pasada.isoformat()})
        rango = self.client.get(
            "/api/turnos/agenda/",
            {"desde": self.inicio.date().isoformat(), "hasta": self.inicio.date().isoformat()},
        )

        self.assertEqual([turno["id"] for turno in pasado.data["turnos"]], [turno_pasado.id])
        self.assertEqual(rango.status_code, 200)
        self.assertEqual(rango.data["modo"], "rango")
