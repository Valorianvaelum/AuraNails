from django.conf import settings
from django.db import models


class Clienta(models.Model):
    propietaria = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="clientas",
        verbose_name="propietaria",
    )
    nombre = models.CharField("nombre", max_length=120)
    apellido = models.CharField("apellido", max_length=120, blank=True)
    telefono = models.CharField("teléfono", max_length=50, blank=True)
    email = models.EmailField("correo electrónico", blank=True)
    fecha_nacimiento = models.DateField("fecha de nacimiento", null=True, blank=True)
    color_favorito = models.CharField("color favorito", max_length=80, blank=True)
    estilo_favorito = models.CharField("estilo favorito", max_length=120, blank=True)
    notas = models.TextField("notas", blank=True)
    activa = models.BooleanField("activa", default=True)
    creada_en = models.DateTimeField("creada en", auto_now_add=True)
    actualizada_en = models.DateTimeField("actualizada en", auto_now=True)

    class Meta:
        ordering = ("-activa", "nombre", "apellido")
        verbose_name = "clienta"
        verbose_name_plural = "clientas"

    def __str__(self):
        return f"{self.nombre} {self.apellido}".strip()
