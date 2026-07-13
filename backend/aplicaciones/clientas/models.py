from django.conf import settings
from django.db import models
from django.db.models import Q
import re


def normalizar_email(value):
    return value.strip().lower()


def normalizar_telefono(value):
    return re.sub(r"\D+", "", value)


def validar_telefono(value):
    telefono = value.strip()
    if not telefono:
        return telefono
    if not re.fullmatch(r"\+?[\d\s()\-]+", telefono):
        raise ValueError("El teléfono solo puede contener números, espacios, guiones, paréntesis y un + inicial.")
    cantidad_digitos = len(normalizar_telefono(telefono))
    if not 7 <= cantidad_digitos <= 15:
        raise ValueError("El teléfono debe contener entre 7 y 15 dígitos.")
    return telefono


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
    telefono_normalizado = models.CharField(max_length=50, blank=True, editable=False)
    email = models.EmailField("correo electrónico", blank=True)
    email_normalizado = models.CharField(max_length=254, blank=True, editable=False)
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
        constraints = [
            models.UniqueConstraint(
                fields=["propietaria", "email_normalizado"],
                condition=Q(email_normalizado__gt=""),
                name="clientas_email_normalizado_unico_por_propietaria",
            ),
            models.UniqueConstraint(
                fields=["propietaria", "telefono_normalizado"],
                condition=Q(telefono_normalizado__gt=""),
                name="clientas_telefono_normalizado_unico_por_propietaria",
            ),
        ]

    def save(self, *args, **kwargs):
        self.email = normalizar_email(self.email)
        self.telefono = self.telefono.strip()
        self.email_normalizado = self.email
        self.telefono_normalizado = normalizar_telefono(self.telefono)
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nombre} {self.apellido}".strip()
