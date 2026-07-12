from decimal import Decimal

from django.db import IntegrityError, transaction
from django.db.models import Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from aplicaciones.cobros.models import Cobro

from .models import Caja, GastoCaja, MovimientoCaja


CERO = Decimal("0.00")


def _total(queryset):
    return queryset.aggregate(total=Coalesce(Sum("importe"), CERO))["total"]


def _importe(value):
    return format(value, ".2f")


def _caja_abierta(*, propietaria, caja_id):
    caja = Caja.objects.select_for_update().filter(pk=caja_id, propietaria=propietaria).first()
    if not caja:
        raise NotFound("No encontramos esta caja.")
    if caja.estado != Caja.Estado.ABIERTA:
        raise ValidationError({"detail": "La caja ya está cerrada."})
    return caja


def abrir_caja(*, propietaria, saldo_inicial, observacion_apertura=""):
    with transaction.atomic():
        Caja.objects.select_for_update().filter(propietaria=propietaria, estado=Caja.Estado.ABIERTA).exists()
        if Caja.objects.filter(propietaria=propietaria, estado=Caja.Estado.ABIERTA).exists():
            raise ValidationError({"detail": "Ya tenés una caja abierta."})
        try:
            caja = Caja.objects.create(
                propietaria=propietaria,
                saldo_inicial=saldo_inicial,
                observacion_apertura=observacion_apertura.strip(),
            )
        except IntegrityError as error:
            raise ValidationError({"detail": "Ya tenés una caja abierta."}) from error
    return caja


def resumen_caja(caja):
    if caja.estado == Caja.Estado.CERRADA and caja.resumen_cierre:
        return caja.resumen_cierre

    cobros = Cobro.objects.filter(
        caja=caja,
        estado=Cobro.Estado.REGISTRADO,
    )
    cobros_por_metodo = {
        metodo: _total(cobros.filter(metodo_pago=metodo))
        for metodo, _label in Cobro.MetodoPago.choices
    }
    gastos = GastoCaja.objects.filter(caja=caja, estado=GastoCaja.Estado.REGISTRADO)
    gastos_por_metodo = {
        metodo: _total(gastos.filter(metodo_pago=metodo))
        for metodo, _label in Cobro.MetodoPago.choices
    }
    aportes = _total(
        MovimientoCaja.objects.filter(
            caja=caja,
            estado=MovimientoCaja.Estado.REGISTRADO,
            tipo=MovimientoCaja.Tipo.APORTE,
        )
    )
    retiros = _total(
        MovimientoCaja.objects.filter(
            caja=caja,
            estado=MovimientoCaja.Estado.REGISTRADO,
            tipo=MovimientoCaja.Tipo.RETIRO,
        )
    )
    saldo_teorico = (
        caja.saldo_inicial
        + cobros_por_metodo[Cobro.MetodoPago.EFECTIVO]
        + aportes
        - gastos_por_metodo[Cobro.MetodoPago.EFECTIVO]
        - retiros
    )
    return {
        "saldo_inicial": _importe(caja.saldo_inicial),
        "cobros_por_metodo": {metodo: _importe(total) for metodo, total in cobros_por_metodo.items()},
        "total_cobros": _importe(sum(cobros_por_metodo.values(), CERO)),
        "gastos_por_metodo": {metodo: _importe(total) for metodo, total in gastos_por_metodo.items()},
        "total_gastos": _importe(sum(gastos_por_metodo.values(), CERO)),
        "aportes": _importe(aportes),
        "retiros": _importe(retiros),
        "saldo_teorico": _importe(saldo_teorico),
    }


def cerrar_caja(*, propietaria, caja_id, saldo_contado, observacion_cierre=""):
    with transaction.atomic():
        caja = _caja_abierta(propietaria=propietaria, caja_id=caja_id)
        cerrada_en = timezone.now()
        resumen = resumen_caja(caja)
        saldo_teorico = Decimal(resumen["saldo_teorico"])
        diferencia = saldo_contado - saldo_teorico
        if diferencia != CERO and not observacion_cierre.strip():
            raise ValidationError({"observacion_cierre": "Ingresá una observación cuando existe diferencia."})
        caja.estado = Caja.Estado.CERRADA
        caja.cerrada_en = cerrada_en
        caja.saldo_contado = saldo_contado
        caja.saldo_teorico_cierre = saldo_teorico
        caja.diferencia = diferencia
        caja.observacion_cierre = observacion_cierre.strip()
        caja.resumen_cierre = resumen
        caja.cerrada_por = propietaria
        caja.full_clean()
        caja.save()
    return caja


def registrar_gasto(*, propietaria, caja_id, concepto, importe, metodo_pago, observacion=""):
    with transaction.atomic():
        caja = _caja_abierta(propietaria=propietaria, caja_id=caja_id)
        gasto = GastoCaja.objects.create(
            caja=caja,
            concepto=concepto.strip(),
            importe=importe,
            metodo_pago=metodo_pago,
            observacion=observacion.strip(),
        )
    return gasto


def registrar_movimiento(*, propietaria, caja_id, tipo, importe, motivo):
    with transaction.atomic():
        caja = _caja_abierta(propietaria=propietaria, caja_id=caja_id)
        movimiento = MovimientoCaja.objects.create(
            caja=caja,
            tipo=tipo,
            importe=importe,
            motivo=motivo.strip(),
        )
    return movimiento


def anular_gasto(*, propietaria, caja_id, gasto_id, motivo):
    with transaction.atomic():
        caja = _caja_abierta(propietaria=propietaria, caja_id=caja_id)
        gasto = GastoCaja.objects.select_for_update().filter(pk=gasto_id, caja=caja).first()
        if not gasto:
            raise NotFound("No encontramos este gasto.")
        if gasto.estado != GastoCaja.Estado.REGISTRADO:
            raise ValidationError({"detail": "Este gasto ya fue anulado."})
        gasto.estado = GastoCaja.Estado.ANULADO
        gasto.motivo_anulacion = motivo.strip()
        gasto.anulado_en = timezone.now()
        gasto.anulado_por = propietaria
        gasto.full_clean()
        gasto.save()
    return gasto


def anular_movimiento(*, propietaria, caja_id, movimiento_id, motivo):
    with transaction.atomic():
        caja = _caja_abierta(propietaria=propietaria, caja_id=caja_id)
        movimiento = MovimientoCaja.objects.select_for_update().filter(pk=movimiento_id, caja=caja).first()
        if not movimiento:
            raise NotFound("No encontramos este movimiento.")
        if movimiento.estado != MovimientoCaja.Estado.REGISTRADO:
            raise ValidationError({"detail": "Este movimiento ya fue anulado."})
        movimiento.estado = MovimientoCaja.Estado.ANULADO
        movimiento.motivo_anulacion = motivo.strip()
        movimiento.anulado_en = timezone.now()
        movimiento.anulado_por = propietaria
        movimiento.full_clean()
        movimiento.save()
    return movimiento
