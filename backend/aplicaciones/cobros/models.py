from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from aplicaciones.turnos.models import Turno


class Cobro(models.Model):
    class MetodoPago(models.TextChoices):
        EFECTIVO = "efectivo", "Efectivo"
        TRANSFERENCIA = "transferencia", "Transferencia"
        TARJETA = "tarjeta", "Tarjeta"
        OTRO = "otro", "Otro"

    class Estado(models.TextChoices):
        REGISTRADO = "registrado", "Registrado"
        ANULADO = "anulado", "Anulado"

    propietaria = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cobros",
    )
    turno = models.ForeignKey(Turno, on_delete=models.PROTECT, related_name="cobros")
    importe = models.DecimalField(max_digits=10, decimal_places=2)
    clienta_nombre_historica = models.CharField(max_length=241)
    metodo_pago = models.CharField(max_length=20, choices=MetodoPago.choices)
    detalle_metodo = models.TextField(blank=True)
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.REGISTRADO)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    anulado_en = models.DateTimeField(null=True, blank=True)
    motivo_anulacion = models.TextField(blank=True)
    anulado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cobros_anulados",
    )

    class Meta:
        ordering = ("-creado_en",)
        indexes = [
            models.Index(fields=["propietaria", "creado_en"]),
            models.Index(fields=["propietaria", "estado"]),
            models.Index(fields=["turno"]),
        ]
        constraints = [
            models.CheckConstraint(condition=Q(importe__gt=0), name="cobros_importe_positivo"),
            models.UniqueConstraint(
                fields=["turno"],
                condition=Q(estado="registrado"),
                name="cobros_un_registrado_por_turno",
            ),
        ]

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
            errors["estado"] = "Un cobro registrado no puede tener datos de anulación."
        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f"Cobro #{self.pk} · {self.clienta_nombre_historica} · {self.importe}"
