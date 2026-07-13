from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from aplicaciones.clientas.models import Clienta
from aplicaciones.cobros.models import Cobro
from aplicaciones.servicios.models import Servicio

from .models import Turno, TurnoServicio


def duracion_legible(minutos):
    horas, minutos_restantes = divmod(minutos, 60)
    if not horas:
        return f"{minutos_restantes} min"
    if not minutos_restantes:
        return f"{horas} h"
    return f"{horas} h {minutos_restantes} min"


class TurnoSerializer(serializers.ModelSerializer):
    clienta_id = serializers.PrimaryKeyRelatedField(
        source="clienta",
        queryset=Clienta.objects.all(),
        write_only=True,
    )
    servicios_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        min_length=1,
    )
    servicios = serializers.SerializerMethodField()
    clienta = serializers.SerializerMethodField()
    duracion_legible = serializers.SerializerMethodField()
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)
    cobro_activo = serializers.SerializerMethodField()
    puede_registrar_cobro = serializers.SerializerMethodField()

    class Meta:
        model = Turno
        fields = (
            "id",
            "clienta",
            "clienta_id",
            "inicio",
            "fin",
            "estado",
            "estado_display",
            "cobro_activo",
            "puede_registrar_cobro",
            "servicios",
            "servicios_ids",
            "duracion_total_minutos",
            "duracion_legible",
            "precio_estimado",
            "notas",
            "creado_en",
            "actualizado_en",
        )
        read_only_fields = ("fin", "estado", "duracion_total_minutos", "precio_estimado")

    def get_clienta(self, turno):
        return {
            "id": turno.clienta_id,
            "nombre_completo": str(turno.clienta),
            "telefono": turno.clienta.telefono,
        }

    def get_servicios(self, turno):
        return [
            {
                "servicio_id": turno_servicio.servicio_id,
                "nombre": turno_servicio.nombre_servicio,
                "duracion_minutos": turno_servicio.duracion_minutos,
                "precio": str(turno_servicio.precio),
            }
            for turno_servicio in turno.turno_servicios.all()
        ]

    def get_duracion_legible(self, turno):
        return duracion_legible(turno.duracion_total_minutos)

    @staticmethod
    def _cobro_activo(turno):
        cobros_activos = getattr(turno, "cobros_activos", None)
        if cobros_activos is not None:
            return cobros_activos[0] if cobros_activos else None
        return turno.cobros.filter(estado=Cobro.Estado.REGISTRADO).first()

    def get_cobro_activo(self, turno):
        cobro = self._cobro_activo(turno)
        if not cobro:
            return None
        return {
            "id": cobro.id,
            "importe": str(cobro.importe),
            "creado_en": cobro.creado_en,
        }

    def get_puede_registrar_cobro(self, turno):
        return turno.estado == Turno.Estado.REALIZADO and not self._cobro_activo(turno)

    def validate(self, attrs):
        user = self.context["request"].user
        clienta = attrs.get("clienta", getattr(self.instance, "clienta", None))
        servicios_ids = attrs.get("servicios_ids")

        if clienta and (clienta.propietaria_id != user.id or (not clienta.activa and not self.instance)):
            raise serializers.ValidationError({"clienta_id": "Elegí una clienta activa propia."})

        if servicios_ids is not None:
            if len(set(servicios_ids)) != len(servicios_ids):
                raise serializers.ValidationError({"servicios_ids": "No repitas servicios."})

            servicios = list(Servicio.objects.filter(id__in=servicios_ids, propietaria=user))
            if len(servicios) != len(servicios_ids) or (
                not self.instance and any(not servicio.activo for servicio in servicios)
            ):
                raise serializers.ValidationError({"servicios_ids": "Elegí servicios activos propios."})
            attrs["_servicios"] = servicios

        return attrs

    def validate_inicio(self, value):
        if not self.instance and value < timezone.now():
            raise serializers.ValidationError("No podés crear un turno en el pasado.")
        return value

    @staticmethod
    def _totales(servicios):
        return (
            sum(servicio.duracion_minutos for servicio in servicios),
            sum((servicio.precio for servicio in servicios), Decimal("0")),
        )

    def _validar_superposicion(self, propietaria, inicio, fin):
        turnos = Turno.objects.filter(
            propietaria=propietaria,
            inicio__lt=fin,
            fin__gt=inicio,
        ).exclude(estado=Turno.Estado.CANCELADO)
        if self.instance:
            turnos = turnos.exclude(pk=self.instance.pk)
        if turnos.exists():
            raise serializers.ValidationError({"inicio": "Ese horario se superpone con otro turno."})

    @transaction.atomic
    def create(self, validated_data):
        servicios = validated_data.pop("_servicios")
        validated_data.pop("servicios_ids")
        duracion_total, precio_estimado = self._totales(servicios)
        inicio = validated_data["inicio"]
        fin = inicio + timedelta(minutes=duracion_total)
        self._validar_superposicion(self.context["request"].user, inicio, fin)

        turno = Turno.objects.create(
            propietaria=self.context["request"].user,
            fin=fin,
            duracion_total_minutos=duracion_total,
            precio_estimado=precio_estimado,
            **validated_data,
        )
        TurnoServicio.objects.bulk_create(
            [
                TurnoServicio(
                    turno=turno,
                    servicio=servicio,
                    nombre_servicio=servicio.nombre,
                    duracion_minutos=servicio.duracion_minutos,
                    precio=servicio.precio,
                    orden=orden,
                )
                for orden, servicio in enumerate(servicios)
            ]
        )
        return turno

    @transaction.atomic
    def update(self, turno, validated_data):
        if turno.estado in {Turno.Estado.CANCELADO, Turno.Estado.REALIZADO, Turno.Estado.NO_VINO}:
            raise serializers.ValidationError("Este turno ya no puede modificarse.")

        servicios = validated_data.pop("_servicios", None)
        validated_data.pop("servicios_ids", None)
        inicio = validated_data.get("inicio", turno.inicio)
        duracion_total, precio_estimado = (
            self._totales(servicios)
            if servicios is not None
            else (turno.duracion_total_minutos, turno.precio_estimado)
        )
        fin = inicio + timedelta(minutes=duracion_total)
        self._validar_superposicion(turno.propietaria, inicio, fin)

        for field, value in validated_data.items():
            setattr(turno, field, value)
        turno.fin = fin
        turno.duracion_total_minutos = duracion_total
        turno.precio_estimado = precio_estimado
        turno.save()

        if servicios is not None:
            turno.turno_servicios.all().delete()
            TurnoServicio.objects.bulk_create(
                [
                    TurnoServicio(
                        turno=turno,
                        servicio=servicio,
                        nombre_servicio=servicio.nombre,
                        duracion_minutos=servicio.duracion_minutos,
                        precio=servicio.precio,
                        orden=orden,
                    )
                    for orden, servicio in enumerate(servicios)
                ]
            )
        return turno


