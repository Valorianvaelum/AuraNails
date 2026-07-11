from rest_framework import serializers

from .models import Cobro
from .services import crear_cobro


class CobroSerializer(serializers.ModelSerializer):
    turno_id = serializers.IntegerField(write_only=True, required=True)
    turno = serializers.SerializerMethodField(read_only=True)
    servicios = serializers.SerializerMethodField(read_only=True)
    puede_anularse = serializers.SerializerMethodField(read_only=True)
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)
    metodo_pago_display = serializers.CharField(source="get_metodo_pago_display", read_only=True)

    class Meta:
        model = Cobro
        fields = (
            "id",
            "turno_id",
            "turno",
            "clienta_nombre_historica",
            "servicios",
            "importe",
            "metodo_pago",
            "metodo_pago_display",
            "detalle_metodo",
            "estado",
            "estado_display",
            "puede_anularse",
            "creado_en",
            "actualizado_en",
            "anulado_en",
            "motivo_anulacion",
        )
        read_only_fields = (
            "id",
            "turno",
            "clienta_nombre_historica",
            "servicios",
            "importe",
            "estado",
            "estado_display",
            "puede_anularse",
            "creado_en",
            "actualizado_en",
            "anulado_en",
            "motivo_anulacion",
        )

    def validate_detalle_metodo(self, value):
        return value.strip()

    def validate(self, attrs):
        if attrs.get("metodo_pago") == Cobro.MetodoPago.OTRO and not attrs.get("detalle_metodo", "").strip():
            raise serializers.ValidationError({"detalle_metodo": "Ingresá un detalle para el método de pago Otro."})
        return attrs

    def create(self, validated_data):
        turno_id = validated_data.pop("turno_id")
        return crear_cobro(
            propietaria=self.context["request"].user,
            turno_id=turno_id,
            **validated_data,
        )

    def get_turno(self, cobro):
        turno = cobro.turno
        return {
            "id": turno.id,
            "inicio": turno.inicio,
            "fin": turno.fin,
            "duracion_total_minutos": turno.duracion_total_minutos,
            "precio_estimado": str(turno.precio_estimado),
        }

    def get_servicios(self, cobro):
        return [
            {
                "servicio_id": turno_servicio.servicio_id,
                "nombre": turno_servicio.nombre_servicio,
                "duracion_minutos": turno_servicio.duracion_minutos,
                "precio": str(turno_servicio.precio),
            }
            for turno_servicio in cobro.turno.turno_servicios.all()
        ]

    def get_puede_anularse(self, cobro):
        return cobro.estado == Cobro.Estado.REGISTRADO


class AnularCobroSerializer(serializers.Serializer):
    motivo = serializers.CharField(max_length=1000)

    def validate_motivo(self, value):
        motivo = value.strip()
        if not motivo:
            raise serializers.ValidationError("Ingresá el motivo de anulación.")
        return motivo
