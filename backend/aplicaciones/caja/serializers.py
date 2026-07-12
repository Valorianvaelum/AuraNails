from rest_framework import serializers

from aplicaciones.cobros.models import Cobro

from .models import Caja, GastoCaja, MovimientoCaja
from .services import abrir_caja, resumen_caja


class CajaSerializer(serializers.ModelSerializer):
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)
    puede_cerrarse = serializers.SerializerMethodField(read_only=True)
    resumen = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Caja
        fields = (
            "id",
            "saldo_inicial",
            "observacion_apertura",
            "estado",
            "estado_display",
            "abierta_en",
            "cerrada_en",
            "saldo_contado",
            "saldo_teorico_cierre",
            "diferencia",
            "observacion_cierre",
            "resumen",
            "puede_cerrarse",
        )
        read_only_fields = (
            "id",
            "estado",
            "estado_display",
            "abierta_en",
            "cerrada_en",
            "saldo_contado",
            "saldo_teorico_cierre",
            "diferencia",
            "observacion_cierre",
            "resumen",
            "puede_cerrarse",
        )

    def validate_saldo_inicial(self, value):
        if value < 0:
            raise serializers.ValidationError("El saldo inicial no puede ser negativo.")
        return value

    def validate_observacion_apertura(self, value):
        return value.strip()

    def create(self, validated_data):
        return abrir_caja(propietaria=self.context["request"].user, **validated_data)

    def get_puede_cerrarse(self, caja):
        return caja.estado == Caja.Estado.ABIERTA

    def get_resumen(self, caja):
        return resumen_caja(caja)


class CerrarCajaSerializer(serializers.Serializer):
    saldo_contado = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    observacion_cierre = serializers.CharField(required=False, allow_blank=True, max_length=1000)

    def validate_observacion_cierre(self, value):
        return value.strip()


class GastoCajaSerializer(serializers.ModelSerializer):
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)
    metodo_pago_display = serializers.CharField(source="get_metodo_pago_display", read_only=True)
    puede_anularse = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = GastoCaja
        fields = (
            "id",
            "concepto",
            "importe",
            "metodo_pago",
            "metodo_pago_display",
            "observacion",
            "estado",
            "estado_display",
            "registrado_en",
            "anulado_en",
            "motivo_anulacion",
            "puede_anularse",
        )
        read_only_fields = (
            "id",
            "estado",
            "estado_display",
            "registrado_en",
            "anulado_en",
            "motivo_anulacion",
            "puede_anularse",
        )

    def validate_concepto(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Ingresá el concepto del gasto.")
        return value

    def validate_observacion(self, value):
        return value.strip()

    def validate(self, attrs):
        if attrs.get("metodo_pago") == Cobro.MetodoPago.OTRO and not attrs.get("observacion", "").strip():
            raise serializers.ValidationError({"observacion": "Ingresá una observación para el método de pago Otro."})
        return attrs

    def get_puede_anularse(self, gasto):
        return gasto.estado == GastoCaja.Estado.REGISTRADO and gasto.caja.estado == Caja.Estado.ABIERTA


class MovimientoCajaSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source="get_tipo_display", read_only=True)
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)
    puede_anularse = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = MovimientoCaja
        fields = (
            "id",
            "tipo",
            "tipo_display",
            "importe",
            "motivo",
            "estado",
            "estado_display",
            "registrado_en",
            "anulado_en",
            "motivo_anulacion",
            "puede_anularse",
        )
        read_only_fields = (
            "id",
            "tipo",
            "tipo_display",
            "estado",
            "estado_display",
            "registrado_en",
            "anulado_en",
            "motivo_anulacion",
            "puede_anularse",
        )

    def validate_motivo(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Ingresá el motivo del movimiento.")
        return value

    def get_puede_anularse(self, movimiento):
        return movimiento.estado == MovimientoCaja.Estado.REGISTRADO and movimiento.caja.estado == Caja.Estado.ABIERTA


class AnularRegistroSerializer(serializers.Serializer):
    motivo = serializers.CharField(max_length=1000)

    def validate_motivo(self, value):
        motivo = value.strip()
        if not motivo:
            raise serializers.ValidationError("Ingresá el motivo de anulación.")
        return motivo
