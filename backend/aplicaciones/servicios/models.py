from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Servicio(models.Model):
    propietaria = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="servicios")
    nombre = models.CharField(max_length=120)
    descripcion = models.TextField(blank=True)
    duracion_minutos = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(720)])
    precio = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    activo = models.BooleanField(default=True)
    orden = models.PositiveIntegerField(default=0)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-activo", "orden", "nombre")
        verbose_name = "servicio"
        verbose_name_plural = "servicios"

    def __str__(self):
        return self.nombre
