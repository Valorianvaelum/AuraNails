import logging
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import password_validation
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Usuario


logger = logging.getLogger(__name__)

PASSWORD_RESET_REQUEST_MESSAGE = (
    "Si existe una cuenta asociada a ese correo, recibirás instrucciones para restablecer la contraseña."
)
PASSWORD_RESET_CONFIRM_MESSAGE = (
    "La contraseña fue actualizada. Ya podés iniciar sesión con la nueva contraseña."
)
INVALID_RESET_LINK_MESSAGE = (
    "El enlace de recuperación no es válido o ya venció. Solicitá uno nuevo."
)


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ("id", "email", "nombre", "apellido", "telefono")
        read_only_fields = fields


class LoginSerializer(TokenObtainPairSerializer):
    default_error_messages = {
        "no_active_account": "No se pudo iniciar sesión con los datos proporcionados.",
    }

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UsuarioSerializer(self.user).data
        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def save(self, **kwargs):
        email = self.validated_data["email"].strip()
        user = (
            Usuario.objects.filter(email__iexact=email, is_active=True)
            .only("id", "email", "password")
            .first()
        )

        if user is None or not user.has_usable_password():
            return None

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        query = urlencode({"uid": uid, "token": token})
        reset_url = (
            f"{settings.AURANAILS_FRONTEND_URL.rstrip('/')}/restablecer-contrasena?{query}"
        )

        message = (
            "Recibimos una solicitud para restablecer la contraseña de tu cuenta de AuraNails.\n\n"
            f"Abrí este enlace para elegir una nueva contraseña:\n{reset_url}\n\n"
            "El enlace vence y solo puede utilizarse una vez. "
            "Si no solicitaste este cambio, ignorá este correo."
        )

        try:
            send_mail(
                subject="Restablecer contraseña de AuraNails",
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception:
            logger.exception("No se pudo enviar un correo de recuperación de contraseña.")

        return user


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(write_only=True)
    token = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password_confirm = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "Las contraseñas no coinciden."}
            )

        try:
            user_id = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = Usuario.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, UnicodeDecodeError, Usuario.DoesNotExist):
            raise serializers.ValidationError({"token": INVALID_RESET_LINK_MESSAGE}) from None

        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError({"token": INVALID_RESET_LINK_MESSAGE})

        try:
            password_validation.validate_password(attrs["new_password"], user=user)
        except DjangoValidationError as error:
            raise serializers.ValidationError(
                {"new_password": list(error.messages)}
            ) from error

        attrs["user"] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user
