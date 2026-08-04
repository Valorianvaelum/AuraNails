from urllib.parse import parse_qs, urlparse

from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Usuario
from .serializers import (
    PASSWORD_RESET_CONFIRM_MESSAGE,
    PASSWORD_RESET_REQUEST_MESSAGE,
)


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    AURANAILS_FRONTEND_URL="http://localhost:5174",
)
class PasswordResetTests(APITestCase):
    email = "duena@auranails.test"
    initial_password = "Clave-Inicial-2026!"
    new_password = "Nueva-Clave-2026!"

    def setUp(self):
        cache.clear()
        self.user = Usuario.objects.create_user(
            email=self.email,
            password=self.initial_password,
            nombre="Aura",
        )

    def request_reset(self, email=None):
        return self.client.post(
            reverse("auth-password-reset-request"),
            {"email": email or self.email},
            format="json",
        )

    def reset_credentials_from_email(self):
        message = mail.outbox[-1].body
        reset_url = next(
            line.strip() for line in message.splitlines() if line.startswith("http")
        )
        query = parse_qs(urlparse(reset_url).query)
        return query["uid"][0], query["token"][0]

    def confirm_reset(self, uid, token, password=None, confirmation=None):
        selected_password = password or self.new_password
        return self.client.post(
            reverse("auth-password-reset-confirm"),
            {
                "uid": uid,
                "token": token,
                "new_password": selected_password,
                "new_password_confirm": confirmation or selected_password,
            },
            format="json",
        )

    def test_request_sends_email_for_active_account(self):
        response = self.request_reset()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"detail": PASSWORD_RESET_REQUEST_MESSAGE})
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.email])
        self.assertIn("/restablecer-contrasena?", mail.outbox[0].body)

    def test_request_does_not_reveal_unknown_account(self):
        response = self.request_reset("desconocida@auranails.test")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"detail": PASSWORD_RESET_REQUEST_MESSAGE})
        self.assertEqual(len(mail.outbox), 0)

    def test_confirm_changes_password_and_consumes_token(self):
        self.request_reset()
        uid, token = self.reset_credentials_from_email()

        response = self.confirm_reset(uid, token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"detail": PASSWORD_RESET_CONFIRM_MESSAGE})
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.new_password))

        reused_response = self.confirm_reset(uid, token)
        self.assertEqual(reused_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_confirm_rejects_mismatched_passwords(self):
        self.request_reset()
        uid, token = self.reset_credentials_from_email()

        response = self.confirm_reset(
            uid,
            token,
            password=self.new_password,
            confirmation="Otra-Clave-2026!",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("new_password_confirm", response.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.initial_password))

    def test_confirm_applies_django_password_validators(self):
        self.request_reset()
        uid, token = self.reset_credentials_from_email()

        response = self.confirm_reset(uid, token, password="12345678")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("new_password", response.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.initial_password))

    def test_password_change_revokes_existing_access_token(self):
        login_response = self.client.post(
            reverse("auth-login"),
            {"email": self.email, "password": self.initial_password},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        old_access_token = login_response.data["access"]

        self.request_reset()
        uid, token = self.reset_credentials_from_email()
        reset_response = self.confirm_reset(uid, token)
        self.assertEqual(reset_response.status_code, status.HTTP_200_OK)

        me_response = self.client.get(
            reverse("auth-me"),
            HTTP_AUTHORIZATION=f"Bearer {old_access_token}",
        )
        self.assertEqual(me_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_request_endpoint_is_rate_limited_by_ip(self):
        for index in range(5):
            response = self.request_reset(f"unknown-{index}@auranails.test")
            self.assertEqual(response.status_code, status.HTTP_200_OK)

        blocked_response = self.request_reset("blocked@auranails.test")
        self.assertEqual(
            blocked_response.status_code,
            status.HTTP_429_TOO_MANY_REQUESTS,
        )
