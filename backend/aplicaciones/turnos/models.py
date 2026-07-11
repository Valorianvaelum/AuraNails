from django.conf import settings
from django.db import models

from aplicaciones.clientas.models import Clienta
from aplicaciones.servicios.models import Servicio


class Turno(models.Model):
    class Estado(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        CONFIRMADO = "confirmado", "Confirmado"
        REPROGRAMADO = "reprogramado", "Reprogramado"
        CANCELADO = "cancelado", "Cancelado"
        REALIZADO = "realizado", "Realizado"
        NO_VINO = "no_vino", "No vino"

    propietaria = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="turnos",
    )
    clienta = models.ForeignKey(Clienta, on_delete=models.PROTECT, related_name="turnos")
    inicio = models.DateTimeField()
    fin = models.DateTimeField()
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.PENDIENTE)
    notas = models.TextField(blank=True)
    duracion_total_minutos = models.PositiveIntegerField()
    precio_estimado = models.DecimalField(max_digits=10, decimal_places=2)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("inicio",)
        indexes = [
            models.Index(fields=["propietaria", "inicio"]),
            models.Index(fields=["propietaria", "estado"]),
        ]

    def __str__(self):
        return f"{self.clienta} · {self.inicio:%d/%m %H:%M}"


class TurnoServicio(models.Model):
    turno = models.ForeignKey(Turno, on_delete=models.CASCADE, related_name="turno_servicios")
    servicio = models.ForeignKey(Servicio, on_delete=models.PROTECT, related_name="turnos_historicos")
    nombre_servicio = models.CharField(max_length=120)
    duracion_minutos = models.PositiveSmallIntegerField()
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    orden = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("orden",)
