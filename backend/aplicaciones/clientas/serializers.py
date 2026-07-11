from django.utils import timezone
from rest_framework import serializers

from .models import Clienta


class ClientaSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField(read_only=True)
    nombre = serializers.CharField(
        max_length=120,
        error_messages={
            "required": "Ingresá el nombre de la clienta.",
            "blank": "Ingresá el nombre de la clienta.",
        },
    )
    email = serializers.EmailField(required=False, allow_blank=True)

    class Meta:
        model = Clienta
        fields = (
            "id",
            "nombre",
            "apellido",
            "nombre_completo",
            "telefono",
            "email",
            "fecha_nacimiento",
            "color_favorito",
            "estilo_favorito",
            "notas",
            "activa",
            "creada_en",
            "actualizada_en",
        )
        read_only_fields = ("id", "nombre_completo", "activa", "creada_en", "actualizada_en")

    def get_nombre_completo(self, obj):
        return str(obj)

    def validate_nombre(self, value):
        nombre = value.strip()
        if not nombre:
            raise serializers.ValidationError("Ingresá el nombre de la clienta.")
        return nombre

    def validate_apellido(self, value):
        return value.strip()

    def validate_telefono(self, value):
        return value.strip()

    def validate_email(self, value):
        return value.strip().lower()

    def validate_color_favorito(self, value):
        return value.strip()

    def validate_estilo_favorito(self, value):
        return value.strip()

    def validate_fecha_nacimiento(self, value):
        if value and value > timezone.localdate():
            raise serializers.ValidationError("La fecha de nacimiento no puede ser futura.")
        return value
