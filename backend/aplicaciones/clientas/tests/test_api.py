from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from aplicaciones.clientas.models import Clienta


Usuario = get_user_model()


class ClientasApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.propietaria = Usuario.objects.create_user(
            email="luz@example.com", password="Clave-segura-123", nombre="Luz"
        )
        self.otra_usuario = Usuario.objects.create_user(
            email="ana@example.com", password="Clave-segura-123", nombre="Ana"
        )
        self.clienta = Clienta.objects.create(
            propietaria=self.propietaria,
            nombre="María",
            apellido="López",
            telefono="+54 341 555 1234",
            email="maria@example.com",
        )
        self.client.force_authenticate(self.propietaria)

    def test_crea_clienta_asignando_la_propietaria_de_la_sesion(self):
        response = self.client.post(
            "/api/clientas/",
            {"nombre": "  Sofía  ", "email": "SOFIA@EXAMPLE.COM", "propietaria": self.otra_usuario.id},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        creada = Clienta.objects.get(pk=response.data["id"])
        self.assertEqual(creada.propietaria, self.propietaria)
        self.assertEqual(creada.nombre, "Sofía")
        self.assertEqual(creada.email, "sofia@example.com")
        self.assertNotIn("propietaria", response.data)

    def test_crear_sin_autenticacion_devuelve_401(self):
        self.client.force_authenticate(user=None)

        response = self.client.post("/api/clientas/", {"nombre": "Sofía"}, format="json")

        self.assertEqual(response.status_code, 401)

    def test_lista_solo_clientas_propias(self):
        Clienta.objects.create(propietaria=self.otra_usuario, nombre="Ajena")

        response = self.client.get("/api/clientas/?estado=todas")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data], [self.clienta.id])

    def test_detalle_ajeno_no_revela_el_registro(self):
        clienta_ajena = Clienta.objects.create(propietaria=self.otra_usuario, nombre="Ajena")

        response = self.client.get(f"/api/clientas/{clienta_ajena.id}/")

        self.assertEqual(response.status_code, 404)

    def test_detalle_propio(self):
        response = self.client.get(f"/api/clientas/{self.clienta.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["nombre_completo"], "María López")

    def test_edita_clienta_propia(self):
        response = self.client.patch(
            f"/api/clientas/{self.clienta.id}/", {"notas": "Prefiere uñas cortas."}, format="json"
        )

        self.assertEqual(response.status_code, 200)
        self.clienta.refresh_from_db()
        self.assertEqual(self.clienta.notas, "Prefiere uñas cortas.")

    def test_no_edita_clienta_ajena(self):
        clienta_ajena = Clienta.objects.create(propietaria=self.otra_usuario, nombre="Ajena")

        response = self.client.patch(f"/api/clientas/{clienta_ajena.id}/", {"nombre": "Cambio"}, format="json")

        self.assertEqual(response.status_code, 404)

    def test_desactiva_y_reactiva_clienta_propia(self):
        desactivar = self.client.post(f"/api/clientas/{self.clienta.id}/desactivar/")
        self.clienta.refresh_from_db()
        reactivar = self.client.post(f"/api/clientas/{self.clienta.id}/reactivar/")

        self.assertEqual(desactivar.status_code, 200)
        self.assertFalse(self.clienta.activa)
        self.assertEqual(reactivar.status_code, 200)
        self.assertTrue(reactivar.data["activa"])

    def test_no_desactiva_clienta_ajena(self):
        clienta_ajena = Clienta.objects.create(propietaria=self.otra_usuario, nombre="Ajena")

        response = self.client.post(f"/api/clientas/{clienta_ajena.id}/desactivar/")

        self.assertEqual(response.status_code, 404)

    def test_nombre_obligatorio_y_solo_espacios_es_invalido(self):
        sin_nombre = self.client.post("/api/clientas/", {}, format="json")
        solo_espacios = self.client.post("/api/clientas/", {"nombre": "   "}, format="json")

        self.assertEqual(sin_nombre.status_code, 400)
        self.assertEqual(solo_espacios.status_code, 400)
        self.assertIn("nombre", sin_nombre.data)

    def test_fecha_futura_e_email_invalido_son_rechazados(self):
        fecha_futura = self.client.post(
            "/api/clientas/",
            {"nombre": "Sofía", "fecha_nacimiento": timezone.localdate() + timedelta(days=1)},
            format="json",
        )
        email_invalido = self.client.post(
            "/api/clientas/", {"nombre": "Sofía", "email": "correo-invalido"}, format="json"
        )

        self.assertEqual(fecha_futura.status_code, 400)
        self.assertIn("fecha_nacimiento", fecha_futura.data)
        self.assertEqual(email_invalido.status_code, 400)
        self.assertIn("email", email_invalido.data)

    def test_email_es_opcional(self):
        response = self.client.post("/api/clientas/", {"nombre": "Sofía"}, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["email"], "")

    def test_busqueda_por_nombre_y_telefono(self):
        por_nombre = self.client.get("/api/clientas/?search=mar")
        por_telefono = self.client.get("/api/clientas/?search=555%201234")

        self.assertEqual([item["id"] for item in por_nombre.data], [self.clienta.id])
        self.assertEqual([item["id"] for item in por_telefono.data], [self.clienta.id])

    def test_filtro_de_activas_e_inactivas(self):
        inactiva = Clienta.objects.create(propietaria=self.propietaria, nombre="Inactiva", activa=False)

        activas = self.client.get("/api/clientas/")
        inactivas = self.client.get("/api/clientas/?estado=inactivas")
        todas = self.client.get("/api/clientas/?estado=todas")

        self.assertEqual([item["id"] for item in activas.data], [self.clienta.id])
        self.assertEqual([item["id"] for item in inactivas.data], [inactiva.id])
        self.assertEqual({item["id"] for item in todas.data}, {self.clienta.id, inactiva.id})

    def test_delete_no_esta_permitido(self):
        response = self.client.delete(f"/api/clientas/{self.clienta.id}/")

        self.assertEqual(response.status_code, 405)

    def test_autenticacion_y_salud_siguen_disponibles(self):
        self.client.force_authenticate(user=None)
        login = self.client.post(
            "/api/auth/login/", {"email": self.propietaria.email, "password": "Clave-segura-123"}, format="json"
        )
        salud = self.client.get("/api/health/")

        self.assertEqual(login.status_code, 200)
        self.assertEqual(salud.status_code, 200)
