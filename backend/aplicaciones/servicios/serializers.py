from decimal import Decimal

from rest_framework import serializers

from .models import Servicio


class ServicioSerializer(serializers.ModelSerializer):
    duracion_legible = serializers.SerializerMethodField(read_only=True)
    nombre = serializers.CharField(max_length=120, error_messages={"required": "Ingresá el nombre del servicio.", "blank": "Ingresá el nombre del servicio."})
    duracion_minutos = serializers.IntegerField(error_messages={"required": "Ingresá la duración estimada."})
    precio = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.01"), error_messages={"required": "Ingresá un precio válido.", "min_value": "Ingresá un precio válido."})
    orden = serializers.IntegerField(required=False, min_value=0)

    class Meta:
        model = Servicio
        fields = ("id", "nombre", "descripcion", "duracion_minutos", "duracion_legible", "precio", "activo", "orden", "creado_en", "actualizado_en")
        read_only_fields = ("id", "duracion_legible", "activo", "creado_en", "actualizado_en")

    def get_duracion_legible(self, obj):
        horas, minutos = divmod(obj.duracion_minutos, 60)
        if not horas:
            return f"{minutos} min"
        if not minutos:
            return f"{horas} h"
        return f"{horas} h {minutos} min"

    def validate_nombre(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Ingresá el nombre del servicio.")
        return value

    def validate_descripcion(self, value):
        return value.strip()

    def validate_duracion_minutos(self, value):
        if value <= 0:
            raise serializers.ValidationError("La duración debe ser mayor que cero.")
        if value > 720:
            raise serializers.ValidationError("La duración no puede superar los 720 minutos.")
        return value