class ReprogramarTurnoSerializer(serializers.Serializer):
    inicio = serializers.DateTimeField()


class AgendaConsultaSerializer(serializers.Serializer):
    fecha = serializers.DateField(required=False)
    semana = serializers.DateField(required=False)
    desde = serializers.DateField(required=False)
    hasta = serializers.DateField(required=False)
    estado = serializers.CharField(required=False, trim_whitespace=True)
    clienta_id = serializers.IntegerField(required=False, min_value=1)
    search = serializers.CharField(required=False, trim_whitespace=True)

    def validate_estado(self, value):
        estados = [estado for estado in value.split(",") if estado]
        estados_validos = {estado for estado, _ in Turno.Estado.choices}
        if not estados or any(estado not in estados_validos for estado in estados):
            raise serializers.ValidationError("Indicá uno o más estados válidos.")
        return ",".join(estados)

    def validate(self, attrs):
        tiene_fecha = "fecha" in attrs
        tiene_semana = "semana" in attrs
        tiene_rango = "desde" in attrs or "hasta" in attrs

        if sum((tiene_fecha, tiene_semana, tiene_rango)) != 1:
            raise serializers.ValidationError(
                "Indicá fecha, semana o el rango desde y hasta."
            )

        if tiene_rango:
            if "desde" not in attrs or "hasta" not in attrs:
                raise serializers.ValidationError("El rango requiere desde y hasta.")
            if attrs["desde"] > attrs["hasta"]:
                raise serializers.ValidationError("La fecha desde no puede ser posterior a hasta.")
            if (attrs["hasta"] - attrs["desde"]).days > 6:
                raise serializers.ValidationError(
                    "La agenda admite rangos de hasta siete días."
                )

        return attrs
