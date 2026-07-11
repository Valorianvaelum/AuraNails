from django.contrib import admin

from .models import Clienta


@admin.register(Clienta)
class ClientaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "apellido", "propietaria", "telefono", "activa", "creada_en")
    list_filter = ("activa",)
    search_fields = ("nombre", "apellido", "telefono", "email")
    list_select_related = ("propietaria",)
    ordering = ("-activa", "nombre", "apellido")
