from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Usuario


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
