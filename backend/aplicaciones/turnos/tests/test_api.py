from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from aplicaciones.clientas.models import Clienta
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
        self.inicio = timezone.now() + timedelta(days=1)

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
        self.crear_turno(inicio=(self.inicio + timedelta(days=1)).isoformat())

        fecha = self.inicio.date().isoformat()
        por_fecha = self.client.get("/api/turnos/", {"fecha": fecha})
        self.assertEqual(por_fecha.status_code, 200)
        self.assertEqual(len(por_fecha.data), 1)

        por_estado = self.client.get("/api/turnos/", {"estado": "confirmado"})
        self.assertEqual([turno["id"] for turno in por_estado.data], [primer_turno["id"]])

        por_busqueda = self.client.get("/api/turnos/", {"search": "1111"})
        self.assertEqual(len(por_busqueda.data), 2)

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
