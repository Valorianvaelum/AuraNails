from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from aplicaciones.servicios.models import Servicio


Usuario = get_user_model()


class ServiciosApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = Usuario.objects.create_user(email="luz@example.com", password="Clave-segura-123")
        self.other = Usuario.objects.create_user(email="ana@example.com", password="Clave-segura-123")
        self.servicio = Servicio.objects.create(propietaria=self.user, nombre="Soft gel", descripcion="Servicio completo", duracion_minutos=90, precio="15000.00", orden=10)
        self.client.force_authenticate(self.user)

    def test_crea_y_asigna_propietaria(self):
        response = self.client.post("/api/servicios/", {"nombre": "  Kapping ", "duracion_minutos": 60, "precio": "12000.00", "propietaria": self.other.id}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Servicio.objects.get(pk=response.data["id"]).propietaria, self.user)

    def test_sin_autenticacion_y_delete_bloqueados(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.post("/api/servicios/", {}, format="json").status_code, 401)
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.delete(f"/api/servicios/{self.servicio.id}/").status_code, 405)

    def test_aislamiento_en_lista_detalle_y_edicion(self):
        ajeno = Servicio.objects.create(propietaria=self.other, nombre="Ajeno", duracion_minutos=30, precio="1.00")
        self.assertEqual([item["id"] for item in self.client.get("/api/servicios/?estado=todos").data], [self.servicio.id])
        self.assertEqual(self.client.get(f"/api/servicios/{ajeno.id}/").status_code, 404)
        self.assertEqual(self.client.patch(f"/api/servicios/{ajeno.id}/", {"nombre": "Cambio"}, format="json").status_code, 404)

    def test_edita_y_pausa_reactiva(self):
        self.assertEqual(self.client.patch(f"/api/servicios/{self.servicio.id}/", {"nombre": "Soft gel premium"}, format="json").status_code, 200)
        self.assertEqual(self.client.post(f"/api/servicios/{self.servicio.id}/pausar/").status_code, 200)
        self.assertEqual(self.client.post(f"/api/servicios/{self.servicio.id}/reactivar/").status_code, 200)

    def test_acciones_ajenas_dan_404(self):
        ajeno = Servicio.objects.create(propietaria=self.other, nombre="Ajeno", duracion_minutos=30, precio="1.00")
        self.assertEqual(self.client.post(f"/api/servicios/{ajeno.id}/pausar/").status_code, 404)
        self.assertEqual(self.client.post(f"/api/servicios/{ajeno.id}/reactivar/").status_code, 404)

    def test_validaciones(self):
        casos = [
            ({}, "nombre"), ({"nombre": "  ", "duracion_minutos": 1, "precio": "1"}, "nombre"),
            ({"nombre": "A", "duracion_minutos": 0, "precio": "1"}, "duracion_minutos"),
            ({"nombre": "A", "duracion_minutos": -1, "precio": "1"}, "duracion_minutos"),
            ({"nombre": "A", "duracion_minutos": 721, "precio": "1"}, "duracion_minutos"),
            ({"nombre": "A", "duracion_minutos": 1, "precio": "-1"}, "precio"),
            ({"nombre": "A", "duracion_minutos": 1, "precio": "1", "orden": -1}, "orden"),
        ]
        for payload, field in casos:
            response = self.client.post("/api/servicios/", payload, format="json")
            self.assertEqual(response.status_code, 400)
            self.assertIn(field, response.data)

    def test_busqueda_filtros_orden_y_regresiones(self):
        pausado = Servicio.objects.create(propietaria=self.user, nombre="Manicura", descripcion="Nail art", duracion_minutos=45, precio="10000", activo=False, orden=0)
        self.assertEqual([x["id"] for x in self.client.get("/api/servicios/?search=soft").data], [self.servicio.id])
        self.assertEqual([x["id"] for x in self.client.get("/api/servicios/?search=nail&estado=todos").data], [pausado.id])
        self.assertEqual([x["id"] for x in self.client.get("/api/servicios/?estado=pausados").data], [pausado.id])
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get("/api/health/").status_code, 200)
        self.assertEqual(self.client.post("/api/auth/login/", {"email": self.user.email, "password": "Clave-segura-123"}, format="json").status_code, 200)
