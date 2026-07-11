from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase


Usuario = get_user_model()


class UsuarioModelTests(TestCase):
    def test_crea_usuario_normal_con_email_normalizado(self):
        usuario = Usuario.objects.create_user(
            email="MANICURA@EXAMPLE.COM",
            password="clave-segura-123",
            nombre="Lucía",
        )

        self.assertEqual(usuario.email, "MANICURA@example.com")
        self.assertFalse(usuario.is_staff)
        self.assertTrue(usuario.check_password("clave-segura-123"))

    def test_crea_superusuario(self):
        usuario = Usuario.objects.create_superuser(
            email="admin@example.com", password="clave-segura-123"
        )

        self.assertTrue(usuario.is_staff)
        self.assertTrue(usuario.is_superuser)

    def test_email_es_obligatorio(self):
        with self.assertRaisesMessage(ValueError, "correo electrónico es obligatorio"):
            Usuario.objects.create_user(email="", password="clave-segura-123")

    def test_email_es_unico(self):
        Usuario.objects.create_user(email="unica@example.com", password="clave-segura-123")

        with self.assertRaises(IntegrityError):
            Usuario.objects.create_user(email="unica@example.com", password="otra-clave-123")
