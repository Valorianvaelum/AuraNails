from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from aplicaciones.turnos.models import Turno
from aplicaciones.caja.models import Caja

from .models import Cobro


def crear_cobro(*, propietaria, turno_id, metodo_pago, detalle_metodo=""):
    with transaction.atomic():
        turno = (
            Turno.objects.select_for_update()
            .select_related("clienta")
            .filter(pk=turno_id, propietaria=propietaria)
            .first()
        )
        if not turno:
            raise NotFound("No encontramos este turno.")
        if turno.estado != Turno.Estado.REALIZADO:
            raise ValidationError({"turno_id": "Solo se pueden cobrar turnos realizados."})
        if turno.precio_estimado <= 0:
            raise ValidationError({"turno_id": "El importe histórico del turno no es válido."})
        if Cobro.objects.filter(turno=turno, estado=Cobro.Estado.REGISTRADO).exists():
            raise ValidationError({"turno_id": "Este turno ya tiene un cobro activo."})
        caja = (
            Caja.objects.select_for_update()
            .filter(propietaria=propietaria, estado=Caja.Estado.ABIERTA)
            .first()
        )
        if not caja:
            raise ValidationError({"detail": "Debés abrir la caja antes de registrar un cobro."})

        try:
            cobro = Cobro.objects.create(
                propietaria=propietaria,
                turno=turno,
                caja=caja,
                importe=turno.precio_estimado,
                clienta_nombre_historica=str(turno.clienta),
                metodo_pago=metodo_pago,
                detalle_metodo=detalle_metodo.strip(),
            )
        except IntegrityError as error:
            raise ValidationError({"turno_id": "Este turno ya tiene un cobro activo."}) from error

    return cobro


def anular_cobro(*, propietaria, cobro_id, motivo):
    with transaction.atomic():
        cobro = (
            Cobro.objects.select_for_update()
            .select_related("turno", "turno__clienta")
            .filter(pk=cobro_id, propietaria=propietaria)
            .first()
        )
        if not cobro:
            raise NotFound("No encontramos este cobro.")
        if cobro.estado != Cobro.Estado.REGISTRADO:
            raise ValidationError({"detail": "Este cobro ya fue anulado."})

        cobro.estado = Cobro.Estado.ANULADO
        cobro.motivo_anulacion = motivo.strip()
        cobro.anulado_en = timezone.now()
        cobro.anulado_por = propietaria
        cobro.full_clean()
        cobro.save()

    return cobro
