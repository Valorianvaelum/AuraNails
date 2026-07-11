from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient


Usuario = get_user_model()


class AutenticacionApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.password = "Clave-segura-123"
        self.usuario = Usuario.objects.create_user(
            email="luz@example.com",
            password=self.password,
            nombre="Luz",
            apellido="Gómez",
            telefono="3415551234",
        )

    def test_login_correcto_devuelve_tokens_y_usuario_publico(self):
        response = self.client.post(
            "/api/auth/login/", {"email": self.usuario.email, "password": self.password}, format="json"
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], self.usuario.email)
        self.assertNotIn("password", response.data["user"])

    def test_login_con_credenciales_invalidas_no_expone_detalles(self):
        response = self.client.post(
            "/api/auth/login/", {"email": self.usuario.email, "password": "incorrecta"}, format="json"
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.data["detail"], "No se pudo iniciar sesión con los datos proporcionados.")

    def test_me_autenticado_devuelve_usuario(self):
        login = self.client.post(
            "/api/auth/login/", {"email": self.usuario.email, "password": self.password}, format="json"
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

        response = self.client.get("/api/auth/me/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["nombre"], "Luz")

    def test_me_sin_autenticacion_devuelve_401(self):
        response = self.client.get("/api/auth/me/")

        self.assertEqual(response.status_code, 401)

    def test_refresh_devuelve_un_nuevo_access_token(self):
        login = self.client.post(
            "/api/auth/login/", {"email": self.usuario.email, "password": self.password}, format="json"
        )

        response = self.client.post("/api/auth/refresh/", {"refresh": login.data["refresh"]}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)

    def test_salud_permanece_publica(self):
        response = self.client.get("/api/health/")

        self.assertEqual(response.status_code, 200)
