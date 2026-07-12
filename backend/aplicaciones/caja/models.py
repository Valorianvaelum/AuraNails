from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from aplicaciones.cobros.models import Cobro


class Caja(models.Model):
    class Estado(models.TextChoices):
        ABIERTA = "abierta", "Abierta"
        CERRADA = "cerrada", "Cerrada"

    propietaria = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cajas",
    )
    saldo_inicial = models.DecimalField(max_digits=10, decimal_places=2)
    observacion_apertura = models.TextField(blank=True)
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.ABIERTA)
    abierta_en = models.DateTimeField(auto_now_add=True)
    cerrada_en = models.DateTimeField(null=True, blank=True)
    saldo_contado = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    saldo_teorico_cierre = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    diferencia = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    observacion_cierre = models.TextField(blank=True)
    resumen_cierre = models.JSONField(default=dict, blank=True)
    cerrada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cajas_cerradas",
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-abierta_en",)
        indexes = [
            models.Index(fields=["propietaria", "estado"]),
            models.Index(fields=["propietaria", "abierta_en"]),
        ]
        constraints = [
            models.CheckConstraint(condition=Q(saldo_inicial__gte=0), name="caja_saldo_inicial_no_negativo"),
            models.UniqueConstraint(
                fields=["propietaria"],
                condition=Q(estado="abierta"),
                name="caja_una_abierta_por_propietaria",
            ),
        ]

    def clean(self):
        errors = {}
        if self.estado == self.Estado.CERRADA:
            for field in ("cerrada_en", "saldo_contado", "saldo_teorico_cierre", "diferencia", "cerrada_por"):
                if getattr(self, field) is None:
                    errors[field] = "Este dato es obligatorio al cerrar la caja."
            if self.diferencia not in (None, 0) and not self.observacion_cierre.strip():
                errors["observacion_cierre"] = "La observación es obligatoria cuando existe diferencia."
        elif any(
            value is not None
            for value in (self.cerrada_en, self.saldo_contado, self.saldo_teorico_cierre, self.diferencia, self.cerrada_por)
        ) or self.observacion_cierre or self.resumen_cierre:
            errors["estado"] = "Una caja abierta no puede tener datos de cierre."
        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f"Caja #{self.pk} · {self.get_estado_display()}"


class GastoCaja(models.Model):
    class Estado(models.TextChoices):
        REGISTRADO = "registrado", "Registrado"
        ANULADO = "anulado", "Anulado"

    caja = models.ForeignKey(Caja, on_delete=models.PROTECT, related_name="gastos")
    concepto = models.CharField(max_length=200)
    importe = models.DecimalField(max_digits=10, decimal_places=2)
    metodo_pago = models.CharField(max_length=20, choices=Cobro.MetodoPago.choices)
    observacion = models.TextField(blank=True)
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.REGISTRADO)
    registrado_en = models.DateTimeField(auto_now_add=True)
    anulado_en = models.DateTimeField(null=True, blank=True)
    motivo_anulacion = models.TextField(blank=True)
    anulado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gastos_caja_anulados",
    )

    class Meta:
        ordering = ("-registrado_en",)
        indexes = [models.Index(fields=["caja", "estado"])]
        constraints = [models.CheckConstraint(condition=Q(importe__gt=0), name="gasto_caja_importe_positivo")]

    def clean(self):
        errors = {}
        if self.estado == self.Estado.ANULADO:
            if not self.anulado_en:
                errors["anulado_en"] = "La fecha de anulación es obligatoria."
            if not self.motivo_anulacion.strip():
                errors["motivo_anulacion"] = "El motivo de anulación es obligatorio."
            if not self.anulado_por_id:
                errors["anulado_por"] = "La responsable de anulación es obligatoria."
        elif self.anulado_en or self.motivo_anulacion or self.anulado_por_id:
            errors["estado"] = "Un gasto registrado no puede tener datos de anulación."
        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f"Gasto de caja #{self.pk} · {self.concepto}"


class MovimientoCaja(models.Model):
    class Tipo(models.TextChoices):
        APORTE = "aporte", "Aporte"
        RETIRO = "retiro", "Retiro"

    class Estado(models.TextChoices):
        REGISTRADO = "registrado", "Registrado"
        ANULADO = "anulado", "Anulado"

    caja = models.ForeignKey(Caja, on_delete=models.PROTECT, related_name="movimientos")
    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    importe = models.DecimalField(max_digits=10, decimal_places=2)
    motivo = models.TextField()
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.REGISTRADO)
    registrado_en = models.DateTimeField(auto_now_add=True)
    anulado_en = models.DateTimeField(null=True, blank=True)
    motivo_anulacion = models.TextField(blank=True)
    anulado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="movimientos_caja_anulados",
    )

    class Meta:
        ordering = ("-registrado_en",)
        indexes = [models.Index(fields=["caja", "estado"])]
        constraints = [models.CheckConstraint(condition=Q(importe__gt=0), name="movimiento_caja_importe_positivo")]

    def clean(self):
        errors = {}
        if self.estado == self.Estado.ANULADO:
            if not self.anulado_en:
                errors["anulado_en"] = "La fecha de anulación es obligatoria."
            if not self.motivo_anulacion.strip():
                errors["motivo_anulacion"] = "El motivo de anulación es obligatorio."
            if not self.anulado_por_id:
                errors["anulado_por"] = "La responsable de anulación es obligatoria."
        elif self.anulado_en or self.motivo_anulacion or self.anulado_por_id:
            errors["estado"] = "Un movimiento registrado no puede tener datos de anulación."
        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f"Movimiento de caja #{self.pk} · {self.get_tipo_display()}"
